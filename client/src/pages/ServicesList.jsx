import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchAllServices, fetchAllTeams } from "../api";
import SearchBar from "../components/SearchBar";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
import EmptyState from "../components/EmptyState";

function ServicesList() {
  const [services, setServices] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

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

  const serviceToTeam = {};
  for (const t of teams) {
    for (const s of t.services) {
      serviceToTeam[s.id] = t.name;
    }
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;

  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-header">
        <h1>Services</h1>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search services..."
        />
      </div>

      {filtered.length === 0 && search && (
        <EmptyState message="No services match your search." />
      )}
      {services.length === 0 && !search && (
        <EmptyState message="No services found." />
      )}

      <div className="card-list">
        {filtered.map((s) => (
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
    </div>
  );
}

export default ServicesList;
