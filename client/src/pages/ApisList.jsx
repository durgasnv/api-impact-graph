import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchAllApis } from "../api";
import SearchBar from "../components/SearchBar";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
import EmptyState from "../components/EmptyState";

function ApisList() {
  const [apis, setApis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchAllApis()
      .then((res) => { if (!cancelled) setApis(res); })
      .catch(() => { if (!cancelled) setError("Failed to load APIs. Is the server running?"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;

  const filtered = apis.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-header">
        <h1>APIs</h1>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search APIs..."
        />
      </div>

      {filtered.length === 0 && search && (
        <EmptyState message="No APIs match your search." />
      )}
      {apis.length === 0 && !search && (
        <EmptyState message="No APIs found." />
      )}

      <div className="card-list">
        {filtered.map((api) => (
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
    </div>
  );
}

export default ApisList;
