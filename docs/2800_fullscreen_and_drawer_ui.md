# Fullscreen Mode and Slide-In Drawer

## What We Built

The blast radius page supports two modes: a normal side-by-side layout (graph + sidebar) and a fullscreen mode where the graph fills the viewport with a slide-in details drawer.

## Key Decisions

- Fullscreen uses `position: fixed; inset: 0` with high z-index — takes over the viewport without changing the URL or routing
- Sidebar becomes a tabbed drawer (Details/Legend/Tips) in fullscreen — same information, different presentation
- Graph card has a header row with title + controls (−/+/⛶) — cleaner than overlay controls
- Drawer slides in from the right with CSS animation — no JS animation library needed
- Escape key closes drawer first, then exits fullscreen — natural priority

## Errors Encountered

### Graph didn't fill the viewport in fullscreen
**Cause:** The graph component sets an inline `style={{ height }}` via `canvasHeight(nodes)`. CSS `height: 100%` couldn't override inline styles.
**Fix:** Used `!important` in CSS: `.blast-card--fullscreen .graph-container { height: 100% !important }`. Not ideal but necessary when fighting inline styles from a library.

### Fullscreen had padding from parent layout
**Cause:** The `.main` container has `max-width: 1300px` and `padding: 1.75rem 2rem`. The fullscreen overlay was still inside the DOM flow.
**Fix:** Added `.blast-page--fullscreen { max-width: none !important; padding: 0 !important; width: 100vw !important }` to break out of the parent constraints.

### Node clicks stopped working after entering fullscreen
**Cause:** The graph's ResizeObserver detected the viewport change and updated `containerWidth`, but the force-graph component didn't re-render the canvas at the new size.
**Fix:** Called `graphRef.current?.fitView()` after entering fullscreen to force the graph to recalculate and redraw.

### Drawer closed when clicking a node in the graph
**Cause:** The drawer overlay's click handler fired for all clicks within the drawer container, including clicks that propagated from the graph.
**Fix:** Added `pointer-events: none` on the drawer container and `pointer-events: auto` on the overlay and panel — clicks pass through to the graph unless they hit the drawer directly.

## What We Learned

- CSS `!important` is sometimes the only option when a library sets inline styles — fight the library, not the architecture
- `position: fixed` overlays need explicit width/height/padding overrides to break out of parent constraints
- `pointer-events: none/auto` is the clean way to make overlay panels non-blocking for underlying content
- Fullscreen mode is really a layout transformation, not a new page — same component, different CSS class
- The tabbed drawer pattern works well for info panels that need to coexist with a full-screen visualization
