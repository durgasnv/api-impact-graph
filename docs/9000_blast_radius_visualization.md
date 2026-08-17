# Blast Radius Visualization

## 1. What This Phase Built

The core feature of the application: a blast-radius analysis page that lets users select an API version and visually understand which services are affected, through what paths, and which teams own them.

## 2. Entry Point

Each API version on the API detail page (`/apis/:id`) now has an "Analyze Blast Radius" button that navigates to:

```
/apis/:id/blast-radius?versionId=<versionId>
```

The button is per-version, so users can analyze impact for a specific deprecated or active version.

## 3. Data Flow

```
GET /api/apis/:id              →  API details + versions
GET /api/apis/:id/consumers    →  Direct consumer services
GET /api/apis/:id/blast-radius?versionId=...  →  All affected services + teams
```

All three requests fire in parallel via `Promise.all`. No backend modifications were made.

## 4. Direct vs Indirect Classification

The backend returns all affected services as a flat list. The frontend classifies them:

1. Fetch direct consumers (`GET /api/apis/:id/consumers`)
2. Any service in the blast radius that is also a consumer → **direct**
3. Any service in the blast radius that is NOT a consumer → **indirect**

For the Payment API v1 scenario:
- **Direct**: Order Service, Checkout Service (both call Payment API)
- **Indirect**: Inventory Service, Notification Service, Cart Service (depend on direct consumers)

## 5. Graph Construction

### Nodes

| Type | Color | Shape | Count (Payment API) |
|------|-------|-------|---------------------|
| `api` | Indigo (#6366f1) | Circle | 1 |
| `apiVersion` | Purple (#7c3aed) | Diamond | 1 |
| `direct` | Red (#dc2626) | Circle | 2 |
| `indirect` | Amber (#f59e0b) | Circle | 3 |
| `team` | Cyan (#0891b2) | Square | 2 |

### Edges

| Label | From | To |
|-------|------|----|
| `HAS_VERSION` | API | API Version |
| `CALLS` | Direct Service | API |
| `OWNS` | Team | All affected services |

Edges are drawn with arrows and labeled. The `DEPENDS_ON` relationship is implicit in the indirect classification — the detail panel explains why a service is affected.

## 6. Graph Visualization

Uses `react-force-graph-2d` (already in `package.json`).

Custom canvas rendering for each node type:
- **Shape**: diamond for API versions, square for teams, circle for services
- **Color**: distinct palette per type (see table above)
- **Label**: rendered below each node
- **Arrow**: drawn on each edge pointing toward the target
- **Edge label**: bold text at midpoint

Interaction:
- **Zoom**: mouse wheel
- **Pan**: click and drag
- **Node click**: selects node, shows detail panel

## 7. Layout

```
┌─────────────────────────────────────────────┐
│  Back to Payment API                        │
│  Blast Radius  [Payment API v1] [Deprecated]│
├─────────────────────────────────────────────┤
│  2 Directly   3 Indirectly   2 Teams       │
│  affected     affected       affected       │
├──────────────────────────┬──────────────────┤
│                          │                  │
│   [Force-directed graph] │  Detail Panel    │
│                          │                  │
│   [Legend: API Version   │  Click a node    │
│    Direct, Indirect,     │  to see details  │
│    Team]                 │                  │
└──────────────────────────┴──────────────────┘
```

On mobile (< 640px), the layout stacks vertically:
- Summary → Graph → Details

## 8. Summary Stats

Three stat cards above the graph:

- **Directly affected**: count of services that directly call the API
- **Indirectly affected**: total services minus direct consumers
- **Teams affected**: count of unique teams

All numbers come from the backend response, never hard-coded.

## 9. Node Detail Panel

Clicking a node in the graph shows its details on the right side panel:

| Node Type | Shows |
|-----------|-------|
| API | Name, description, domain, version count |
| API Version | Name, status badge (Active/Deprecated), release date |
| Direct Consumer | Name, "Direct Consumer" badge, description |
| Indirect Service | Name, "Indirect Impact" badge, description |
| Team | Name, "Team" badge |

The panel defaults to "Click a node in the graph to see details." when nothing is selected.

## 10. Legend

A compact legend below the graph explains the four visual types:

- Purple diamond: API Version
- Red circle: Direct Consumer
- Amber circle: Indirect Impact
- Cyan square: Team

## 11. Empty/Error States

| Scenario | Display |
|----------|---------|
| Loading | `LoadingSpinner` |
| No affected services | "No downstream dependencies were found for this API version." |
| Backend error | `ErrorBanner` with user-friendly message |
| API/version not found | Error banner with "API or version not found" |

## 12. Styling

All new styles use existing CSS variables. The graph container has a border and shadow matching the card style. The detail panel is a fixed-width sidebar on desktop that becomes full-width on mobile. Summary stat cards match the dashboard stat cards.
