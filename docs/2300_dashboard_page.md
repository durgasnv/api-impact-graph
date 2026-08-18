# Dashboard Page

> The landing page of the API Impact Graph application.

## 1. Overview

The dashboard provides a high-level view of the entire dependency landscape. It serves as the entry point for exploring APIs, services, and teams.

## 2. Hero Section

- **Badge:** "Powered by cognodb"
- **Title:** "API Impact" (regular weight) + "Graph" (gradient accent in purple)
- **Subtitle:** Describes the app's purpose — understanding API change impact, exploring dependencies, tracing affected services
- **Action buttons:** "Explore APIs" (primary, links to `/apis`) and "Explore Services" (secondary, links to `/services`)

The hero section fades in on page load with a CSS transition (`fadeInDown` animation).

## 3. Stat Cards

Four statistic cards in a responsive grid:

| Card | Value Source | Color | Icon |
|------|-------------|-------|------|
| APIs | `dashboard.apis` | Indigo (#6366f1) | Link icon |
| Services | `dashboard.services` | Cyan (#0891b2) | Server icon |
| Teams | `dashboard.teams` | Purple (#7c3aed) | Users icon |
| Deprecated | `dashboard.deprecatedVersions` | Orange (#f97316) | Warning icon |

Each card uses a `StatCard` component with staggered slide-in animation (0ms, 100ms, 200ms, 300ms delays).

## 4. Dependency Overview Graph

An interactive force-directed graph showing the top 10 APIs by consumer count, rendered using `DashboardGraph` component.

### Data Source

The `GET /api/dashboard` endpoint runs two Cypher queries in parallel:
1. **DASHBOARD_GRAPH:** Top 10 APIs by consumer count, with their calling services
2. **DASHBOARD_GRAPH_DEPS:** All DEPENDS_ON edges between services

The `buildOverviewGraph()` function in `apiService.js` constructs the client-side graph:
- API nodes include `id`, `label`, `type: "api"`, `domain`, `consumers` (count)
- Service nodes include `id`, `label`, `type: "service"`
- Links include CALLS (service → API) and DEPENDS_ON (service → service)

### Interaction

- **Hover:** Highlights the hovered node and its immediate neighbors. Non-neighbor nodes dim to 18% opacity.
- **Click on API node:** Navigates to `/apis/:id`
- **Click on service node:** Navigates to `/services/:id`
- **Tooltip:** Shows node name, domain, consumer count on hover

### Graph Configuration

- D3 force simulation with `cooldownTicks: 80`, `d3AlphaDecay: 0.04`, `d3VelocityDecay: 0.35`
- Charge strength: -140, link distance: 72, link strength: 0.55
- Fixed height: 340px, responsive width via ResizeObserver
- Custom canvas rendering with node labels (truncated to 16 chars, 28 on hover)

### Legend

Below the graph: API dot (indigo), Service dot (cyan), CALLS line (solid), DEPENDS_ON line (dashed).

## 5. Quick Action Cards

Three navigation cards on the right side of the dashboard grid:

| Card | Target | Icon Color |
|------|--------|-----------|
| Browse APIs | `/apis` | Indigo |
| Browse Services | `/services` | Cyan |
| Browse Teams | `/teams` | Purple |

Each card has an icon, title, description, and animated arrow.

## 6. Data Flow

```
Dashboard mounts
  → fetchDashboard() → GET /api/dashboard
  → Server runs DASHBOARD + DASHBOARD_GRAPH + DASHBOARD_GRAPH_DEPS in parallel
  → Returns { apis, services, teams, deprecatedVersions, graph: { nodes, links } }
  → Client renders hero, stat cards, overview graph, quick actions
```

## 7. Error and Loading States

- **Loading:** Spinner with "Loading..." text
- **Error:** Error banner with message
- **Empty graph:** "No dependency relationships to display yet." with seed instruction

## 8. Components Used

- `DashboardGraph.jsx` — Interactive force-directed graph with neighbor highlighting
- `StatCard.jsx` — Animated stat card with icon and color
- `LoadingSpinner.jsx` — Centered spinner
- `ErrorBanner.jsx` — Error message display
