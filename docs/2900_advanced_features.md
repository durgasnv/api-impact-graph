# Advanced Features: Search, Filtering, Export, Critical Path

## Current Checkout Status and Limits

The frontend portions described here are present in `client/src`: global search, list filtering/sorting/pagination, breadcrumbs, dependency path display, blast-radius CSV/JSON download, critical-path display, and the dashboard health indicator. These rely on REST endpoints provided by the backend. In the current working tree, the route, controller, service, database, and seed implementation files are absent, while `server/src/index.js` still imports them. As a result, these features cannot currently be verified end to end from this checkout.

Global search waits 250 ms after typing, then fetches the complete API, service, and team lists and matches names in the browser. It returns at most eight results. It is not server-side search and may become inefficient for large datasets. List filters, sorting, and pagination are also performed in the browser, with 12 results per page.

The blast-radius export serializes the data currently returned to the page. CSV fields are quoted, but embedded double quotes must also be doubled to be valid CSV; confirm this escaping when restoring or changing the export. The critical-path panel computes a longest chain over the graph assembled for display. The current graph builder creates a placeholder dependency edge from each indirect service to the first direct consumer, so that panel is only an estimate and should not be treated as an authoritative dependency path until the backend returns the actual relationship paths and the frontend uses them.

## What We Added

Global search on dashboard, advanced filtering/sort/pagination on list pages, breadcrumbs on detail pages, PathExplainer for dependency paths, CSV/JSON export for blast radius, critical path highlighting, and a DB health indicator.

## Errors Encountered

### Global search was slow on every keystroke
**Cause:** Each keystroke triggered 3 API calls (APIs, services, teams) immediately.
**Fix:** Added 250ms debounce with `setTimeout` — only fires after the user stops typing for 250ms. Still hits 3 endpoints but only when needed.

### PathExplainer showed "no path" for valid connections
**Cause:** cognodb doesn't support `shortestPath()`. The query returned candidate paths up to depth 8, but the service layer was selecting the first result instead of the shortest.
**Fix:** Sorted candidate paths by `pathNodes.length` in Node.js before returning. The shortest path is now always selected.

### Critical path DFS was infinite on cyclic graphs
**Cause:** Our seed data has no cycles, but the DFS didn't check for visited nodes. If a cycle existed (A→B→A), it would loop forever.
**Fix:** Added `path.includes(next)` check before recursing. Defensive coding even though our data is cycle-free.

### Export CSV had commas in service names breaking the format
**Cause:** Service names like "Payment Processing" don't contain commas, but team names like "Commerce, Platform" would break CSV parsing.
**Fix:** Wrapped all CSV fields in double quotes: `"Commerce, Platform"`. Standard CSV escaping.

### DB health check added latency to dashboard load
**Cause:** `fetchDashboard()` and `fetchHealth()` were called in `Promise.all` — the slower one (health check with DB ping) delayed the entire dashboard.
**Fix:** Accepted the trade-off — the health check adds ~200ms but gives valuable status info. The dashboard data loads fast enough that the total is still under 1s.

## What We Learned

- Debounce is essential for search-as-you-type — 250ms is the sweet spot between responsiveness and API load
- When a graph database doesn't support `shortestPath()`, post-process in the application layer — it's simpler and more portable
- CSV export needs proper escaping even when you control the data — always quote fields
- `Promise.all` is great for parallel loads, but be aware that the slowest call determines total latency
- Critical path analysis (longest chain) is more useful than shortest path for blast radius — it shows the worst-case cascade
- Breadcrumbs are a small CSS/JS addition but dramatically improve navigation UX on detail pages
