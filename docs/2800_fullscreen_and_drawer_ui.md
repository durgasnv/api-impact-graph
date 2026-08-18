# Fullscreen Mode and Slide-In Drawer

> Blast radius page fullscreen visualization with overlay panel.

## 1. Overview

The blast radius page supports two viewing modes:
- **Normal mode:** Graph card + sidebar (legend, details, tips)
- **Fullscreen mode:** Full-viewport graph + slide-in drawer panel

## 2. Graph Card Container

The graph is wrapped in a dedicated card with a header row:

```
┌─────────────────────────────────────────────────┐
│ Dependency Graph                    −  +  ⛶     │
├─────────────────────────────────────────────────┤
│                                                 │
│                  GRAPH                          │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Structure

```jsx
<div className="blast-card">
  <div className="blast-card-header">
    <span className="blast-card-title">Dependency Graph</span>
    <div className="blast-card-controls">
      <button>− (zoom out)</button>
      <button>+ (zoom in)</button>
      <div className="blast-ctrl-divider" />
      <button>⛶ (fullscreen)</button>
    </div>
  </div>
  <GraphVisualization ... />
</div>
```

### Styling

- Rounded corners (`border-radius: 10px`)
- Clean border (`1px solid var(--color-border)`)
- Subtle shadow (`var(--shadow)`)
- Header has bottom border separator
- Controls: horizontal layout with dividers between zoom and fullscreen

## 3. Zoom Controls

| Button | Action | Implementation |
|--------|--------|---------------|
| − | Zoom out | `graphRef.current.zoomOut()` → `fgRef.zoom(z => z / 1.3)` |
| + | Zoom in | `graphRef.current.zoomIn()` → `fgRef.zoom(z => z * 1.3)` |
| Fit | Fit to view | `graphRef.current.fitView()` → `fgRef.zoomToFit(400, 60)` |

All controls use the existing react-force-graph-2d zoom API via the `forwardRef` + `useImperativeHandle` pattern.

### Accessibility

- `aria-label="Zoom out"`, `aria-label="Zoom in"`, `aria-label="Enter fullscreen"`
- `title` attributes for tooltip support
- `:focus-visible` outline (2px solid primary color)

## 4. Fullscreen Mode

### State Management

```jsx
const [isFullscreen, setIsFullscreen] = useState(false);
const [drawerOpen, setDrawerOpen] = useState(false);
const [drawerTab, setDrawerTab] = useState("details");
```

### Toggle

```jsx
const toggleFullscreen = () => {
  setIsFullscreen((prev) => {
    if (prev) setDrawerOpen(false); // close drawer when exiting
    return !prev;
  });
};
```

### CSS Changes

When `isFullscreen` is true:

| Element | Normal | Fullscreen |
|---------|--------|-----------|
| `.blast-page` | Static flow | `position: fixed; inset: 0; z-index: 200` |
| `.blast-main-layout` | `grid-template-columns: 1fr 290px` | `grid-template-columns: 1fr` |
| `.blast-card` | Bounded width | `flex: 1; min-height: 0` |
| `.blast-graph-canvas` | Calculated height | `height: 100% !important` |
| Sidebar | Visible | Hidden (replaced by drawer) |
| Summary cards | Visible | Hidden |
| Back link | Visible | Hidden |
| Info banner | Visible | Hidden |

### Auto-Fit

When entering fullscreen, the graph auto-fits to the new viewport:

```jsx
useEffect(() => {
  if (isFullscreen) graphRef.current?.fitView();
}, [isFullscreen]);
```

### Keyboard Handling

```jsx
useEffect(() => {
  const onKey = (e) => {
    if (e.key === "Escape") {
      if (drawerOpen) closeDrawer();
      else if (isFullscreen) setIsFullscreen(false);
    }
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [isFullscreen, drawerOpen]);
```

Escape priority: close drawer first, then exit fullscreen.

## 5. Slide-In Drawer

### Appearance

In fullscreen mode, clicking a node opens a slide-in drawer from the right:

```
┌───────────────────────────────────────────┬──────────────┐
│                                           │  Details | Legend | Tips  ✕ │
│                   GRAPH                   │                                      │
│                                           │  [Content]                          │
│                                           │                                      │
└───────────────────────────────────────────┴──────────────┘
```

### Structure

```jsx
{isFullscreen && drawerOpen && (
  <div className="blast-drawer">
    <div className="blast-drawer-overlay" onClick={closeDrawer} />
    <div className="blast-drawer-panel">
      <div className="blast-drawer-header">
        <div className="blast-drawer-tabs">
          <button>Details</button>
          <button>Legend</button>
          <button>Tips</button>
        </div>
        <button className="blast-drawer-close">✕</button>
      </div>
      <div className="blast-drawer-body">
        {/* Tab content */}
      </div>
    </div>
  </div>
)}
```

### Animation

```css
@keyframes blast-slide-in-right {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}

.blast-drawer-panel {
  animation: blast-slide-in-right 0.25s ease;
}
```

The overlay fades in simultaneously:

```css
@keyframes blast-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.blast-drawer-overlay {
  animation: blast-fade-in 0.2s ease;
}
```

### Tabs

| Tab | Content |
|-----|---------|
| Details | Node details (or empty state if no selection) |
| Legend | Node shapes/colors + edge types |
| Tips | 6 interaction tips |

The drawer defaults to "Details" tab when opened by a node click.

### Closing

The drawer closes when:
- The close button (✕) is clicked
- The overlay (background) is clicked
- Escape is pressed (if drawer is open)

### Responsive

- Desktop: 340px wide
- Tablet (≤ 960px): 300px wide
- Mobile (≤ 640px): Full viewport width

## 6. Node Selection Flow

### Normal Mode

1. User clicks a node in the graph
2. `handleNodeClick(node)` is called
3. `setSelectedNode(node)` updates state
4. Graph re-renders with selection ring
5. Sidebar detail panel updates immediately

### Fullscreen Mode

1. User clicks a node in the graph
2. `handleNodeClick(node)` is called
3. `setSelectedNode(node)` updates state
4. `setDrawerOpen(true)` opens the drawer
5. `setDrawerTab("details")` switches to Details tab
6. Drawer slides in with node details

### Stale Data Prevention

The `onNodeClick` callback uses a ref-based pattern in `GraphVisualization.jsx`:

```jsx
const onNodeClickRef = useRef(onNodeClick);
onNodeClickRef.current = onNodeClick;

const handleNodeClick = useCallback((node) => {
  if (onNodeClickRef.current) onNodeClickRef.current(node);
}, []);
```

This ensures the graph always calls the latest callback, even across re-renders.

## 7. Information Preservation

All information available in normal mode is also available in fullscreen:

| Normal Mode | Fullscreen Mode |
|------------|----------------|
| Legend panel | Legend tab in drawer |
| Node Details panel | Details tab in drawer |
| Tips panel | Tips tab in drawer |
| Edge hover details | Edge details in drawer |

No information is lost — it's reorganized into a tabbed drawer.
