import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { fetchAllTeams } from "../api";
import SearchBar from "../components/SearchBar";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
import EmptyState from "../components/EmptyState";
import SortControls from "../components/SortControls";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 12;

function TeamsList() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    fetchAllTeams()
      .then((res) => { if (!cancelled) setTeams(res); })
      .catch(() => { if (!cancelled) setError("Failed to load teams. Is the server running?"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const processed = useMemo(() => {
    let result = teams;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.name.toLowerCase().includes(q));
    }

    result = [...result].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "services") return b.services.length - a.services.length;
      return 0;
    });

    return result;
  }, [teams, search, sortBy]);

  const totalPages = Math.ceil(processed.length / PAGE_SIZE);
  const paged = processed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, sortBy]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Teams</h1>
        <SearchBar value={search} onChange={setSearch} placeholder="Search teams..." />
      </div>

      <div className="toolbar">
        <SortControls sortBy={sortBy} onSortChange={setSortBy}
          options={[
            { value: "name", label: "Name" },
            { value: "services", label: "Service count" }
          ]} />
      </div>

      {processed.length === 0 && !search && (
        <EmptyState message="No teams found." />
      )}
      {processed.length === 0 && search && (
        <EmptyState message="No teams match your search." />
      )}

      <div className="card-list">
        {paged.map((t) => (
          <Link key={t.id} to={`/teams/${t.id}`} className="card-link">
            <div className="entity-card">
              <div className="entity-card-header">
                <h3>{t.name}</h3>
                <span className="badge badge-muted">
                  {t.services.length} service{t.services.length !== 1 && "s"}
                </span>
              </div>
              {t.services.length > 0 && (
                <p className="entity-card-desc">
                  {t.services.map((s) => s.name).join(", ")}
                </p>
              )}
              {t.services.length === 0 && (
                <p className="entity-card-desc">No services owned.</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

export default TeamsList;
