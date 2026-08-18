# API Impact Graph

A full-stack web application that models software APIs, services, teams, and their dependencies as a graph. Users can explore blast radius, dependency chains, and team ownership when an API or service changes.

## Why a Graph Database?

The core questions are relationship-oriented: "What depends on this API?", "Which teams are affected?" These require multi-hop traversal over a dependency network — a natural fit for a graph database. **cognodb** stores the data, accessed via the official Neo4j driver using openCypher over Bolt.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 6, React Router 7, react-force-graph-2d |
| Backend | Express.js, Node.js, express-validator |
| Database | cognodb (graph database, Bolt protocol) |
| HTTP Client | Axios |

## Graph Data Model

### Node Types

| Node | Properties | Purpose |
|---|---|---|
| **Team** | id, name | Engineering team |
| **Service** | id, name, description, status | Software service |
| **API** | id, name, description, domain | Logical API |
| **APIVersion** | id, version, status, releaseDate | Concrete API version |

### Relationship Types

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

| Relationship | Direction | Meaning |
|---|---|---|
| `OWNS` | Team → Service | Team is responsible for this service |
| `CALLS` | Service → API | Service consumes this API |
| `DEPENDS_ON` | Service → Service | Service depends on another service |
| `HAS_VERSION` | API → APIVersion | API has this version |
| `REPLACED_BY` | APIVersion → APIVersion | Deprecated version replaced by new version |

### Blast Radius Semantics

`A -[:DEPENDS_ON]-> B` means A depends on B. If B fails, A is affected. Blast-radius traversal follows **incoming** CALLS then **incoming** DEPENDS_ON edges from the target API.

## Architecture

```
Frontend (React + Vite)  ←─ REST/JSON ──→  Backend (Express.js)  ←─ Bolt/Cypher ──→  cognodb
```

### Backend Structure

```
server/src/
  index.js              Express entry, graceful shutdown
  config.js             Environment variables via dotenv
  routes/               One file per resource group
  controllers/          Request handlers (try/catch, error formatting)
  services/             Business logic, Cypher orchestration
  db/
    driver.js           Singleton Neo4j driver
    queries/            Named Cypher query strings
  middleware/
    validate.js         express-validator input validation
  seed/
    seed.js             Idempotent seed script (MERGE-based)
```

**Request flow:** Route → Controller → Service → Named Cypher Query → cognodb

**Key design decisions:**
- No ORM — Cypher queries are explicit and inspectable
- Per-request sessions — opened and closed in `try/finally`
- Singleton driver — one instance, closed on SIGINT/SIGTERM
- All `:id` parameters validated with express-validator
- All Cypher uses `$param` syntax — zero injection risk

## Setup

### Prerequisites

- Node.js >= 18
- A cognodb instance (or local Neo4j)

### Environment

```bash
cp .env.example server/.env
# Edit server/.env with your cognodb credentials
```

`server/.env` variables:

| Variable | Description | Example |
|---|---|---|
| `COGNODB_URI` | Bolt connection URI | `bolt+s://db-xxx.databases.cognodb.com` |
| `COGNODB_USERNAME` | Database username | `cognodb` |
| `COGNODB_PASSWORD` | Database password | (your password) |

### Seed Data

```bash
cd server
node seed/seed.js
```

Creates 20 teams, 94 services, 62 APIs, 112 API versions, and 789 relationships. Fully idempotent — safe to re-run.

### Run

**Backend:**
```bash
cd server
npm install
npm run dev    # Development (nodemon)
# or
npm start      # Production
```

Server runs on port 3001.

**Frontend:**
```bash
cd client
npm install
npm run dev    # Development server (Vite)
```

Vite proxies `/api` requests to `http://localhost:3001`.

### Production Build

```bash
cd client
npm run build
```

Output in `client/dist/` — static files deployable to any static host.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/dashboard` | Aggregate counts (APIs, services, teams, deprecated) |
| GET | `/api/apis` | List all APIs with versions |
| GET | `/api/apis/:id` | API detail with versions |
| GET | `/api/apis/:id/consumers` | Services that directly call this API |
| GET | `/api/apis/:id/blast-radius` | Affected services and teams (accepts `?versionId=`) |
| GET | `/api/services` | List all services |
| GET | `/api/services/:id` | Service detail with teams, APIs, dependencies |
| GET | `/api/services/:id/dependencies` | Multi-hop downstream dependents (1-4 hops) |
| GET | `/api/services/:id/paths/:targetId` | Dependency path between two entities |
| GET | `/api/teams` | List all teams with owned services |
| GET | `/api/teams/:id` | Team detail with owned services |

## Key Cypher Queries

| Query | Purpose | File |
|---|---|---|
| Q-01 API Lookup | Fetch API with all versions | `db/queries/apiLookup.js` |
| Q-02 Direct Consumers | Services that call a specific API | `db/queries/directConsumers.js` |
| Q-03 Multi-Hop Dependencies | Services affected through dependency chains (1-4 hops) | `db/queries/multiHopDependencies.js` |
| Q-04 Blast Radius | Direct + indirect affected services and teams | `db/queries/blastRadius.js` |
| Q-05 Dependency Path | Find path between two entities | `db/queries/dependencyPath.js` |
| Q-06 Replacement Version | Find the replacement for a deprecated API version | `db/queries/replacementVersion.js` |
| Q-07 Service Detail | Service with its teams, APIs, and dependencies | `db/queries/serviceDetail.js` |
| Q-08 Dashboard Aggregates | Total counts across all entity types | `db/queries/dashboard.js` |

## Seed Data Summary

| Entity | Count |
|---|---|
| Teams | 20 |
| Services | 94 |
| APIs | 62 |
| API Versions | 112 |

| Relationship | Count |
|---|---|
| OWNS | 94 |
| CALLS | 239 |
| USES_VERSION | 239 |
| DEPENDS_ON | 69 |
| HAS_VERSION | 112 |
| REPLACED_BY | 50 |

### Verified Dependency Chains

```
Cart → Checkout → Order → Payment Processing → Payment Fraud (4 hops)
Metrics Collector → Dashboard → Reporting → Analytics Ingestion → Data Pipeline (4 hops)
MFA → Auth → User Profile → OAuth (3 hops)
Invoice → Billing → Payment Processing → Ledger (3 hops)
```

## cognodb Compatibility

cognodb does not support `shortestPath()`, `length(path)`, or `size(path)`. Variable-length paths (`*1..N`) and standard Cypher operations (MATCH, MERGE, COLLECT, UNWIND, OPTIONAL MATCH) are supported. See `docs/1300_cognodb_compatibility.md` for details.

## Documentation

Internal documentation is in the `docs/` directory using a numbered naming convention:

| File | Topic |
|---|---|
| `1000_problem_statement.md` | Problem definition and proposed solution |
| `1100_requirement.md` | Full requirements specification |
| `1200_implementation_plan.md` | Implementation plan and phases |
| `1300_cognodb_compatibility.md` | cognodb compatibility notes |
| `1400_architecture_overview.md` | System architecture |
| `1500_graph_data_model.md` | Graph data model documentation |
| `1600_cypher_query_layer.md` | Cypher query documentation |
| `1700_rest_api_layer.md` | REST API documentation |
| `1800_api_browsing_pages.md` | API browsing UI documentation |
| `1900_blast_radius_visualization.md` | Blast radius visualization documentation |
| `2000_graph_visualization_redesign.md` | Graph layout redesign documentation |
| `2100_blast_radius_redesign.md` | Blast radius page redesign documentation |
| `2200_service_team_pages.md` | Service and team pages documentation |
