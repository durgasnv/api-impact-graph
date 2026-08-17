# Implementation Plan

## 1. Understanding of the Problem

Modern software systems are composed of interconnected services and APIs. When an API is deprecated, modified, or becomes unavailable, engineering teams need to quickly understand which services, teams, and downstream systems are affected. Relational databases require recursive CTEs and multiple joins to answer these questions, making blast-radius analysis slow and hard to maintain.

The goal is to let a user pick an API or service and instantly see everything that would be affected — the services, the teams, and the exact dependency path connecting them. A graph database is the natural fit because the core operation is relationship traversal, not record lookup.

---

## 2. Proposed Architecture

```
┌──────────────┐       REST        ┌──────────────┐      Bolt/Cypher     ┌──────────┐
│   Frontend   │ ◄──────────────► │   Backend    │ ◄──────────────────► │ CognoDB  │
│ (React/Vite) │                  │  (Express)   │                      │ (Neo4j)  │
└──────────────┘                  └──────────────┘                      └──────────┘
```

**Frontend:** React (Vite) — fast dev server, simple build, component-based. No SSR needed because the app is entirely API-driven with no SEO requirement.

**Backend:** Express.js (Node) — thin REST layer with no ORM, raw Cypher queries executed via the official `neo4j-driver`.

**Database:** CognoDB accessed over the Bolt protocol using openCypher.

**Seed script:** standalone Node script that connects to CognoDB and creates the demonstration dataset.

### Why React + Vite Instead of Next.js

| Concern | Next.js | React + Vite |
|---------|---------|--------------|
| Dev startup | Slower (webpack/turbopack) | Faster (esbuild) |
| Configuration | More (rewrites, config) | Minimal |
| SSR | Built-in | Not included (not needed) |
| File-based routing | Built-in | React Router (explicit, clear) |
| Deployment | Vercel-optimized | Static files, any host |
| Mental overhead | Server/client splitting | Client only |

**Decision:** React + Vite. This is a client-only application that consumes a separate REST API. SSR provides no value — there is no SEO, no social sharing, and no server-rendered data requirement. Vite's faster dev cycle and simpler configuration are more valuable within a 48-hour window. React Router provides clean client-side routing with the same component model.

### Backend Directory Structure

```
server/
  src/
    index.js              # Entry point, starts Express
    config.js             # Environment variable loading
    routes/               # One file per resource group
    controllers/          # Request handlers
    services/             # Business logic and Cypher call orchestration
    db/
      driver.js           # Singleton Neo4j driver instance
      queries/            # Named Cypher query strings
    seed/
      seed.js             # Seed script
```

### Why This Architecture

- **Thin backend:** No ORM means Cypher queries are explicit and inspectable. Each query does exactly what the graph traversal requires.
- **Separation of concerns:** Routes handle HTTP, controllers handle request/response, services handle database interaction and business logic.
- **Singleton driver:** One driver instance is shared across the application, created at startup and closed on shutdown. Sessions are opened per-request and closed immediately after.

---

## 3. Graph Schema

### Node Types

| Label        | Properties                                | Purpose                              |
|-------------|-------------------------------------------|--------------------------------------|
| `Team`       | `id`, `name`                              | Ownership and responsibility         |
| `Service`    | `id`, `name`, `description`, `status`     | Software services in the system      |
| `API`        | `id`, `name`, `description`, `domain`     | Logical API endpoints                |
| `APIVersion` | `id`, `version`, `status`, `releaseDate`  | Specific versions of an API          |

### Relationship Types

```
(:Team)-[:OWNS]->(:Service)
(:Service)-[:CALLS]->(:API)
(:Service)-[:DEPENDS_ON]->(:Service)
(:API)-[:HAS_VERSION]->(:APIVersion)
(:APIVersion)-[:REPLACED_BY]->(:APIVersion)
```

### Visual Schema

```
Team ──OWNS──► Service ──CALLS──► API
                  │                  │
                  │ DEPENDS_ON       │ HAS_VERSION
                  ▼                  ▼
              Service          APIVersion
                                   │
                                   │ REPLACED_BY
                                   ▼
                               APIVersion
```

### Direction Rationale

Every relationship points from the dependent entity toward the entity it depends on (or owns / versioned by):

