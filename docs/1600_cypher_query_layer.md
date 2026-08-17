# Cypher Query Layer

## 1. What This Is

The query layer is a set of named Cypher query strings stored in `server/src/db/queries/`. Each file exports a single parameterized Cypher string. The service layer imports these strings and passes them to the Neo4j driver with parameters.

## 2. Why Separate Files

Each query maps to one functional requirement (FR-01 through FR-10). Keeping them in separate files means:
- Each query can be tested independently against CogODB.
- Changes to one query don't risk breaking others.
- The query text is readable without route/controller noise.

## 3. CogODB Constraints

All queries were verified against CogODB. The following Cypher functions are **not used** because CogODB does not support them:

- `shortestPath()`
- `length(path)`
- `size(path)`

Variable-length patterns (`[:DEPENDS_ON*1..4]`), `collect()`, `count()`, `OPTIONAL MATCH`, `UNWIND`, and parameterized `{id: $id}` syntax all work.

## 4. Query Summary

| File | Query | FR | Parameters |
|------|-------|----|------------|
| `apiLookup.js` | Q-01: Find API + versions | FR-02 | `$id` |
| `directConsumers.js` | Q-02: Services calling an API | FR-03 | `$apiId` |
| `multiHopDependencies.js` | Q-03: Services depending on a service (1-4 hops) | FR-04 | `$id` |
| `blastRadius.js` | Q-04: Full blast radius from API version | FR-05 | `$versionId` |
| `dependencyPath.js` | Q-05: Candidate paths between two entities | FR-06 | `$targetId`, `$sourceId` |
| `replacementVersion.js` | Q-06: Replacement for deprecated version | FR-07 | `$id` |
| `serviceDetail.js` | Q-07: Service with teams, APIs, dependencies | FR-02 | `$id` |
| `dashboard.js` | Q-08: Aggregate counts | FR-01 | none |

## 5. Blast Radius Traversal (Q-04)

The core query:

```cypher
MATCH (av:APIVersion {id: $versionId})
MATCH (av)<-[:HAS_VERSION]-(a:API)<-[:CALLS]-(direct:Service)
OPTIONAL MATCH (indirect:Service)-[:DEPENDS_ON*1..4]->(direct)
WITH collect(DISTINCT direct) + collect(DISTINCT indirect) AS allServices
UNWIND allServices AS svc
OPTIONAL MATCH (t:Team)-[:OWNS]->(svc)
RETURN collect(DISTINCT svc) AS services,
       collect(DISTINCT t) AS teams
```

**What it does:**
1. Starts from the selected API version.
2. Walks back to the parent API via `HAS_VERSION`.
3. Follows incoming `CALLS` to find direct consumer services.
4. From each direct consumer, follows incoming `DEPENDS_ON` chains (1-4 hops) to find indirectly affected services.
5. Collects all affected services (deduplicated).
6. Resolves owning teams.

**Verified result (Payment API v1):**
- Direct: Order Service, Checkout Service
- Indirect: Inventory Service, Notification Service, Cart Service
- Teams: Commerce Team, Integration Team

## 6. Dependency Path (Q-05)

Q-05 cannot use `shortestPath()` on CogODB. Instead it returns candidate paths:

```cypher
MATCH path = (target {id: $targetId})-[:DEPENDS_ON|CALLS|HAS_VERSION|REPLACED_BY*1..8]->(source {id: $sourceId})
RETURN [n IN nodes(path) | {id: n.id, label: labels(n)[0]}] AS pathNodes,
       [r IN relationships(path) | type(r)] AS pathRels
LIMIT 10
```

The Node.js service layer selects the shortest candidate by `pathNodes.length`. This keeps all Cypher CogODB-compatible while still delivering the shortest path to the client.

## 7. Dashboard Query (Q-08)

Uses `OPTIONAL MATCH` throughout so the query returns zeros instead of no rows if any node label is empty:

```cypher
OPTIONAL MATCH (a:API)
WITH count(a) AS apiCount
OPTIONAL MATCH (s:Service)
WITH apiCount, count(s) AS serviceCount
...
```

## 8. Verified Counts

| Metric | Count |
|--------|-------|
| APIs | 10 |
| Services | 12 |
| Teams | 5 |
| Deprecated versions | 5 |
| Total nodes | 45 |
| Total relationships | 64 |
