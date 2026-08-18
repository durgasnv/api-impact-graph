# REST API Layer

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
| GET | `/api/apis/:id/blast-radius` | Direct + indirect affected services and teams | 200, 400, 404 |
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
| Resource not found | 404 | `{"error": "API not found"}` |
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

With `versionId`: computes blast radius for that specific version.

Verified against cognodb:

- Payment API (no versionId) → active version selected → 5 services, 2 teams
- Payment API (`?versionId=payment-api-v1`) → same result (both versions share consumers)
- Analytics API (`?versionId=analytics-api-v3`) → 3 services, 1 team

## 8. Dependency Path (Q-05)

`GET /api/services/:id/paths/:targetId`

- `:id` is the starting service (source).
- `:targetId` is the destination.

The Cypher query returns up to 10 candidate paths. The service layer sorts by `pathNodes.length` and returns the shortest.

### Q-05 Fix

The implementation plan's original Cypher had the traversal direction reversed:

```
(target)-[:...]->(source)   ← plan had this (wrong direction)
(source)-[:...]->(target)   ← fixed to this
```

Graph edges go `cart-service → checkout-service → payment-api`. The original query traversed from `payment-api` to `cart-service` using forward relationship types, which found nothing. The fix traverses from source to target, matching the actual edge directions.

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