| Relationship    | From      | To          | Meaning                                |
|----------------|-----------|-------------|----------------------------------------|
| `CALLS`        | Service   | API         | Service consumes the API               |
| `DEPENDS_ON`   | Service   | Service     | Service depends on the other service   |
| `OWNS`         | Team      | Service     | Team owns and is responsible for the service |
| `HAS_VERSION`  | API       | APIVersion  | API has this version                   |
| `REPLACED_BY`  | APIVersion| APIVersion  | Deprecated version has a replacement   |

**Consequence for traversal:** If `A -[:DEPENDS_ON]-> B`, then B is a dependency of A. If B goes down, A is affected. Blast-radius analysis therefore traverses edges **in reverse** — incoming `CALLS` and incoming `DEPENDS_ON` — to find all entities that would be impacted by a failure.

### CogODB Compatibility

CogODB does not support all Cypher functions available in Neo4j. The following functions are **unsupported** and must not be used:

- `shortestPath()`
- `length(path)`
- `size(path)`

Variable-length relationship patterns (`[:DEPENDS_ON*1..4]`), `collect()`, `count()`, `OPTIONAL MATCH`, `UNWIND`, and parameterized queries all work correctly. See `3000_cognodb_compatibility.md` for full details.

---

## 4. Blast Radius Traversal — Detailed Walkthrough

This is the most critical logic in the application. The traversal must be precisely correct.

### Scenario: Payment API v1 becomes unavailable

**Step 1 — Find direct consumers.**

Services that directly call this API are immediately affected. Since `(:Service)-[:CALLS]->(:API)`, we follow incoming `CALLS` edges from the API.

```cypher
(a:API)<-[:CALLS]-(direct:Service)
```

Result (verified): **Order Service**, **Checkout Service**. Both call Payment API directly.

**Step 2 — Find indirectly affected services.**

Services that depend on the direct consumers are indirectly affected, because their dependency broke. Since `(:Service)-[:DEPENDS_ON]->(:Service)` means "the source depends on the target", we follow **incoming** `DEPENDS_ON` edges from each direct consumer to find services whose dependency chain passes through the direct consumer.

```cypher
(indirect:Service)-[:DEPENDS_ON*1..4]->(direct:Service)
```

This finds services that (transitively) depend on the direct consumer. If the direct consumer breaks, they break too.

**Step 3 — Find affected teams.**

For every affected service (direct + indirect), find the team that owns it.

```cypher
(t:Team)-[:OWNS]->(svc:Service)
```

### Verified Blast Radius (Payment API v1)

Verified against CogODB in Phase 2:

```text
Direct consumers (call Payment API):
  - Order Service
  - Checkout Service

Indirectly affected (depend on a direct consumer):
  - Inventory Service     (DEPENDS_ON → Order Service, 1 hop)
  - Notification Service  (DEPENDS_ON → Order Service, 1 hop)
  - Cart Service          (DEPENDS_ON → Checkout Service, 1 hop)

Affected teams:
  - Commerce Team (owns Order, Checkout, Cart, Inventory)
  - Integration Team (owns Notification)
```

### Blast Radius Query (Q-04)

```cypher
MATCH (av:APIVersion {id: $versionId})
MATCH (av)<-[:HAS_VERSION]-(a:API)<-[:CALLS]-(direct:Service)
OPTIONAL MATCH (indirect:Service)-[:DEPENDS_ON*1..4]->(direct)
WITH COLLECT(DISTINCT direct) + COLLECT(DISTINCT indirect) AS allServices
UNWIND allServices AS svc
OPTIONAL MATCH (t:Team)-[:OWNS]->(svc)
RETURN COLLECT(DISTINCT svc) AS services,
       COLLECT(DISTINCT t) AS teams
```

**Step-by-step:**

1. Match the selected API version.
2. Walk back through `HAS_VERSION` to the parent API, then follow incoming `CALLS` edges to find direct consumer services.
3. From each direct consumer, follow incoming `DEPENDS_ON` chains (up to 4 hops) to find services that transitively depend on the direct consumer.
4. Collect all affected services (direct + indirect).
5. Resolve owning teams for every affected service.

**Why this is awkward in a relational database:** The query combines variable-length path traversal (`DEPENDS_ON*1..4`), reverse relationship traversal (incoming `CALLS`), and optional team resolution — all in a single traversal pass. A relational implementation would require recursive CTEs for the variable-length join, a separate join for API consumption, and another left join for team ownership.

---

## 5. API Endpoints

