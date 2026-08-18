# Dashboard Page

## What We Built

A landing page showing aggregate stats (APIs, services, teams, deprecated versions), an interactive dependency overview graph of the top 10 APIs by consumer count, and quick navigation cards.

## Key Decisions

- Used `react-force-graph-2d` for the overview graph with actual D3 force simulation (unlike the blast radius page which uses fixed positions)
- Top 10 APIs selected by consumer count — gives the most interesting visual density
- `buildOverviewGraph()` on the server constructs the graph from two parallel Cypher queries rather than one complex query

## Errors Encountered

### Dashboard graph showed empty on first load
**Cause:** The `DASHBOARD_GRAPH` query returned APIs with consumers, but `buildOverviewGraph()` expected the consumers array to always exist. Some APIs had zero consumers.
**Fix:** Added null checks — `consumers || []` before iterating.

### Graph nodes overlapping after force simulation
**Cause:** Default charge strength was too weak for 20+ nodes in a small container.
**Fix:** Tuned D3 forces — charge strength to -140, link distance to 72, velocity decay to 0.35. These values gave the best visual separation without excessive spread.

### Neighbor highlighting felt laggy
**Cause:** `onNodeHover` was recomputing the neighbor Set on every hover event.
**Fix:** Memoized the neighbor Set with `useMemo` keyed on the hovered node and all links.

## What We Learned

- Force-directed graphs need careful tuning — default D3 parameters look messy with real data
- Building the graph on the server (而不是 client) keeps the frontend thin and lets us control which APIs appear
- Two simple Cypher queries + Node.js assembly is often better than one complex Cypher query
