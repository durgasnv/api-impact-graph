# REST API Layer

## Current Checkout Status

<<<<<<< Updated upstream
The route, controller, service, query, and validation files described below are present in this checkout. The backend still requires a reachable cognodb instance and valid connection settings to start. The path endpoint responds with `nodes` and `relationships`; the frontend path explorer consumes those fields.
=======
This document describes the REST API and backend design. The implementation files it names under `server/src/routes/`, `server/src/controllers/`, `server/src/services/`, `server/src/db/`, and `server/src/middleware/` are all present, and `server/src/index.js` imports and mounts them. The endpoint details below document working code and can be verified against a running instance.
>>>>>>> Stashed changes

## 1. Architecture

```
Route → Controller → Service → Named Cypher → cognodb
```

Each layer has a single responsibility:

- **Routes** receive HTTP requests, apply validation, delegate to controllers.
- **Controllers** extract params, call services, map errors to HTTP status codes.
- **Services** manage sessions, execute named Cypher queries, transform records.
- **Queries** are parameterized Cypher strings exported from `server/src/db/queries/`.

No Cypher appears in routes or controllers. No HTTP logic appears in services.

## 2. Files

```
server/src/
├── routes/
│   ├── health.js          — GET /api/health
│   ├── apis.js            — GET /api/apis, /:id, /:id/consumers, /:id/blast-radius
│   ├── services.js        — GET /api/services, /:id, /:id/dependencies, /:id/paths/:targetId
│   ├── teams.js           — GET /api/teams
│   └── dashboard.js       — GET /api/dashboard
├── controllers/
│   └── apiController.js   — all controller logic
├── services/
│   └── apiService.js      — all DB access and record transformation
├── middleware/
│   └── validate.js        — express-validator ID param validation
└── db/queries/            — Phase 3 named Cypher strings (unchanged)
```

## 3. Endpoints

| Method | Path | Description | Status Codes |
|--------|------|-------------|--------------|
| GET | `/api/health` | Server health check | 200 |
| GET | `/api/dashboard` | Aggregate counts (APIs, services, teams, deprecated) | 200 |
| GET | `/api/apis` | All APIs with versions | 200 |
| GET | `/api/apis/:id` | Single API with versions | 200, 400, 404 |
| GET | `/api/apis/:id/consumers` | Services that directly call the API | 200, 400 |
| GET | `/api/apis/:id/blast-radius` | Direct + indirect affected services, teams, and graph relationships | 200, 400, 404 |
| GET | `/api/services` | All services | 200 |
| GET | `/api/services/:id` | Service with team, APIs, dependencies | 200, 400, 404 |
| GET | `/api/services/:id/dependencies` | All downstream dependents (1-4 hops) | 200, 400 |
| GET | `/api/services/:id/paths/:targetId` | Shortest dependency path between two entities | 200, 400, 404 |
| GET | `/api/teams` | All teams with owned services | 200 |

## 4. Validation

ID parameters (`:id`, `:targetId`) are validated with express-validator:

```js
param("id").isString().trim().notEmpty()
```

Invalid IDs return HTTP 400 with `{"error": "Invalid ID parameter"}`.

## 5. Error Handling

| Scenario | HTTP | Response |
|----------|------|----------|
| Invalid ID parameter | 400 | `{"error": "Invalid ID parameter"}` |
| Resource not found | 404 | `{"error": "API not found"}` or `{"error": "API or version not found"}` for blast radius |
| No dependency path exists | 404 | `{"error": "No path found"}` |
| Database error | 500 | `{"error": "Internal server error"}` |

Database errors are logged server-side with full details. The client never sees credentials, Cypher, or connection strings.

## 6. Session Management

Every service function opens and closes its own session:

```js
async function runQuery(cypher, params) {
  const driver = getDriver();
  const session = driver.session();
  try {
    const result = await session.run(cypher, params);
    return result.records;
  } finally {
    await session.close();
  }
}
```

No session leaks. No persistent sessions across requests.

## 7. Blast Radius (Q-04)

`GET /api/apis/:id/blast-radius` accepts an optional `?versionId=` query parameter.

Without `versionId`: the service selects the active version, falling back to the first version.

With `versionId`: computes blast radius only if that version belongs to the requested API. Unknown APIs and versions that do not belong to that API return 404.

Verified against cognodb:

- Payment API (no versionId) → active version selected → 5 services, 2 teams
- Payment API (`?versionId=payment-api-v1`) → same result (both versions share consumers)
- Analytics API (`?versionId=analytics-api-v3`) → 3 services, 1 team

## 8. Dependency Path (Q-05)

`GET /api/services/:id/paths/:targetId`

- `:id` is the service whose downstream dependents are being explored.
- `:targetId` is a selected downstream dependent. Because `DEPENDS_ON` points from dependent to dependency, the returned path runs from `:targetId` back to `:id`, matching the stored edge direction.

The Cypher query returns up to 10 candidate paths. The service layer sorts by `nodes.length` and returns the shortest path as `{ nodes, relationships }`.

### Q-05 Direction

The service page starts with an origin service and lets the user choose one of its downstream dependents. Since edges point from dependent to dependency, Cypher traverses from the selected dependent back to the origin:

```
(target)-[:DEPENDS_ON*1..4]->(source)
```

For example, if Cart Service depends on Checkout Service, the stored edge is `Cart Service → Checkout Service`. Exploring Checkout Service's downstream dependents returns the path from Cart Service back to Checkout Service, preserving that stored direction.

## 9. Record Transformation

Services transform raw Neo4j driver records into plain JSON:

```js
// Before (driver record)
record.get("s").properties  // → { id: "order-service", name: "Order Service", ... }

// After (API response)
{
  id: "order-service",
  name: "Order Service",
  teams: [{ id: "commerce-team", name: "Commerce Team" }],
  apis: [{ id: "payment-api", name: "Payment API" }],
  dependencies: []
}
```

Neo4j Integer objects (from `count()`) are converted via `.toNumber()`.

## 10. Dashboard

`GET /api/dashboard` returns zero counts rather than no result:

```json
{
  "apis": 10,
  "services": 12,
  "teams": 5,
  "deprecatedVersions": 5
}
```

This works because Q-08 uses `OPTIONAL MATCH` throughout, so each count aggregates over the full result set rather than filtering to zero rows.