| Method | Path                            | Purpose                           | Returns                                        |
|--------|----------------------------------|-----------------------------------|------------------------------------------------|
| GET    | `/api/health`                    | Health check                      | `{ status: "ok" }`                             |
| GET    | `/api/dashboard`                 | Aggregate counts for dashboard    | `{ apis, services, deprecatedVersions, teams }` |
| GET    | `/api/apis`                      | List all APIs with versions       | Array of API objects                           |
| GET    | `/api/apis/:id`                  | Single API detail with versions   | API object with versions array                 |
| GET    | `/api/apis/:id/blast-radius`     | Blast radius from an API version  | `{ services, teams }`                          |
| GET    | `/api/services`                  | List all services                 | Array of service objects                       |
| GET    | `/api/services/:id`              | Single service detail             | Service object with teams, APIs, dependencies  |
| GET    | `/api/services/:id/dependencies` | Multi-hop dependency traversal    | `{ services, teams }`                          |
| GET    | `/api/services/:id/paths/:targetId` | Dependency path between two services | `{ paths }` (array of path objects)  |
| GET    | `/api/teams`                     | List all teams                    | Array of team objects                          |

### Input Validation

- All `:id` parameters must be non-empty strings, validated with `express-validator` before reaching service logic.
- Query parameters (e.g., `versionId` on blast-radius) are validated similarly.
- Invalid input returns `400` with a descriptive message.

### Error Responses

| Status | Condition                            |
|--------|--------------------------------------|
| 200    | Successful query                     |
| 400    | Invalid input                        |
| 404    | Entity not found                     |
| 500    | Database or internal error           |

Database errors are logged server-side and return a generic `500` message. Raw Cypher errors, connection strings, and credentials are never exposed to the client.

---

## 6. Frontend Pages and Components

### Pages

| Route                              | Page            | Purpose                                      |
|------------------------------------|-----------------|----------------------------------------------|
| `/`                                | Dashboard       | Aggregate stats, navigation to browse        |
| `/apis`                            | API List        | Browse and search all APIs                   |
| `/apis/:id`                        | API Detail      | Versions, consumers, link to blast-radius    |
| `/services`                        | Service List    | Browse and search all services               |
| `/services/:id`                    | Service Detail  | Dependencies, owner team, link to traversal  |
| `/teams`                           | Team List       | List teams with their owned services         |

### Components

| Component              | Purpose                                              |
|------------------------|------------------------------------------------------|
| `EntityCard`           | Reusable card for API, service, or team summary      |
| `GraphVisualization`   | Renders nodes and edges as an interactive graph      |
| `BlastRadiusPanel`     | Shows direct/indirect affected services and teams    |
| `PathExplainer`        | Step-by-step path display for dependency explanation |
| `SearchBar`            | Filters API or service lists by name                 |
| `StatCard`             | Dashboard statistics display                         |
| `LoadingSpinner`       | Loading state indicator                              |
| `EmptyState`           | Message when search or query returns no results      |
| `ErrorBanner`          | User-friendly error message display                  |

### State Handling

- **Loading:** Every page and component that fetches data shows a spinner or skeleton while the request is in progress.
- **Empty:** When a search, list, or query returns zero results, display a clear message explaining nothing was found.
- **Error:** When the backend is unreachable, the database is down, or a query fails, show a friendly error message. Raw errors are not shown to the user.

### Graph Visualization Library

`react-force-graph-2d` is used for rendering dependency graphs. It supports:
- Clickable nodes for navigation.
- Edge labels showing relationship type.
- Zoom and pan.
- Color coding by node type.

---

## 7. Required Cypher Queries

All queries use parameterized inputs via the Neo4j driver. No string concatenation.

### Q-01: API Lookup

Find an API and its available versions.

```cypher
MATCH (a:API {id: $id})
OPTIONAL MATCH (a)-[:HAS_VERSION]->(v:APIVersion)
RETURN a, collect(v) AS versions
```

### Q-02: Direct Consumers

Find services that directly call a selected API.

```cypher
MATCH (s:Service)-[:CALLS]->(a:API {id: $apiId})
RETURN s
```

### Q-03: Multi-Hop Dependency Traversal

Find all services that depend on a given service, up to 4 hops.

```cypher
MATCH (affected:Service)-[:DEPENDS_ON*1..4]->(origin:Service {id: $id})
RETURN DISTINCT affected
```

**Direction:** `affected -[:DEPENDS_ON]-> origin`. The origin is the dependency. If the origin breaks, `affected` is impacted. This follows **incoming** `DEPENDS_ON` edges to the origin.

