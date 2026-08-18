import { useState, useEffect } from "react";
import { fetchDependencyPath } from "../api";
import LoadingSpinner from "./LoadingSpinner";

function PathExplainer({ sourceId, targetId, sourceName, targetName }) {
  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sourceId || !targetId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchDependencyPath(sourceId, targetId)
      .then((res) => { if (!cancelled) setPath(res); })
      .catch(() => { if (!cancelled) setError("Could not find a dependency path."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [sourceId, targetId]);

  if (loading) return <LoadingSpinner />;
  if (error) return <p className="empty-text">{error}</p>;
  if (!path || !path.pathNodes || path.pathNodes.length === 0) {
    return <p className="empty-text">No dependency path found.</p>;
  }

  return (
    <div className="path-explainer">
      <p className="path-explainer-title">
        Dependency path from <strong>{sourceName}</strong> to <strong>{targetName}</strong>:
      </p>
      <ol className="path-steps">
        {path.pathNodes.map((node, i) => {
          const rel = path.pathRels[i];
          return (
            <li key={i} className="path-step">
              <span className={`path-node path-node-${node.label.toLowerCase()}`}>
                {node.label}: {node.id}
              </span>
              {rel && (
                <span className="path-arrow">
                  <span className="path-rel-type">{rel}</span> →
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default PathExplainer;
