import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { fetchAllApis } from "../api";
import SearchBar from "../components/SearchBar";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
import EmptyState from "../components/EmptyState";
import FilterDropdown from "../components/FilterDropdown";
import SortControls from "../components/SortControls";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 12;

function ApisList() {
  const [apis, setApis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    fetchAllApis()
      .then((res) => { if (!cancelled) setApis(res); })
      .catch(() => { if (!cancelled) setError("Failed to load APIs. Is the server running?"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const domains = useMemo(() => {
    const set = new Set(apis.map((a) => a.domain).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [apis]);

  const processed = useMemo(() => {
    let result = apis;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((a) => a.name.toLowerCase().includes(q));
    }

    if (domainFilter !== "all") {
      result = result.filter((a) => a.domain === domainFilter);
    }

    if (statusFilter !== "all") {
      if (statusFilter === "deprecated") {
        result = result.filter((a) => a.versions.some((v) => v.status === "deprecated"));
      } else {
        result = result.filter((a) => a.versions.every((v) => v.status === "active"));
      }
    }

    result = [...result].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "versions") return b.versions.length - a.versions.length;
      if (sortBy === "domain") return (a.domain || "").localeCompare(b.domain || "");
      return 0;
    });

    return result;
  }, [apis, search, domainFilter, statusFilter, sortBy]);

  const totalPages = Math.ceil(processed.length / PAGE_SIZE);
  const paged = processed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, domainFilter, statusFilter, sortBy]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="page">
      <div className="page-header">
        <h1>APIs</h1>
        <SearchBar value={search} onChange={setSearch} placeholder="Search APIs..." />
      </div>

      <div className="toolbar">
        <FilterDropdown label="Domain" value={domainFilter} onChange={setDomainFilter}
          options={domains.map((d) => ({ value: d, label: d === "all" ? "All domains" : d }))} />
        <FilterDropdown label="Status" value={statusFilter} onChange={setStatusFilter}
          options={[
            { value: "all", label: "All statuses" },
            { value: "active", label: "Active only" },
            { value: "deprecated", label: "Has deprecated versions" }
          ]} />
        <SortControls sortBy={sortBy} onSortChange={setSortBy}
          options={[
            { value: "name", label: "Name" },
            { value: "versions", label: "Version count" },
            { value: "domain", label: "Domain" }
          ]} />
      </div>

      {processed.length === 0 && !search && domainFilter === "all" && statusFilter === "all" && (
        <EmptyState message="No APIs found." />
      )}
      {processed.length === 0 && (search || domainFilter !== "all" || statusFilter !== "all") && (
        <EmptyState message="No APIs match your filters." />
      )}

      <div className="card-list">
        {paged.map((api) => (
          <Link key={api.id} to={`/apis/${api.id}`} className="card-link">
            <div className="entity-card">
              <div className="entity-card-header">
                <h3>{api.name}</h3>
                <span className="badge badge-muted">
                  {api.versions.length} version{api.versions.length !== 1 && "s"}
                </span>
              </div>
              <p className="entity-card-desc">{api.description}</p>
              <div className="entity-card-meta">
                <span className="domain-tag">{api.domain}</span>
                {api.versions.some((v) => v.status === "deprecated") && (
                  <span className="badge badge-deprecated">Has deprecated versions</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

export default ApisList;
