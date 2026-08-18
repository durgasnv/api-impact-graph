import { useRef, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { GRAPH_COLORS } from "../graphColors";

const NODE_RADIUS = { api: 13, apiVersion: 14, direct: 10, indirect: 8, team: 9 };
const LABEL_OFFSET = 6;
const SPACING_X = 200;
const SPACING_Y = 160;
const LINK_HIT_PAD = 6;
const NODE_CLICK_PAD = 10;

function nodePosition(node) {
  return { x: node.x ?? node.fx ?? 0, y: node.y ?? node.fy ?? 0 };
}

function findNodeAt(x, y, nodes) {
  let best = null;
  let bestDist = Infinity;
  for (const node of nodes) {
    const pos = nodePosition(node);
    const r = (NODE_RADIUS[node.type] || 8) + NODE_CLICK_PAD;
    const dist = Math.hypot(pos.x - x, pos.y - y);
    if (dist <= r && dist < bestDist) {
      best = node;
      bestDist = dist;
    }
  }
  return best;
}

function toNodePayload(node) {
  if (!node) return null;
  return { id: node.id, label: node.label, type: node.type };
}

function eventToGraphCoords(fg, event, containerEl) {
  if (!fg?.screen2GraphCoords) return null;
  const canvas = containerEl?.querySelector?.("canvas");
  const rect = (canvas || containerEl)?.getBoundingClientRect?.();
  if (!rect) return null;
  return fg.screen2GraphCoords(event.clientX - rect.left, event.clientY - rect.top);
}

function applyLayout(nodes, links) {
  const levels = new Map();

  for (const n of nodes) {
    if (n.type === "api")         levels.set(n.id, 0);
    else if (n.type === "apiVersion") levels.set(n.id, 1);
    else if (n.type === "direct")     levels.set(n.id, 2);
    else if (n.type === "indirect")   levels.set(n.id, 3);
    else if (n.type === "team")       levels.set(n.id, 4);
    else                              levels.set(n.id, 3);
  }

  for (const l of links) {
    const src = typeof l.source === "object" ? l.source.id : l.source;
    const tgt = typeof l.target === "object" ? l.target.id : l.target;
    const srcNode = nodes.find((n) => n.id === src);
    const tgtNode = nodes.find((n) => n.id === tgt);
    if (srcNode?.type === "team" && tgtNode?.type !== "team") {
      levels.set(src, (levels.get(tgt) ?? 3) + 1);
    }
  }

  const bands = {};
  for (const n of nodes) {
    const lv = levels.get(n.id) ?? 3;
    if (!bands[lv]) bands[lv] = [];
    bands[lv].push(n);
  }

  for (const [lv, band] of Object.entries(bands)) {
    const startX = -(band.length - 1) * SPACING_X * 0.5;
    band.forEach((node, i) => {
      node.x  = startX + i * SPACING_X;
      node.y  = Number(lv) * SPACING_Y;
      node.fx = node.x;
      node.fy = node.y;
    });
  }
}

function canvasHeight(nodes) {
  if (!nodes.length) return 400;
  const ys = nodes.map((n) => n.fy ?? n.y ?? 0);
  return Math.max(Math.max(...ys) - Math.min(...ys) + 280, 500);
}

function drawNode(node, ctx, globalScale, selectedId) {
  const color = GRAPH_COLORS[node.type] || GRAPH_COLORS.direct;
  const r = NODE_RADIUS[node.type] || 8;
  const isSelected = node.id === selectedId;
  const isDark = document.querySelector(".app")?.classList.contains("dark");
  const labelColor = isDark ? "#e2e8f0" : "#1e293b";
  const strokeColor = isDark ? "#334155" : "#ffffff";

  if (isSelected) {
    ctx.beginPath();
    ctx.arc(node.x, node.y, r + 6, 0, 2 * Math.PI);
    ctx.fillStyle = `${color.fill}33`;
    ctx.fill();
    ctx.strokeStyle = color.fill;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.beginPath();
  if (node.type === "apiVersion") {
    ctx.moveTo(node.x, node.y - r);
    ctx.lineTo(node.x + r, node.y);
    ctx.lineTo(node.x, node.y + r);
    ctx.lineTo(node.x - r, node.y);
    ctx.closePath();
  } else if (node.type === "team") {
    const s = r * 1.85;
    const rx2 = 3;
    ctx.moveTo(node.x - s/2 + rx2, node.y - s/2);
    ctx.lineTo(node.x + s/2 - rx2, node.y - s/2);
    ctx.quadraticCurveTo(node.x + s/2, node.y - s/2, node.x + s/2, node.y - s/2 + rx2);
    ctx.lineTo(node.x + s/2, node.y + s/2 - rx2);
    ctx.quadraticCurveTo(node.x + s/2, node.y + s/2, node.x + s/2 - rx2, node.y + s/2);
    ctx.lineTo(node.x - s/2 + rx2, node.y + s/2);
    ctx.quadraticCurveTo(node.x - s/2, node.y + s/2, node.x - s/2, node.y + s/2 - rx2);
    ctx.lineTo(node.x - s/2, node.y - s/2 + rx2);
    ctx.quadraticCurveTo(node.x - s/2, node.y - s/2, node.x - s/2 + rx2, node.y - s/2);
    ctx.closePath();
  } else {
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
  }
  ctx.fillStyle = color.fill;
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = isSelected ? 3 : 2.5;
  ctx.stroke();

  const fontSize = Math.max(11 / globalScale, 2);
  ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = labelColor;

  const lines = (node.label || "").split("\n");
  const lineH = fontSize * 1.35;
  const yStart = node.y + r + LABEL_OFFSET / globalScale;
  lines.forEach((line, i) => {
    ctx.fillText(line, node.x, yStart + i * lineH);
  });
}

function drawLink(link, ctx, hoveredLinkId) {
  const sx = link.source.x;
  const sy = link.source.y;
  const tx = link.target.x;
  const ty = link.target.y;
  if (sx === tx && sy === ty) return;

  const isHovered = link.id === hoveredLinkId;
  const zoom = ctx.getTransform().a || 1;
  const label = link.label || "";
  const isDark = document.querySelector(".app")?.classList.contains("dark");
  const linkColor = isDark ? "#475569" : "#94a3b8";
  const hoverColor = isDark ? "#94a3b8" : "#64748b";
  const hoverStroke = isDark ? "#cbd5e1" : "#475569";

  if (label === "DEPENDS_ON")     ctx.setLineDash([6 / zoom, 3 / zoom]);
  else if (label === "OWNS")      ctx.setLineDash([2 / zoom, 3 / zoom]);
  else if (label === "HAS_VERSION") ctx.setLineDash([8 / zoom, 4 / zoom]);
  else                             ctx.setLineDash([]);

  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(tx, ty);
  ctx.strokeStyle = isHovered ? hoverColor : linkColor;
  ctx.lineWidth = (isHovered ? 2 : 1.2) / zoom;
  ctx.stroke();
  ctx.setLineDash([]);

  const angle = Math.atan2(ty - sy, tx - sx);
  const headLen = 8 / zoom;
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(tx - headLen * Math.cos(angle - Math.PI / 6), ty - headLen * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(tx, ty);
  ctx.lineTo(tx - headLen * Math.cos(angle + Math.PI / 6), ty - headLen * Math.sin(angle + Math.PI / 6));
  ctx.strokeStyle = isHovered ? hoverStroke : linkColor;
  ctx.lineWidth = (isHovered ? 2 : 1.5) / zoom;
  ctx.stroke();

  if (isHovered && link.label) {
    const mx = (sx + tx) / 2;
    const my = (sy + ty) / 2;
    const fs = Math.max(10 / zoom, 2);
    ctx.font = `600 ${fs}px -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    const tw = ctx.measureText(label).width;
    const pad = 4 / zoom;
    ctx.fillStyle = isDark ? "#1e293b" : "#ffffffee";
    ctx.fillRect(mx - tw / 2 - pad, my - fs - pad * 2, tw + pad * 2, fs + pad * 2);
    ctx.fillStyle = isDark ? "#e2e8f0" : "#475569";
    ctx.fillText(label, mx, my - 2 / zoom);
  }
}

const GraphVisualization = forwardRef(function GraphVisualization(
  { nodes, links, onNodeClick, onLinkHover, selectedNode, fillParent = false }, ref
) {
  const fgRef = useRef(null);
  const containerRef = useRef(null);
  const pointerDownRef = useRef(null);
  const [hoveredLink, setHoveredLink] = useState(null);
  const [containerWidth, setContainerWidth] = useState(700);
  const [containerHeight, setContainerHeight] = useState(500);
  const [, forceRender] = useState(0);

  const height = useMemo(() => canvasHeight(nodes), [nodes]);
  const graphData = useMemo(() => ({ nodes, links }), [nodes, links]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      if (cr.width > 0) setContainerWidth((w) => (Math.abs(w - cr.width) > 1 ? cr.width : w));
      if (cr.height > 0) setContainerHeight((h) => (Math.abs(h - cr.height) > 1 ? cr.height : h));
    });
    ro.observe(el);
    setContainerWidth(el.offsetWidth || 700);
    setContainerHeight(el.offsetHeight || height);
    return () => ro.disconnect();
  }, [height, fillParent]);

  useMemo(() => {
    if (nodes.length) applyLayout(nodes, links);
  }, [nodes, links]);

  useEffect(() => {
    forceRender((n) => n + 1);
  }, [selectedNode]);

  useImperativeHandle(ref, () => ({
    zoomIn:  () => fgRef.current?.zoom((z) => z * 1.3),
    zoomOut: () => fgRef.current?.zoom((z) => z / 1.3),
    fitView: () => fgRef.current?.zoomToFit(400, 60),
  }), []);

  const handleEngineStop = useCallback(() => {
    fgRef.current?.zoomToFit(400, 60);
  }, []);

  const onNodeClickRef = useRef(onNodeClick);
  onNodeClickRef.current = onNodeClick;

  const emitNodeClick = useCallback((node) => {
    if (onNodeClickRef.current) onNodeClickRef.current(toNodePayload(node));
  }, []);

  const handleNodeClick = useCallback((node) => {
    emitNodeClick(node);
  }, [emitNodeClick]);

  const handleLinkClick = useCallback((link, event) => {
    const pt = eventToGraphCoords(fgRef.current, event, containerRef.current);
    if (!pt) return;
    const nearby = findNodeAt(pt.x, pt.y, nodes);
    if (nearby) emitNodeClick(nearby);
  }, [emitNodeClick, nodes]);

  const handleLinkHover = useCallback((link) => {
    setHoveredLink(link ? (link.id ?? `${link.label}-${link.source?.id}-${link.target?.id}`) : null);
    if (onLinkHover) onLinkHover(link);
  }, [onLinkHover]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onPointerDown = (event) => {
      if (event.button !== 0) return;
      pointerDownRef.current = { x: event.clientX, y: event.clientY };
    };

    const onPointerUp = (event) => {
      const start = pointerDownRef.current;
      pointerDownRef.current = null;
      if (!start || event.button !== 0) return;
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6) return;
      const pt = eventToGraphCoords(fgRef.current, event, el);
      if (!pt) return;
      emitNodeClick(findNodeAt(pt.x, pt.y, nodes));
    };

    el.addEventListener("pointerdown", onPointerDown, true);
    el.addEventListener("pointerup", onPointerUp, true);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown, true);
      el.removeEventListener("pointerup", onPointerUp, true);
    };
  }, [nodes, emitNodeClick]);

  if (nodes.length === 0) {
    return (
      <div className="graph-container blast-graph-empty" ref={containerRef}>
        <div className="blast-graph-empty-inner">
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
          <p>No downstream dependencies found.</p>
          <span>No services currently depend on this API version.</span>
        </div>
      </div>
    );
  }

  const canvasH = Math.max(fillParent ? containerHeight : height, 100);

  return (
    <div
      className="graph-container blast-graph-canvas"
      style={fillParent ? { height: "100%", width: "100%", minHeight: 0, flex: 1 } : { height }}
      ref={containerRef}
    >
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeCanvasObject={(node, ctx, gs) => drawNode(node, ctx, gs, selectedNode?.id)}
        nodeCanvasObjectMode={() => "replace"}
        linkCanvasObject={(link, ctx) => drawLink(link, ctx, hoveredLink)}
        linkCanvasObjectMode={() => "replace"}
        nodePointerAreaPaint={(node, color, ctx) => {
          const r = (NODE_RADIUS[node.type] || 8) + NODE_CLICK_PAD;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        onNodeClick={handleNodeClick}
        onLinkClick={handleLinkClick}
        onLinkHover={handleLinkHover}
        onEngineStop={handleEngineStop}
        onNodeHover={(node) => {
          if (containerRef.current) containerRef.current.style.cursor = node ? "pointer" : "grab";
        }}
        linkPointerAreaPaint={(link, color, ctx) => {
          const sx = link.source.x, sy = link.source.y;
          const tx = link.target.x, ty = link.target.y;
          if (sx === tx && sy === ty) return;
          const srcR = (NODE_RADIUS[link.source.type] || 8) + NODE_CLICK_PAD;
          const tgtR = (NODE_RADIUS[link.target.type] || 8) + NODE_CLICK_PAD;
          const dx = tx - sx, dy = ty - sy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist === 0) return;
          const ux = dx / dist, uy = dy / dist;
          ctx.beginPath();
          ctx.moveTo(sx + ux * srcR, sy + uy * srcR);
          ctx.lineTo(tx - ux * tgtR, ty - uy * tgtR);
          ctx.strokeStyle = color;
          ctx.lineWidth = LINK_HIT_PAD;
          ctx.lineCap = "round";
          ctx.stroke();
        }}
        cooldownTicks={1}
        d3AlphaDecay={1}
        d3VelocityDecay={1}
        width={containerWidth}
        height={canvasH}
        enableZoomPanInteraction={true}
        enableNodeDrag={false}
      />
    </div>
  );
});

export default GraphVisualization;
