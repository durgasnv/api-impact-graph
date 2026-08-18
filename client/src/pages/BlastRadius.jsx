import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { fetchApiById, fetchBlastRadius, fetchAllTeams } from "../api";
import GraphVisualization from "../components/GraphVisualization";
import { GRAPH_COLORS } from "../graphColors";

function buildGraph(apiData, version, directIds, blastServices, teamsOwnership) {
  const nodes = [];
  const links = [];

  nodes.push({ id: apiData.id, label: apiData.name, type: "api" });
  nodes.push({ id: version.id, label: `${apiData.name} v${version.version}\n(${version.status === "active" ? "Active" : "Deprecated"})`, type: "apiVersion" });
  links.push({ source: apiData.id, target: version.id, label: "HAS_VERSION" });

  for (const s of directIds) {
    const svc = blastServices.find((x) => x.id === s);
    if (svc) {
      nodes.push({ id: svc.id, label: svc.name, type: "direct" });
      links.push({ source: svc.id, target: version.id, label: "USES_VERSION" });
    }
  }

  const indirectIds = blastServices.filter((s) => !directIds.includes(s.id)).map((s) => s.id);
  for (const s of indirectIds) {
    const svc = blastServices.find((x) => x.id === s);
    if (svc) {
      nodes.push({ id: svc.id, label: svc.name, type: "indirect" });
      // Link indirect services to direct ones that might depend on them
      for (const d of directIds) {
        links.push({ source: svc.id, target: d, label: "DEPENDS_ON" });
        break; // just one link for visual clarity
      }
    }
  }

  const affectedServiceIds = new Set(blastServices.map((s) => s.id));
  for (const t of teamsOwnership) {
    const ownedAffected = t.services.filter((s) => affectedServiceIds.has(s.id));
    if (ownedAffected.length > 0) {
      nodes.push({ id: t.id, label: t.name, type: "team" });
      for (const s of ownedAffected) {
        links.push({ source: t.id, target: s.id, label: "OWNS" });
      }
    }
  }

  const uniqueLinks = [];
  const seen = new Set();
  for (const l of links) {
    const key = `${l.source}-${l.target}-${l.label}`;
    if (!seen.has(key)) { seen.add(key); uniqueLinks.push(l); }
  }
  return { nodes, links: uniqueLinks };
}

const LEGEND_ITEMS = [
  { color: GRAPH_COLORS.apiVersion.fill, shape: "diamond", label: "API Version (Selected)" },
  { color: GRAPH_COLORS.api.fill, shape: "circle", label: "API" },
  { color: GRAPH_COLORS.direct.fill, shape: "circle", label: "Direct Consumer" },
  { color: GRAPH_COLORS.indirect.fill, shape: "circle", label: "Indirect Impact" },
  { color: GRAPH_COLORS.team.fill, shape: "square", label: "Team" },
];

const EDGE_LEGEND = [
  { label: "USES_VERSION", style: "solid-arrow" },
  { label: "DEPENDS_ON", style: "dashed-arrow" },
  { label: "OWNS", style: "dotted" },
  { label: "HAS_VERSION", style: "line" },
];

