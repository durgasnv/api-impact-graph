# API Impact Graph

Full-stack app modeling APIs, services, teams, and dependencies as a graph. Explore blast radius, dependency chains, and team ownership when an API changes.

## Why a Graph Database?

"Which services break if I deprecate this API?" requires multi-hop traversal over a dependency network — a natural fit for a graph database. cognodb stores the data, accessed via the Neo4j Bolt driver with openCypher.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, React Router, react-force-graph-2d |
| Backend | Express.js, express-validator |
| Database | cognodb (Bolt protocol, openCypher) |

## Graph Model

```
Team ──OWNS──► Service ──CALLS──► API ──HAS_VERSION──► APIVersion
                  │                                      │
                  │ DEPENDS_ON                        REPLACED_BY
                  ▼                                      ▼
              Service                               APIVersion
```

| Relationship | Meaning |
|---|---|
| `OWNS` | Team owns a service |
| `CALLS` | Service calls an API |
| `USES_VERSION` | Service uses a specific API version |
| `DEPENDS_ON` | Service depends on another service |
| `HAS_VERSION` | API has a version |
| `REPLACED_BY` | Deprecated version replaced by newer one |

**Blast radius:** If B fails and `A -[:DEPENDS_ON]-> B`, then A is affected. Traversal follows incoming edges from the target API version.

## Setup

```bash
cp .env.example server/.env   # add cognodb credentials
cd server && npm install && node seed/seed.js   # seed 20 teams, 94 services, 70+ APIs, 789 relationships
npm run dev   # server on :3001
cd ../client && npm install && npm run dev   # Vite on :5173, proxies /api → :3001
```

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/dashboard` | Stats + overview graph |
| `GET /api/apis` | All APIs with versions |
| `GET /api/apis/:id` | API detail + versions |
| `GET /api/apis/:id/consumers` | Direct consumer services |
| `GET /api/apis/:id/blast-radius` | Affected services/teams (`?versionId=` optional) |
| `GET /api/services` | All services |
| `GET /api/services/:id` | Service detail (teams, APIs, deps) |
| `GET /api/services/:id/dependencies` | Multi-hop downstream dependents |
| `GET /api/services/:id/paths/:targetId` | Dependency path between entities |
| `GET /api/teams` | All teams with services |
| `GET /api/teams/:id` | Team detail |

## Key Features

- **Blast radius visualization** — interactive force-directed graph showing direct/indirect consumers, team ownership, fullscreen mode with slide-in details drawer
- **Dashboard** — aggregate stats, dependency overview graph of top 10 APIs, quick navigation
- **Service detail** — teams, APIs called, direct dependencies, multi-hop downstream dependents
- **API detail** — version management, replacement tracking, per-version blast radius
- **Dark mode** — full theme with localStorage persistence
- **Responsive** — works on desktop, tablet, and mobile

## Seed Data

| Entity | Count |
|---|---|
| Teams | 20 |
| Services | 94 |
| APIs | 70 |
| API Versions | 112 |
| Relationships | 789 |

Verified dependency chains go up to 4 hops:
```
Cart → Checkout → Order → Payment Processing → Payment Fraud
Invoice → Billing → Payment Processing → Ledger
Anomaly Detection → Model Serving → Feature Store
```

## cognodb Compatibility

cognodb doesn't support `shortestPath()`, `length(path)`, or `size(path)`. Variable-length paths (`*1..N`) and standard Cypher all work. See `docs/1300_cognodb_compatibility.md`.

## Docs

| File | Topic |
|---|---|
| `1000` | Problem statement |
| `1100` | Requirements |
| `1200` | Implementation plan |
| `1300` | cognodb compatibility |
| `1400` | Architecture |
| `1500` | Graph data model |
| `1600` | Cypher queries |
| `1700` | REST API |
| `1800` | API browsing pages |
| `1900` | Blast radius visualization |
| `2000` | Graph visualization redesign |
| `2100` | Blast radius redesign |
| `2200` | Service & team pages |
| `2300` | Dashboard page (learning log) |
| `2400` | Dark mode & responsive (learning log) |
| `2500` | Seed data design (learning log) |
| `2600` | Error handling (learning log) |
| `2700` | Deployment guide (learning log) |
| `2800` | Fullscreen & drawer UI (learning log) |
