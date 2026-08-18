import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchServiceById, fetchServiceDependencies } from "../api";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
import Breadcrumbs from "../components/Breadcrumbs";
import PathExplainer from "../components/PathExplainer";

function ServiceDetail() {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [downstream, setDownstream] = useState([]);
  const [targetId, setTargetId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([fetchServiceById(id), fetchServiceDependencies(id)])
      .then(([svc, deps]) => {
        if (!cancelled) { setService(svc); setDownstream(deps); }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.status === 404 ? "Service not found" : "Failed to load service details. Is the server running?");
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;
  if (!service) return null;

  return (
    <div className="page">
      <Breadcrumbs items={[
        { label: "Home", to: "/" },
        { label: "Services", to: "/services" },
        { label: service.name }
      ]} />

      <div className="detail-header">
        <h1>{service.name}</h1>
        <span className={`badge ${service.status === "active" ? "badge-active" : "badge-deprecated"}`}>
          {service.status}
        </span>
      </div>
      <p className="detail-desc">{service.description}</p>

      {service.teams.length > 0 && (
        <section className="detail-section">
          <h2>Owning Team</h2>
          <div className="card-list card-list-compact">
            {service.teams.map((t) => (
              <Link key={t.id} to={`/teams/${t.id}`} className="card-link">
                <div className="entity-card entity-card-sm">
                  <h4>{t.name}</h4>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="detail-section">
        <h2>APIs Called</h2>
        {service.apis.length === 0 ? (
          <p className="empty-text">This service does not call any APIs.</p>
        ) : (
          <div className="card-list card-list-compact">
            {service.apis.map((a) => (
              <Link key={a.id} to={`/apis/${a.id}`} className="card-link">
                <div className="entity-card entity-card-sm">
                  <h4>{a.name}</h4>
                  <p className="entity-card-desc">{a.description}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="detail-section">
        <h2>Depends On</h2>
        {service.dependencies.length === 0 ? (
          <p className="empty-text">This service has no direct dependencies.</p>
        ) : (
          <div className="card-list card-list-compact">
            {service.dependencies.map((d) => (
              <Link key={d.id} to={`/services/${d.id}`} className="card-link">
                <div className="entity-card entity-card-sm">
                  <h4>{d.name}</h4>
                  <p className="entity-card-desc">{d.description}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {downstream.length > 0 && (
        <section className="detail-section">
          <h2>Downstream Dependents</h2>
          <p className="detail-subtitle">
            Services that depend on this service (1-4 hops):
          </p>
          <div className="card-list card-list-compact">
            {downstream.map((d) => (
              <Link key={d.id} to={`/services/${d.id}`} className="card-link">
                <div className="entity-card entity-card-sm">
                  <h4>{d.name}</h4>
                  <p className="entity-card-desc">{d.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {downstream.length > 0 && (
        <section className="detail-section">
          <h2>Dependency Path Explorer</h2>
          <p className="detail-subtitle">Select a downstream service to see the dependency path:</p>
          <select className="filter-select" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
            <option value="">Choose a service...</option>
            {downstream.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          {targetId && (
            <PathExplainer
              sourceId={id}
              targetId={targetId}
              sourceName={service.name}
              targetName={downstream.find((d) => d.id === targetId)?.name || ""}
            />
          )}
        </section>
      )}
    </div>
  );
}

export default ServiceDetail;
