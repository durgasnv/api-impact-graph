import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchApiById, fetchApiConsumers } from "../api";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
import Breadcrumbs from "../components/Breadcrumbs";

function ApiDetail() {
  const { id } = useParams();
  const [apiData, setApiData] = useState(null);
  const [consumers, setConsumers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([fetchApiById(id), fetchApiConsumers(id)])
      .then(([api, cons]) => {
        if (!cancelled) { setApiData(api); setConsumers(cons); }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.status === 404 ? "API not found" : "Failed to load API details. Is the server running?");
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;
  if (!apiData) return null;

  const replacementMap = {};
  apiData.versions.forEach((v) => {
    if (v.replacedBy) replacementMap[v.replacedBy] = v.id;
  });

  return (
    <div className="page">
      <Breadcrumbs items={[
        { label: "Home", to: "/" },
        { label: "APIs", to: "/apis" },
        { label: apiData.name }
      ]} />

      <div className="detail-header">
        <h1>{apiData.name}</h1>
        <span className="domain-tag">{apiData.domain}</span>
      </div>
      <p className="detail-desc">{apiData.description}</p>

      <section className="detail-section">
        <h2>Versions</h2>
        {apiData.versions.length === 0 ? (
          <p className="empty-text">No versions available.</p>
        ) : (
          <div className="version-list">
            {apiData.versions.map((v) => {
              const replacedBy = replacementMap[v.id];
              return (
                <div key={v.id} className="version-item">
                  <div className="version-item-main">
                    <span className="version-name">
                      {apiData.name} v{v.version}
                    </span>
                    <div className="version-item-actions">
                      <span
                        className={`badge ${
                          v.status === "active" ? "badge-active" : "badge-deprecated"
                        }`}
                      >
                        {v.status === "active" ? "Active" : "Deprecated"}
                      </span>
                      <Link
                        to={`/apis/${id}/blast-radius?versionId=${v.id}`}
                        className="btn btn-sm btn-outline"
                      >
                        Analyze Blast Radius
                      </Link>
                    </div>
                  </div>
                  {replacedBy && (
                    <p className="version-replacement">
                      Replaced by {apiData.name} v{apiData.versions.find((x) => x.id === replacedBy)?.version}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="detail-section">
        <h2>Consumers</h2>
        {consumers && consumers.length === 0 ? (
          <p className="empty-text">No services currently consume this API.</p>
        ) : (
          <div className="card-list card-list-compact">
            {consumers &&
              consumers.map((s) => (
                <Link
                  key={s.id}
                  to={`/services/${s.id}`}
                  className="card-link"
                >
                  <div className="entity-card entity-card-sm">
                    <h4>{s.name}</h4>
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

export default ApiDetail;
