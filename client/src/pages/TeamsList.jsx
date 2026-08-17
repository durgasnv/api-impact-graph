import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchAllTeams } from "../api";
import SearchBar from "../components/SearchBar";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
import EmptyState from "../components/EmptyState";

function TeamsList() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchAllTeams()
      .then((res) => { if (!cancelled) setTeams(res); })
      .catch(() => { if (!cancelled) setError("Failed to load teams. Is the server running?"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;

  const filtered = teams.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-header">
        <h1>Teams</h1>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search teams..."
        />
      </div>

      {filtered.length === 0 && search && (
        <EmptyState message="No teams match your search." />
      )}
      {teams.length === 0 && !search && (
        <EmptyState message="No teams found." />
      )}

      <div className="card-list">
        {filtered.map((t) => (
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
    </div>
  );
}

export default TeamsList;