**Note:** `length(path)` is unsupported by CogODB. Hop counts are calculated in Node.js by running separate queries per depth (1, 2, 3, 4) or by post-processing the variable-length result.

### Q-04: Blast Radius (from API Version)

Starting from a selected API version, identify all directly and indirectly affected services and their teams.

```cypher
MATCH (av:APIVersion {id: $versionId})
MATCH (av)<-[:HAS_VERSION]-(a:API)<-[:CALLS]-(direct:Service)
OPTIONAL MATCH (indirect:Service)-[:DEPENDS_ON*1..4]->(direct)
WITH COLLECT(DISTINCT direct) + COLLECT(DISTINCT indirect) AS allServices
UNWIND allServices AS svc
OPTIONAL MATCH (t:Team)-[:OWNS]->(svc)
RETURN COLLECT(DISTINCT svc) AS services,
       COLLECT(DISTINCT t) AS teams
```

### Q-05: Dependency Path

Return dependency paths between two entities, traversing only the relationships relevant to the dependency model.

**CogODB limitation:** `shortestPath()` is not supported. The query retrieves all candidate paths up to a bounded depth, and the shortest is selected in Node.js.

```cypher
MATCH path = (source {id: $sourceId})-[:DEPENDS_ON|CALLS|HAS_VERSION|REPLACED_BY*1..8]->(target {id: $targetId})
RETURN [n IN nodes(path) | {id: n.id, label: labels(n)[0]}] AS pathNodes,
       [r IN relationships(path) | type(r)] AS pathRels
LIMIT 10
```

**Why these relationship types:** The path must follow the dependency model. `DEPENDS_ON` connects services. `CALLS` connects services to APIs. `HAS_VERSION` connects APIs to versions. `REPLACED_BY` connects versions to versions. `OWNS` is excluded because team ownership is an attribution, not a dependency link.

**Post-processing in Node.js:** The service layer receives candidate paths, computes the shortest by `pathNodes.length`, and returns it. This keeps all Cypher compatible with CogODB while still delivering the shortest path to the client.

### Q-06: Replacement API Version

Find the replacement version for a deprecated API version.

```cypher
MATCH (:APIVersion {id: $id})-[:REPLACED_BY]->(replacement:APIVersion)
RETURN replacement
```

### Q-07: Service Detail with Relationships

Return a service with its owner team, APIs it calls, and services it depends on.

```cypher
MATCH (s:Service {id: $id})
OPTIONAL MATCH (t:Team)-[:OWNS]->(s)
OPTIONAL MATCH (s)-[:CALLS]->(a:API)
OPTIONAL MATCH (s)-[:DEPENDS_ON]->(dep:Service)
RETURN s,
       collect(DISTINCT t) AS teams,
       collect(DISTINCT a) AS apis,
       collect(DISTINCT dep) AS dependencies
```

### Q-08: Dashboard Aggregates

Return aggregate counts for the dashboard.

```cypher
OPTIONAL MATCH (a:API)
WITH count(a) AS apiCount
OPTIONAL MATCH (s:Service)
WITH apiCount, count(s) AS serviceCount
OPTIONAL MATCH (t:Team)
WITH apiCount, serviceCount, count(t) AS teamCount
OPTIONAL MATCH (av:APIVersion {status: 'deprecated'})
RETURN apiCount, serviceCount, teamCount, count(av) AS deprecatedCount
```

Uses `OPTIONAL MATCH` throughout so the query returns zeros instead of no rows if any node label is absent.

---

## 8. Dependencies and Packages

### Backend (`server/`)

| Package              | Purpose                           |
|---------------------|-----------------------------------|
| `express`           | HTTP framework                    |
| `neo4j-driver`      | Official Bolt driver for CognoDB  |
| `cors`              | Cross-origin request handling     |
| `dotenv`            | Environment variable loading      |
| `express-validator` | Input validation                  |

### Frontend (`client/`)

| Package                | Purpose                           |
|-----------------------|-----------------------------------|
| `react` / `react-dom` | UI rendering                      |
| `vite`                | Dev server and build tool         |
| `react-router-dom`    | Client-side routing               |
| `react-force-graph-2d`| Interactive graph visualization   |
| `axios`               | HTTP client for API calls         |

### Dev / Tooling

| Package         | Purpose                     |
|----------------|------------------------------|
| `nodemon`      | Backend hot reload in dev    |
| `concurrently` | Run backend and frontend together |

