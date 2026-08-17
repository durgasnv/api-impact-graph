import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchTeamById } from "../api";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";

function TeamDetail() {
  const { id } = useParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchTeamById(id)
      .then((data) => {
        if (!cancelled) setTeam(data);
      })
      .catch(() => { if (!cancelled) setError("Failed to load team data. Is the server running?"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;
  if (!team) return null;

  return (
    <div className="page">
      <Link to="/teams" className="back-link">Back to Teams</Link>

      <div className="detail-header">
        <h1>{team.name}</h1>
        <span className="badge badge-muted">
          {team.services.length} service{team.services.length !== 1 && "s"}
        </span>
      </div>

      <section className="detail-section">
        <h2>Owned Services</h2>
        {team.services.length === 0 ? (
          <p className="empty-text">This team does not own any services.</p>
        ) : (
          <div className="card-list">
            {team.services.map((s) => (
              <Link key={s.id} to={`/services/${s.id}`} className="card-link">
                <div className="entity-card">
                  <div className="entity-card-header">
                    <h3>{s.name}</h3>
                    <span className={`badge ${s.status === "active" ? "badge-active" : "badge-deprecated"}`}>
                      {s.status}
                    </span>
                  </div>
                  <p className="entity-card-desc">{s.description}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default TeamDetail;
