# Service and Team Pages

## 1. What This Phase Built

Two new browsing experiences: Services and Teams. Each has a searchable list page and a detail page showing relationships.

## 2. File Map

```
client/src/
├── api.js                       — fetchAllServices, fetchServiceById, fetchServiceDependencies, fetchDependencyPath
├── pages/
│   ├── ServicesList.jsx         — list with search, team ownership
│   ├── ServiceDetail.jsx        — detail with team, APIs, dependencies, downstream
│   ├── TeamsList.jsx            — list with search, service count
│   └── TeamDetail.jsx           — detail with owned services
├── App.jsx                      — routes: /services, /services/:id, /teams, /teams/:id
└── components/Layout.jsx        — active states for services/* and teams/*
```

## 3. Services List

`GET /api/services` returns services without team info. To show the owning team, the page also fetches `GET /api/teams` and builds a `serviceId → teamName` mapping client-side.

Each card shows:
- Service name
- Status badge (active/deprecated)
- Description
- Owning team tag (derived from teams data)

## 4. Service Detail

Fetches two endpoints in parallel:
- `GET /api/services/:id` — service info, owning team, APIs called, direct dependencies
- `GET /api/services/:id/dependencies` — downstream dependents (1-4 hops)

Displays four sections:

| Section | Data Source | Empty State |
|---------|-------------|-------------|
| Owning Team | `service.teams` | Hidden when empty |
| APIs Called | `service.apis` | "This service does not call any APIs." |
| Depends On | `service.dependencies` | "This service has no direct dependencies." |
| Downstream Dependents | `dependencies` response | Hidden when empty |

### Graph Semantics

The "Depends On" section preserves the `DEPENDS_ON` direction:

```
Checkout Service -[:DEPENDS_ON]-> Order Service
```

Means Checkout depends on Order. The UI says "Depends On" with Order Service listed — the user sees that Checkout requires Order to function.

## 5. Teams List

`GET /api/teams` already includes owned services. Each card shows:
- Team name
- Service count badge
- Comma-separated list of owned service names

## 6. Team Detail

No dedicated backend endpoint exists. The page fetches `GET /api/teams` and filters client-side by team ID. This avoids adding unnecessary backend architecture for a single-team lookup.

Displays:
- Team name
- Service count
- Owned services as clickable cards linking to `/services/:id`

## 7. Navigation

The Layout component was refactored to use a single `isNested(prefix)` helper:

```js
const isNested = (prefix) =>
  pathname === prefix || pathname.startsWith(prefix + "/");
```

All four nav links (Dashboard, APIs, Services, Teams) now use this pattern for consistent active states on both list and detail pages.

## 8. Reused Components

| Component | Usage |
|-----------|-------|
| SearchBar | Services and Teams list filtering |
| LoadingSpinner | All four pages during fetch |
| ErrorBanner | All four pages on failure |
| EmptyState | No data, no search results |

No new components were created.

## 9. Dependency Path

The `fetchDependencyPath(sourceId, targetId)` function is available in the API client for future use. The service detail page does not currently expose a path-finding UI, but the backend endpoint `GET /api/services/:id/paths/:targetId` is ready for integration.

## 10. Data Flow

```
Services List:
  GET /api/services  →  service cards
  GET /api/teams     →  team ownership mapping

Service Detail:
  GET /api/services/:id            →  service info + team + APIs + deps
  GET /api/services/:id/dependencies  →  downstream dependents

Teams List:
  GET /api/teams  →  team cards with service counts

Team Detail:
  GET /api/teams  →  filter by ID client-side
```
