import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ForceGraph2D from "react-force-graph-2d";
import { GRAPH_COLORS } from "../graphColors";

const NODE_RADIUS = { api: 8, service: 6 };
const GRAPH_HEIGHT = 340;

function linkEnds(link) {
  return {
    source: typeof link.source === "object" ? link.source.id : link.source,
    target: typeof link.target === "object" ? link.target.id : link.target,
  };
}

function DashboardGraph({ graph }) {
  const navigate = useNavigate();
  const fgRef = useRef(null);
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(600);
  const [hovered, setHovered] = useState(null);

  const nodes = graph?.nodes || [];
  const links = graph?.links || [];
  const graphData = useMemo(() => ({ nodes, links }), [nodes, links]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width;
      if (next) setWidth(next);
    });
    ro.observe(el);
    setWidth(el.offsetWidth || 600);
    return () => ro.disconnect();
  }, []);

  const neighborIds = useMemo(() => {
    if (!hovered) return null;
    const ids = new Set([hovered.id]);
    for (const link of links) {
      const { source, target } = linkEnds(link);
      if (source === hovered.id) ids.add(target);
      if (target === hovered.id) ids.add(source);
    }
    return ids;
  }, [hovered, links]);

  useEffect(() => {
    const fg = fgRef.current;
    if (!fg || !nodes.length) return;
    fg.d3Force("charge")?.strength(-140);
    fg.d3Force("link")?.distance(72)?.strength(0.55);
  }, [graphData, nodes.length]);

  const handleEngineStop = useCallback(() => {
    fgRef.current?.zoomToFit(400, 36);
  }, []);

  const handleNodeClick = useCallback((node) => {
    if (node?.type === "api") navigate(`/apis/${node.id}`);
    else if (node?.type === "service") navigate(`/services/${node.id}`);
  }, [navigate]);

  const handleNodeHover = useCallback((node) => {
    setHovered(node ? { id: node.id, label: node.label, type: node.type, domain: node.domain, consumers: node.consumers } : null);
    if (wrapRef.current) wrapRef.current.style.cursor = node ? "pointer" : "grab";
  }, []);

  const drawNode = useCallback((node, ctx, globalScale) => {
    const color = GRAPH_COLORS[node.type] || GRAPH_COLORS.service;
    const r = NODE_RADIUS[node.type] || 6;
    const dimmed = neighborIds && !neighborIds.has(node.id);
    const isHovered = hovered?.id === node.id;
    const isDark = document.querySelector(".app")?.classList.contains("dark");

    ctx.globalAlpha = dimmed ? 0.18 : 1;
    ctx.beginPath();
    ctx.arc(node.x, node.y, r + (isHovered ? 2 : 0), 0, 2 * Math.PI);
    ctx.fillStyle = color.fill;
    ctx.fill();
    ctx.lineWidth = isHovered ? 2.5 : 1.5;
    ctx.strokeStyle = isDark ? "#1e293b" : "#ffffff";
    ctx.stroke();

    const fontSize = Math.max((isHovered ? 11 : 10) / globalScale, 2.4);
    ctx.font = `${isHovered ? 700 : 600} ${fontSize}px Inter, -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = isDark ? "#e2e8f0" : "#334155";
    const label = node.label || "";
    const maxChars = isHovered ? 28 : 16;
    const text = label.length > maxChars ? `${label.slice(0, maxChars - 1)}…` : label;
    ctx.fillText(text, node.x, node.y + r + 4 / globalScale);
    ctx.globalAlpha = 1;
  }, [hovered, neighborIds]);

  const drawLink = useCallback((link, ctx) => {
    const sx = link.source.x;
    const sy = link.source.y;
    const tx = link.target.x;
    const ty = link.target.y;
    if (sx == null || tx == null) return;

    const { source, target } = linkEnds(link);
    const dimmed = neighborIds && !neighborIds.has(source) && !neighborIds.has(target);
    const isDark = document.querySelector(".app")?.classList.contains("dark");
    const zoom = ctx.getTransform().a || 1;
    const dashed = link.label === "DEPENDS_ON";

    ctx.globalAlpha = dimmed ? 0.12 : 0.7;
    if (dashed) ctx.setLineDash([5 / zoom, 4 / zoom]);
    else ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(tx, ty);
    ctx.strokeStyle = isDark ? "#64748b" : "#94a3b8";
    ctx.lineWidth = (dimmed ? 0.8 : 1.15) / zoom;
    ctx.stroke();
    ctx.setLineDash([]);

    const angle = Math.atan2(ty - sy, tx - sx);
    const dist = Math.hypot(tx - sx, ty - sy) || 1;
    const tgtR = (NODE_RADIUS[link.target?.type] || 6) + 1;
    const ex = tx - (tx - sx) / dist * tgtR;
    const ey = ty - (ty - sy) / dist * tgtR;
    const head = 6 / zoom;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - head * Math.cos(angle - Math.PI / 6), ey - head * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - head * Math.cos(angle + Math.PI / 6), ey - head * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
    ctx.globalAlpha = 1;
  }, [neighborIds]);

  if (!nodes.length) {
    return (
      <div className="dashboard-graph-empty">
        <p>No dependency relationships to display yet.</p>
        <span>Seed the graph database to see APIs and the services that call them.</span>
      </div>
    );
  }

  const hint = hovered
    ? hovered.type === "api"
      ? `${hovered.label}${hovered.domain ? ` · ${hovered.domain}` : ""}${hovered.consumers != null ? ` · ${hovered.consumers} consumers` : ""} · Click to open`
      : `${hovered.label} · Service · Click to open`
    : "Hover a node to inspect · Click to open the API or service";

  return (
    <>
      <div className="dashboard-graph-wrap" ref={wrapRef}>
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          width={width}
          height={GRAPH_HEIGHT}
          backgroundColor="transparent"
          nodeCanvasObject={drawNode}
          nodeCanvasObjectMode={() => "replace"}
          linkCanvasObject={drawLink}
          linkCanvasObjectMode={() => "replace"}
          nodePointerAreaPaint={(node, color, ctx) => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, (NODE_RADIUS[node.type] || 6) + 10, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
          }}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          onEngineStop={handleEngineStop}
          linkPointerAreaPaint={() => {}}
          enableNodeDrag={false}
          enableZoomPanInteraction={true}
          cooldownTicks={80}
          d3AlphaDecay={0.04}
          d3VelocityDecay={0.35}
        />
      </div>
      <p className="dashboard-graph-hint">{hint}</p>
    </>
  );
}

export default DashboardGraph;
