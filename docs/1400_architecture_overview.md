# Architecture Overview

## 1. System Diagram

```
┌──────────────────┐         REST (JSON)        ┌──────────────────┐       Bolt / Cypher        ┌──────────┐
│                  │ ◄──────────────────────────► │                  │ ◄────────────────────────► │          │
│  Frontend        │                              │  Backend         │                            │  CogODB  │
│  React + Vite    │                              │  Express.js      │                            │  (Graph) │
│                  │                              │                  │                            │          │
└──────────────────┘                              └──────────────────┘                            └──────────┘
       Client                                         Server                                        Database
```

## 2. Why This Architecture

The application answers relationship-oriented questions: "What depends on this API?" and "Which teams are affected?" These questions require multi-hop graph traversal, not relational joins. A graph database (CogODB) stores the data. A thin Express backend translates HTTP requests into Cypher queries. A React frontend renders the results.

Each layer has a single responsibility:

- **Frontend:** UI rendering, user interaction, state management.
- **Backend:** HTTP routing, input validation, Cypher execution, response formatting.
- **Database:** Graph storage, relationship traversal, constraint enforcement.

## 3. Frontend

**Stack:** React 19, Vite 6, React Router 7.

**Why React + Vite:** The application is API-driven with no server-side rendering requirement. Vite provides faster development startup than Next.js. React Router handles client-side routing without the overhead of file-based SSR.

**Key libraries:**
- `react-force-graph-2d` for interactive graph visualization.
- `axios` for HTTP requests to the backend.

**Development proxy:** Vite proxies `/api` requests to `http://localhost:3001` via `vite.config.js`.

**Build output:** Static files deployable to any static host (Vercel, Netlify, GitHub Pages).

## 4. Backend

**Stack:** Express.js, Node.js.

**Structure:**

```
server/src/
  index.js          — Express entry, driver lifecycle
  config.js         — Environment variables
  routes/           — One file per resource group
  controllers/      — Request handlers
  services/         — Business logic, Cypher orchestration
  db/
    driver.js       — Singleton Neo4j driver
    queries/        — Named Cypher query strings
  seed/
    seed.js         — Repeatable seed script
```

**Key design decisions:**
- **No ORM.** Cypher queries are written explicitly and stored in `db/queries/`. This makes every database operation inspectable and avoids ORM abstraction leaks.
- **Per-request sessions.** Each request opens a Neo4j session, executes queries, and closes the session. No long-lived sessions.
- **Singleton driver.** One `neo4j-driver` instance is created at startup and closed on shutdown (SIGINT/SIGTERM).
- **Input validation.** All `:id` parameters are validated with `express-validator` before reaching service logic.

## 5. Database

**Engine:** CogODB (cloud-hosted, Bolt protocol, openCypher).

**Driver:** `neo4j-driver` (official Neo4j JavaScript driver). Works with CogODB because CogODB speaks the same Bolt + openCypher protocol.

**Connection:** Configured via environment variables (`COGNODB_URI`, `COGNODB_USERNAME`, `COGNODB_PASSWORD`). Never committed to source control.

**Compatibility note:** CogODB does not support `shortestPath()`, `length(path)`, or `size(path)`. See `1300_cognodb_compatibility.md` for details and workarounds.

## 6. Data Flow

```
User clicks "Blast Radius" on Payment API v1
  → Frontend sends GET /api/apis/payment-api/blast-radius?versionId=payment-api-v1
  → Backend validates versionId
  → Backend opens Neo4j session
  → Backend executes Q-04 (blast radius Cypher query)
  → CogODB traverses: APIVersion → API ← CALLS ← Service ← DEPENDS_ON* ← Service
  → Backend formats result as JSON
  → Backend closes session
  → Frontend receives { services, teams }
  → Frontend renders graph + panel
```

## 7. Deployment

```
Frontend (static)  →  Vercel / Netlify
Backend (Node)     →  Railway / Fly.io
Database           →  CogODB (cloud)
```

The frontend build output is static HTML/JS/CSS. The backend is a standard Node.js process. CogODB is already hosted. No containers or infrastructure setup required.