---

## 9. Potential Ambiguities and Conflicts

### 9.1 Blast Radius Direction

**Question:** Should blast radius follow upstream (who calls this API) or downstream (what does this API depend on)?

**Answer:** Blast radius means "who is affected if I go down." This follows **incoming** edges — services that call the API, then services that depend on those services. From an API, we find services with incoming `CALLS` edges, then follow incoming `DEPENDS_ON` edges from those services to find indirect impact.

The direction is: `(indirectlyAffected)-[:DEPENDS_ON]->(directConsumer)`. The indirectly affected service is the one whose dependency chain passes through the direct consumer.

### 9.2 CALLS vs DEPENDS_ON

**Question:** A Service can both call an API and depend on another Service. Are these treated differently?

**Answer:** Yes. `CALLS` represents API-level consumption (Service → API). `DEPENDS_ON` represents service-to-service dependency (Service → Service). Both are traversed during blast radius, but from different starting points: `CALLS` edges are followed in reverse from the API to find direct consumers; `DEPENDS_ON` edges are then followed in reverse from those consumers to find indirect impact.

### 9.3 REPLACED_BY Direction

**Question:** Does the deprecated version point to its replacement, or does the replacement point back?

**Answer:** The deprecated version points forward: `(:APIVersion {status: "deprecated"})-[:REPLACED_BY]->(:APIVersion {status: "active"})`. This follows the natural forward-time direction.

### 9.4 Shortest Path vs All Paths

**Question:** Should dependency path explanation show the shortest path or all possible paths?

**Answer:** Shortest path. CogODB does not support `shortestPath()`, so the query returns candidate paths up to a bounded depth and the service layer selects the shortest in Node.js. All paths would be overwhelming for larger graphs. Shortest path gives a clean, understandable explanation for the use case.

### 9.5 CognoDB and Neo4j Driver Compatibility

**Question:** Will the official `neo4j-driver` work with CognoDB?

**Answer:** CognoDB speaks the Bolt protocol and supports openCypher. The official driver connects and queries without modification.

### 9.6 Frontend-Backend Communication in Development

**Question:** How does the React frontend talk to the Express backend in dev?

**Answer:** Vite's dev server proxies `/api` requests to `http://localhost:3001` via `vite.config.js` proxy setting. In production, the frontend is deployed as static files and the backend URL is configured via an environment variable baked into the build.

### 9.7 Session Management

**Question:** Should we use long-running sessions or per-request sessions?

**Answer:** Per-request sessions. A session is opened at the start of a request, the query is executed, and the session is closed. This avoids connection leaks and follows the driver's recommended pattern.

### 9.8 DEPENDS_ON Semantics

**Question:** Does `A -[:DEPENDS_ON]-> B` mean "A depends on B" or "B depends on A"?

**Answer:** `A -[:DEPENDS_ON]-> B` means "A depends on B." A is the dependent; B is the dependency. If B breaks, A is affected. This direction is consistent across:
- The graph schema (Section 3)
- The seed data (Section 11)
- All Cypher queries (Section 7)
- The blast radius traversal (Section 4)

---

## 10. Implementation Plan

| Phase | What | Done When |
|-------|------|-----------|
| **1** | **Project scaffold** — Create `server/` and `client/` directories, initialize `package.json` files, set up Express with health check, set up React + Vite, create `.env.example` and `.gitignore`. | Both servers start and respond to requests. |
| **2** | **Database driver and seed data** — Implement singleton Neo4j driver (`db/driver.js`), write seed script with 5+ teams, 10+ services, 10+ APIs, 15+ versions, and all required relationships. | Running `node seed.js` populates CognoDB and the data is queryable via Cypher. |
| **3** | **Core Cypher queries** — Implement Q-01 through Q-08 as named query files in `server/src/db/queries/`. All queries must use only CogODB-compatible Cypher (no `shortestPath`, `length(path)`, or `size(path)`). | Each query runs against seed data and returns expected results. |
| **4** | **REST endpoints** — Implement all routes, controllers, and service layer. Add input validation and error handling. | All endpoints return correct JSON responses via curl or Postman. |
| **5** | **Dashboard page** — Build dashboard with stat cards (total APIs, services, deprecated versions, teams) and navigation links. | Dashboard loads with real counts from the backend. |
| **6** | **API and Service list and detail pages** — Searchable lists, detail views showing versions, consumers, and relationships. | User can browse, search, and click into an API or service. |
| **7** | **Blast-radius view** — Graph visualization with react-force-graph-2d, blast-radius panel showing direct and indirect affected services and teams. | User selects an API version and sees a visual blast-radius. |
| **8** | **Dependency traversal view** — Multi-hop path display with PathExplainer component. | User selects a service and sees the dependency chain with an explanation. |
| **9** | **Polish** — Loading, empty, and error states across all pages. Responsive layout. README with setup instructions, graph model diagram, and query documentation. | Full README, all states handled, UI is clean and responsive. |
| **10** | **Deploy** — Deploy frontend to Vercel or Netlify, backend to Railway or Fly.io, verify end-to-end CognoDB connectivity. | Hosted demo link works end-to-end. |

