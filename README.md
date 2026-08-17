# API Impact Graph

A full-stack web application that models software APIs, services, teams, and their dependencies as a graph. Users can explore blast radius, dependency chains, and team ownership when an API or service changes.

## Why a Graph Database?

The core questions are relationship-oriented: "What depends on this API?", "Which teams are affected?" These require multi-hop traversal over a dependency network — a natural fit for a graph database. **CogODB** stores the data, accessed via the official Neo4j driver using openCypher over Bolt.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 6, React Router 7, react-force-graph-2d |
| Backend | Express.js, Node.js, express-validator |
| Database | CogODB (graph database, Bolt protocol) |
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
Frontend (React + Vite)  ←─ REST/JSON ──→  Backend (Express.js)  ←─ Bolt/Cypher ──→  CogODB
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

**Request flow:** Route → Controller → Service → Named Cypher Query → CogODB

**Key design decisions:**
- No ORM — Cypher queries are explicit and inspectable
- Per-request sessions — opened and closed in `try/finally`
- Singleton driver — one instance, closed on SIGINT/SIGTERM
- All `:id` parameters validated with express-validator
- All Cypher uses `$param` syntax — zero injection risk

## Setup

### Prerequisites

- Node.js >= 18
- A CogODB instance (or local Neo4j)

### Environment

```bash
cp .env.example server/.env
# Edit server/.env with your CogODB credentials
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

Creates 5 teams, 12 services, 10 APIs, 18 API versions, and 63 relationships. Fully idempotent — safe to re-run.

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
| Teams | 5 |
| Services | 12 |
| APIs | 10 |
| API Versions | 18 |

| Relationship | Count |
|---|---|
| OWNS | 11 |
| CALLS | 21 |
| DEPENDS_ON | 8 |
| HAS_VERSION | 18 |
| REPLACED_BY | 5 |

### Verified Dependency Chains

```
Cart ──DEPENDS_ON──► Checkout ──DEPENDS_ON──► Order ──CALLS──► Payment API (3 hops)
Metrics ──DEPENDS_ON──► Dashboard ──DEPENDS_ON──► Reporting ──CALLS──► Analytics API (3 hops)
Session ──DEPENDS_ON──► Profile ──CALLS──► Auth API (2 hops)
```

## CogODB Compatibility

CogODB does not support `shortestPath()`, `length(path)`, or `size(path)`. Variable-length paths (`*1..N`) and standard Cypher operations (MATCH, MERGE, COLLECT, UNWIND, OPTIONAL MATCH) are supported. See `docs/3000_cognodb_compatibility.md` for details.

## Documentation

Internal documentation is in the `docs/` directory using a numbered naming convention:

| File | Topic |
|---|---|
| `0000_problem_statement.md` | Problem definition and proposed solution |
| `1000_requirement.md` | Full requirements specification |
| `2000_implementation_plan.md` | Implementation plan and phases |
| `3000_cognodb_compatibility.md` | CogODB compatibility notes |
| `4000_architecture_overview.md` | System architecture |
| `5000_graph_data_model.md` | Graph data model documentation |
| `6000_cypher_query_layer.md` | Cypher query documentation |
| `7000_rest_api_layer.md` | REST API documentation |
| `8000_api_browsing_pages.md` | API browsing UI documentation |
| `9000_blast_radius_visualization.md` | Blast radius visualization documentation |
| `10000_service_team_pages.md` | Service and team pages documentation |
| `1100_graph_visualization_redesign.md` | Graph layout redesign documentation |
| `1200_blast_radius_redesign.md` | Blast radius page redesign documentation |