function BlastSidePanels({ selectedNode, hoveredLink, apiData, blastRadius, teamsOwnership, criticalPath }) {
  return (
    <>
      <div className="blast-panel">
        <h3 className="blast-panel-title">Legend</h3>
        <div className="blast-legend-list">
          {LEGEND_ITEMS.map((item) => (
            <div key={item.label} className="blast-legend-item">
              <span
                className={`blast-legend-shape blast-legend-shape--${item.shape}`}
                style={{ background: item.color }}
              />
              <span className="blast-legend-text">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="blast-legend-divider" />
        <div className="blast-legend-list">
          {EDGE_LEGEND.map((item) => (
            <div key={item.label} className="blast-legend-item blast-legend-edge">
              <span className={`blast-legend-line blast-legend-line--${item.style}`} />
              <span className="blast-legend-text">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="blast-panel">
        {selectedNode ? (
          <>
            <h3 className="blast-panel-title">Node Details</h3>
            <NodeDetail
              node={selectedNode}
              apiData={apiData}
              blastRadius={blastRadius}
              teamsOwnership={teamsOwnership}
            />
          </>
        ) : hoveredLink ? (
          <>
            <h3 className="blast-panel-title">Edge Details</h3>
            <div className="node-detail">
              <div className="node-detail-type-badge">
                <span className="badge badge-muted">{hoveredLink.label}</span>
              </div>
              <p className="node-detail-relationship">
                {typeof hoveredLink.source === "object" ? hoveredLink.source.label : ""}
                <span className="node-detail-arrow">→</span>
                {typeof hoveredLink.target === "object" ? hoveredLink.target.label : ""}
              </p>
            </div>
          </>
        ) : (
          <>
            <h3 className="blast-panel-title">Select a node to see details</h3>
            <div className="node-detail-empty">
              <div className="node-detail-empty-icon">
                <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.3">
                  <circle cx="18" cy="5" r="3"/>
                  <circle cx="6" cy="12" r="3"/>
                  <circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" strokeWidth="1.5"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" strokeWidth="1.5"/>
                </svg>
              </div>
              <p>No node selected</p>
              <span>Click any node in the graph to view details</span>
            </div>
          </>
        )}
      </div>

      {criticalPath && criticalPath.length > 2 && (
        <div className="blast-panel">
          <h3 className="blast-panel-title">Critical Path</h3>
          <p className="blast-critical-desc">Longest dependency chain ({criticalPath.length - 1} hops):</p>
          <ol className="blast-critical-path">
            {criticalPath.map((name, i) => (
              <li key={i} className="blast-critical-step">
                <span className="blast-critical-node">{name}</span>
                {i < criticalPath.length - 1 && <span className="blast-critical-arrow">→</span>}
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="blast-panel blast-tips">
        <h3 className="blast-panel-title">Tips</h3>
        <ul className="blast-tips-list">
          <li>
            <span className="blast-tip-dot" style={{ background: GRAPH_COLORS.direct.fill }} />
            Red nodes are services that directly use this API version
          </li>
          <li>
            <span className="blast-tip-dot" style={{ background: GRAPH_COLORS.indirect.fill }} />
            Orange nodes are services affected indirectly
          </li>
          <li>
            <span className="blast-tip-dot" style={{ background: GRAPH_COLORS.team.fill }} />
            Blue squares represent teams that own services
          </li>
          <li>Click any node to see more information</li>
          <li>Use mouse wheel or +/- to zoom</li>
          <li>Drag to pan around the graph</li>
        </ul>
      </div>
    </>
  );
}

function BlastRadius() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const versionId = searchParams.get("versionId");
  const graphRef = useRef(null);

  const [apiData, setApiData] = useState(null);
  const [blastRadius, setBlastRadius] = useState(null);
  const [teamsOwnership, setTeamsOwnership] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredLink, setHoveredLink] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSelectedNode(null);
    setHoveredLink(null);

    Promise.all([
      fetchApiById(id),
      fetchBlastRadius(id, versionId),
      fetchAllTeams(),
    ])
      .then(([api, blast, teams]) => {
        if (!cancelled) {
          setApiData(api);
          setBlastRadius(blast);
          setTeamsOwnership(teams);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.status === 404
            ? "API or version not found"
            : "Failed to load blast radius data. Is the server running?");
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, versionId]);

  const graphData = useMemo(() => {
    if (!apiData || !blastRadius) return { nodes: [], links: [] };
    const version = versionId
      ? apiData.versions.find((v) => v.id === versionId)
      : apiData.versions.find((v) => v.status === "active") || apiData.versions[0];
    if (!version) return { nodes: [], links: [] };
    return buildGraph(apiData, version, blastRadius.directIds || [], blastRadius.services, teamsOwnership);
  }, [apiData, blastRadius, teamsOwnership, versionId]);

  const version = useMemo(() => {
    if (!apiData) return null;
    if (versionId) return apiData.versions.find((v) => v.id === versionId);
    return apiData.versions.find((v) => v.status === "active") || apiData.versions[0];
  }, [apiData, versionId]);

  const directCount = blastRadius ? (blastRadius.directIds || []).length : 0;
  const indirectCount = blastRadius ? blastRadius.services.length - directCount : 0;
  const affectedServiceIds = blastRadius ? new Set(blastRadius.services.map((s) => s.id)) : new Set();
  const teamCount = teamsOwnership.filter((t) => t.services.some((s) => affectedServiceIds.has(s.id))).length;
  const hasGraph = blastRadius && blastRadius.services.length > 0;

  const criticalPath = useMemo(() => {
    if (!graphData.nodes.length || !graphData.links.length) return null;
    const adj = {};
    for (const l of graphData.links) {
      const src = typeof l.source === "object" ? l.source.id : l.source;
      const tgt = typeof l.target === "object" ? l.target.id : l.target;
      if (!adj[tgt]) adj[tgt] = [];
      adj[tgt].push(src);
    }
    const nodeMap = {};
    for (const n of graphData.nodes) nodeMap[n.id] = n;
    let longest = [];
    const dfs = (nodeId, path) => {
      if (path.length > longest.length) longest = [...path];
      for (const next of (adj[nodeId] || [])) {
        if (!path.includes(next) && nodeMap[next]) {
          dfs(next, [...path, next]);
        }
      }
    };
    const versionNode = graphData.nodes.find((n) => n.type === "apiVersion");
    if (versionNode) dfs(versionNode.id, [versionNode.id]);
    return longest.map((id) => nodeMap[id]?.label?.split("\n")[0] || id);
  }, [graphData]);

  const exportCSV = () => {
    if (!blastRadius) return;
    const directIds = new Set(blastRadius.directIds || []);
    const rows = [["Name", "Type", "Status", "Owner"]];
    for (const s of blastRadius.services) {
      const type = directIds.has(s.id) ? "Direct" : "Indirect";
      const team = teamsOwnership.find((t) => t.services.some((x) => x.id === s.id));
      rows.push([s.name, type, s.status || "active", team?.name || ""]);
    }
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `blast-radius-${apiData.name.replace(/\s+/g, "-")}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    if (!blastRadius) return;
    const directIds = new Set(blastRadius.directIds || []);
    const data = {
      api: apiData.name,
      version: version.version,
      status: version.status,
      services: blastRadius.services.map((s) => {
        const team = teamsOwnership.find((t) => t.services.some((x) => x.id === s.id));
        return { name: s.name, type: directIds.has(s.id) ? "direct" : "indirect", owner: team?.name || "" };
      }),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `blast-radius-${apiData.name.replace(/\s+/g, "-")}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const closeDrawer = () => setDrawerOpen(false);

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    if (isFullscreen && node) setDrawerOpen(true);
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (drawerOpen) { closeDrawer(); }
        else if (isFullscreen) { setIsFullscreen(false); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen, drawerOpen]);

  useEffect(() => {
    setDrawerOpen(isFullscreen);
    if (!isFullscreen) return undefined;
    const t = setTimeout(() => graphRef.current?.fitView(), 80);
    return () => clearTimeout(t);
  }, [isFullscreen]);

  if (loading) {
    return (
      <div className="page">
        <Link to={`/apis/${id}`} className="back-link">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to API
        </Link>
        <div className="blast-loading">
          <div className="spinner" />
          <p>Analyzing dependency graph...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <Link to={`/apis/${id}`} className="back-link">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to API
        </Link>
        <div className="blast-error">
          <div className="blast-error-icon">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="blast-error-title">Unable to load blast radius</p>
          <p className="blast-error-msg">{error}</p>
          <Link to={`/apis/${id}`} className="btn btn-outline" style={{ marginTop: "1rem" }}>Return to API</Link>
        </div>
      </div>
    );
  }

  if (!apiData || !version) return null;

  return (
    <div className={`page blast-page${isFullscreen ? " blast-page--fullscreen" : ""}`}>
      {!isFullscreen && (
        <>
          <Link to={`/apis/${id}`} className="back-link">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to {apiData.name} API
          </Link>

          <div className="blast-header">
            <h1>Blast Radius</h1>
            <div className="blast-header-badges">
              <span className="badge badge-muted blast-version-badge">{apiData.name} v{version.version}</span>
              <span className={`badge ${version.status === "active" ? "badge-active" : "badge-deprecated"}`}>
                {version.status === "active" ? "Active" : "Deprecated"}
              </span>
            </div>
          </div>

          <div className="blast-summary-grid">
            <div className="blast-summary-card">
              <div className="blast-summary-icon blast-summary-icon--direct">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="blast-summary-content">
                <span className="blast-summary-value blast-summary-value--direct">{directCount}</span>
                <span className="blast-summary-label">Directly Affected</span>
                <span className="blast-summary-desc">Services that directly call this API</span>
              </div>
            </div>
            <div className="blast-summary-card">
              <div className="blast-summary-icon blast-summary-icon--indirect">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div className="blast-summary-content">
                <span className="blast-summary-value blast-summary-value--indirect">{indirectCount}</span>
                <span className="blast-summary-label">Indirectly Affected</span>
                <span className="blast-summary-desc">Services affected via dependencies</span>
              </div>
            </div>
            <div className="blast-summary-card">
              <div className="blast-summary-icon blast-summary-icon--teams">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <div className="blast-summary-content">
                <span className="blast-summary-value blast-summary-value--teams">{teamCount}</span>
                <span className="blast-summary-label">Teams Affected</span>
                <span className="blast-summary-desc">Teams that own affected services</span>
              </div>
            </div>
          </div>

          {hasGraph && (
            <div className="blast-export-row">
              <button className="btn btn-sm btn-outline" onClick={exportCSV}>Export CSV</button>
              <button className="btn btn-sm btn-outline" onClick={exportJSON}>Export JSON</button>
            </div>
          )}
        </>
      )}

      {hasGraph && (
        <div className={`blast-main-layout${isFullscreen ? " blast-main-layout--fullscreen" : ""}`}>
          <div className="blast-graph-column">
            {/* ── Graph Card ── */}
            <div className={`blast-card${isFullscreen ? " blast-card--fullscreen" : ""}`}>
              <div className="blast-card-header">
                <span className="blast-card-title">Dependency Graph</span>
                <div className="blast-card-controls">
                  <button
                    onClick={() => graphRef.current?.zoomOut()}
                    className="blast-ctrl-btn"
                    title="Zoom out"
                    aria-label="Zoom out"
                  >
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                    </svg>
                  </button>
                  <button
                    onClick={() => graphRef.current?.zoomIn()}
                    className="blast-ctrl-btn"
                    title="Zoom in"
                    aria-label="Zoom in"
                  >
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                  <div className="blast-ctrl-divider" />
                  {isFullscreen && (
                    <button
                      onClick={() => setDrawerOpen((open) => !open)}
                      className="blast-ctrl-btn"
                      title={drawerOpen ? "Hide info panel" : "Show info panel"}
                      aria-label={drawerOpen ? "Hide info panel" : "Show info panel"}
                    >
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={toggleFullscreen}
                    className="blast-ctrl-btn"
                    title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                    aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                  >
                    {isFullscreen ? (
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                      </svg>
                    ) : (
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5M20.25 3.75h-4.5m4.5 0v4.5M3.75 20.25v-4.5m0 4.5h4.5m12-4.5v4.5m0-4.5h-4.5" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <GraphVisualization
                ref={graphRef}
                nodes={graphData.nodes}
                links={graphData.links}
                onNodeClick={handleNodeClick}
                onLinkHover={setHoveredLink}
                selectedNode={selectedNode}
                fillParent={isFullscreen}
              />
            </div>

            {!isFullscreen && (
              <div className="blast-info-banner">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                <span>This graph shows the potential impact if <strong>{apiData.name} v{version.version}</strong> becomes unavailable or is deprecated.</span>
              </div>
            )}
          </div>

          {/* Normal sidebar */}
          {!isFullscreen && (
            <div className="blast-sidebar">
              <BlastSidePanels
                selectedNode={selectedNode}
                hoveredLink={hoveredLink}
                apiData={apiData}
                blastRadius={blastRadius}
                teamsOwnership={teamsOwnership}
                criticalPath={criticalPath}
              />
            </div>
          )}

          {/* Fullscreen slide-in drawer */}
          {isFullscreen && drawerOpen && (
            <div className="blast-drawer">
              <aside className="blast-drawer-panel">
                <div className="blast-drawer-header">
                  <span className="blast-drawer-title">Graph info</span>
                  <button
                    className="blast-drawer-close"
                    onClick={closeDrawer}
                    title="Close details"
                    aria-label="Close details"
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="blast-drawer-body">
                  <BlastSidePanels
                    selectedNode={selectedNode}
                    hoveredLink={hoveredLink}
                    apiData={apiData}
                    blastRadius={blastRadius}
                    teamsOwnership={teamsOwnership}
                    criticalPath={criticalPath}
                  />
                </div>
              </aside>
            </div>
          )}
        </div>
      )}

      {!hasGraph && !isFullscreen && (
        <div className="blast-empty-banner">
          <div className="blast-empty-inner">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
            <p>No downstream dependencies found for <strong>{apiData.name} v{version.version}</strong>.</p>
            <span>No services currently depend on this API version.</span>
          </div>
        </div>
      )}
    </div>
  );
}

function NodeDetail({ node, apiData, blastRadius, teamsOwnership }) {
  if (node.type === "apiVersion") {
    const ver = apiData.versions.find((v) => v.id === node.id);
    return (
      <div className="node-detail">
        <div className="node-detail-header">
          <span className="blast-legend-shape blast-legend-shape--diamond" style={{ background: GRAPH_COLORS.apiVersion.fill }} />
          <h4>{node.label?.split("\n")[0]}</h4>
        </div>
        <div className="node-detail-fields">
          <div className="node-detail-field">
            <span className="node-detail-key">Status</span>
            <span className={`badge ${ver?.status === "active" ? "badge-active" : "badge-deprecated"}`}>{ver?.status}</span>
          </div>
          {ver?.releaseDate && (
            <div className="node-detail-field">
              <span className="node-detail-key">Released</span>
              <span className="node-detail-val">{ver.releaseDate}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (node.type === "api") {
    return (
      <div className="node-detail">
        <div className="node-detail-header">
          <span className="blast-legend-shape blast-legend-shape--circle" style={{ background: GRAPH_COLORS.api.fill }} />
          <h4>{node.label}</h4>
        </div>
        <p className="node-detail-desc">{apiData.description}</p>
        <div className="node-detail-fields">
          <div className="node-detail-field">
            <span className="node-detail-key">Domain</span>
            <span className="node-detail-val">{apiData.domain}</span>
          </div>
          <div className="node-detail-field">
            <span className="node-detail-key">Versions</span>
            <span className="node-detail-val">{apiData.versions.length}</span>
          </div>
        </div>
      </div>
    );
  }

  if (node.type === "direct") {
    const svc = blastRadius.services.find((s) => s.id === node.id);
    const ownerTeam = teamsOwnership.find((t) => t.services.some((s) => s.id === node.id));
    return (
      <div className="node-detail">
        <div className="node-detail-header">
          <span className="blast-legend-shape blast-legend-shape--circle" style={{ background: GRAPH_COLORS.direct.fill }} />
          <h4>{node.label}</h4>
        </div>
        <div className="node-detail-type-badge">
          <span className="badge badge-deprecated">Direct Consumer</span>
        </div>
        <p className="node-detail-desc">{svc?.description}</p>
        {ownerTeam && (
          <div className="node-detail-field">
            <span className="node-detail-key">Owner</span>
            <span className="node-detail-val">{ownerTeam.name}</span>
          </div>
        )}
      </div>
    );
  }

  if (node.type === "indirect") {
    const svc = blastRadius.services.find((s) => s.id === node.id);
    const ownerTeam = teamsOwnership.find((t) => t.services.some((s) => s.id === node.id));
    return (
      <div className="node-detail">
        <div className="node-detail-header">
          <span className="blast-legend-shape blast-legend-shape--circle" style={{ background: GRAPH_COLORS.indirect.fill }} />
          <h4>{node.label}</h4>
        </div>
        <div className="node-detail-type-badge">
          <span className="badge badge-muted">Indirect Impact</span>
        </div>
        <p className="node-detail-desc">{svc?.description}</p>
        {ownerTeam && (
          <div className="node-detail-field">
            <span className="node-detail-key">Owner</span>
            <span className="node-detail-val">{ownerTeam.name}</span>
          </div>
        )}
      </div>
    );
  }

  if (node.type === "team") {
    const team = teamsOwnership.find((t) => t.id === node.id);
    const ownedServices = team ? team.services.filter((s) =>
      [...blastRadius.services.map((x) => x.id)].includes(s.id)
    ) : [];
    return (
      <div className="node-detail">
        <div className="node-detail-header">
          <span className="blast-legend-shape blast-legend-shape--square" style={{ background: GRAPH_COLORS.team.fill }} />
          <h4>{node.label}</h4>
        </div>
        <div className="node-detail-type-badge">
          <span className="badge badge-team">Team</span>
        </div>
        {ownedServices.length > 0 && (
          <div className="node-detail-services">
            <span className="node-detail-key">Owns</span>
            <div className="node-detail-service-list">
              {ownedServices.map((s) => (
                <span key={s.id} className="node-detail-service-tag">{s.name}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="node-detail">
      <h4>{node.label}</h4>
      <p className="node-detail-desc">Type: {node.type}</p>
    </div>
  );
}

export default BlastRadius;
