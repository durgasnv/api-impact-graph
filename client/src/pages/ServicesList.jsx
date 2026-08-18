import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { fetchAllServices, fetchAllTeams } from "../api";
import SearchBar from "../components/SearchBar";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
import EmptyState from "../components/EmptyState";
import FilterDropdown from "../components/FilterDropdown";
import SortControls from "../components/SortControls";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 12;

function ServicesList() {
  const [services, setServices] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchAllServices(), fetchAllTeams()])
      .then(([svcs, tms]) => {
        if (!cancelled) { setServices(svcs); setTeams(tms); }
      })
      .catch(() => { if (!cancelled) setError("Failed to load services. Is the server running?"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const serviceToTeam = useMemo(() => {
    const map = {};
    for (const t of teams) {
      for (const s of t.services) {
        map[s.id] = t.name;
      }
    }
    return map;
  }, [teams]);

  const teamNames = useMemo(() => {
    const set = new Set(teams.map((t) => t.name));
    return ["all", ...Array.from(set).sort()];
  }, [teams]);

  const processed = useMemo(() => {
    let result = services;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(q));
    }

    if (statusFilter !== "all") {
      result = result.filter((s) => s.status === statusFilter);
    }

    if (teamFilter !== "all") {
      const teamServiceIds = new Set(
        teams.find((t) => t.name === teamFilter)?.services.map((s) => s.id) || []
      );
      result = result.filter((s) => teamServiceIds.has(s.id));
    }

    result = [...result].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "status") return a.status.localeCompare(b.status);
      if (sortBy === "team") return (serviceToTeam[a.id] || "").localeCompare(serviceToTeam[b.id] || "");
      return 0;
    });

    return result;
  }, [services, search, statusFilter, teamFilter, sortBy, serviceToTeam, teams]);

  const totalPages = Math.ceil(processed.length / PAGE_SIZE);
  const paged = processed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, statusFilter, teamFilter, sortBy]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Services</h1>
        <SearchBar value={search} onChange={setSearch} placeholder="Search services..." />
      </div>

      <div className="toolbar">
        <FilterDropdown label="Status" value={statusFilter} onChange={setStatusFilter}
          options={[
            { value: "all", label: "All statuses" },
            { value: "active", label: "Active" },
            { value: "deprecated", label: "Deprecated" }
          ]} />
        <FilterDropdown label="Team" value={teamFilter} onChange={setTeamFilter}
          options={teamNames.map((t) => ({ value: t, label: t === "all" ? "All teams" : t }))} />
        <SortControls sortBy={sortBy} onSortChange={setSortBy}
          options={[
            { value: "name", label: "Name" },
            { value: "status", label: "Status" },
            { value: "team", label: "Team" }
          ]} />
      </div>

      {processed.length === 0 && !search && statusFilter === "all" && teamFilter === "all" && (
        <EmptyState message="No services found." />
      )}
      {processed.length === 0 && (search || statusFilter !== "all" || teamFilter !== "all") && (
        <EmptyState message="No services match your filters." />
      )}

      <div className="card-list">
        {paged.map((s) => (
          <Link key={s.id} to={`/services/${s.id}`} className="card-link">
            <div className="entity-card">
              <div className="entity-card-header">
                <h3>{s.name}</h3>
                <span className={`badge ${s.status === "active" ? "badge-active" : "badge-deprecated"}`}>
                  {s.status}
                </span>
              </div>
              <p className="entity-card-desc">{s.description}</p>
              {serviceToTeam[s.id] && (
                <div className="entity-card-meta">
                  <span className="domain-tag">{serviceToTeam[s.id]}</span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

export default ServicesList;