### Phase Dependencies

- Phases 1 and 2 are sequential prerequisites for everything else.
- Phases 3 and 4 can run in parallel once Phase 2 is complete.
- Phases 5, 6, 7, and 8 depend on Phase 4 but can overlap.
- Phase 9 begins once all functional pages are complete.
- Phase 10 is the final step after Phase 9.

---

## 11. Seed Data Design

The seed script will create a realistic dataset demonstrating meaningful graph traversal.

### Target Counts

- 5+ teams
- 10+ services
- 10+ APIs
- 15+ API versions
- 20+ service-to-API `CALLS` relationships
- Multiple `DEPENDS_ON` chains of 2–4 hops
- At least one deprecated API version with a `REPLACED_BY` relationship

### Domain Groups

- **Payment processing:** Payment API (v1 deprecated, v2 active), Notification API
- **Commerce:** Order Service, Checkout Service, Inventory Service, Cart Service
- **User management:** Auth API (v1, v2), Profile Service, Session Service
- **Analytics:** Analytics API (v1, v2, v3), Reporting Service, Dashboard Service
- **Platform:** Gateway Service, Config Service

### Dependency Chains

**Chain 1 — Payment blast radius (verified in Phase 2):**
```
Payment API v1 (deprecated) ──REPLACED_BY──► Payment API v2 (active)

Order Service ──CALLS──► Payment API
Checkout Service ──CALLS──► Payment API
Checkout Service ──DEPENDS_ON──► Order Service
Cart Service ──DEPENDS_ON──► Checkout Service
Inventory Service ──DEPENDS_ON──► Order Service
Notification Service ──DEPENDS_ON──► Order Service

Commerce Team ──OWNS──► Order Service
Commerce Team ──OWNS──► Checkout Service
Commerce Team ──OWNS──► Cart Service
Commerce Team ──OWNS──► Inventory Service
Integration Team ──OWNS──► Notification Service
```

If Payment API goes down:
- **Direct:** Order Service, Checkout Service (both call Payment API)
- **Indirect:** Inventory Service (depends on Order), Notification Service (depends on Order), Cart Service (depends on Checkout)
- **Teams:** Commerce Team, Integration Team

**Chain 2 — Auth API blast radius (2 hops):**
```
Auth API v1
Auth API v2

Profile Service ──CALLS──► Auth API v1
Session Service ──DEPENDS_ON──► Profile Service
User Team ──OWNS──► Profile Service
User Team ──OWNS──► Session Service
```

**Chain 3 — Analytics (3 hops):**
```
Analytics API v1
Analytics API v2
Analytics API v3

Reporting Service ──CALLS──► Analytics API v3
Dashboard Service ──DEPENDS_ON──► Reporting Service
Metrics Service ──DEPENDS_ON──► Dashboard Service
Analytics Team ──OWNS──► Reporting Service
Analytics Team ──OWNS──► Dashboard Service
Analytics Team ──OWNS──► Metrics Service
```

**Chain 4 — Platform (standalone):**
```
Gateway Service ──DEPENDS_ON──► Config Service
Platform Team ──OWNS──► Gateway Service
Platform Team ──OWNS──► Config Service
```

### Why This Seed Data Works

- Multiple distinct blast-radius scenarios with different depths (2, 3 hops).
- At least one deprecated API with a replacement (Payment API v1 → v2).
- Clear team ownership across all affected services.
- All `DEPENDS_ON` relationships follow the schema: the dependent service points to its dependency.
- Checkout Service is both a direct consumer of Payment API and depends on Order Service — demonstrates the case where an entity appears in both direct and indirect categories.
- No `CALLS` relationships between services — `CALLS` is only used for Service → API.
