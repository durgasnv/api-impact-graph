# cognodb Compatibility

## 1. What Is cognodb

cognodb is a cloud-hosted graph database that speaks the Bolt protocol and supports openCypher. The application connects using the official `neo4j-driver` package, which communicates over Bolt and sends openCypher queries. From the driver's perspective, cognodb behaves like Neo4j.

## 2. Why This Matters

The implementation plan and Cypher queries were written against standard Neo4j openCypher syntax. During Phase 2, seed-data verification revealed that cognodb does not support certain Cypher functions that are available in Neo4j. These incompatibilities must be accounted for before Phase 3 query implementation.

## 3. Unsupported Cypher Features

The following Cypher functions are **not supported** by cognodb:

| Function | Expected Behavior | cognodb Result |
|----------|-------------------|---------------|
| `shortestPath((a)-[*]-(b))` | Returns the shortest path between two nodes | `unknown function: shortestPath` |
| `length(path)` | Returns the number of relationships in a path | `length() requires string, list, or path, got bool` |
| `size(path)` | Returns the number of relationships in a path | `size() requires string or list, got *types.Path` |

These functions are used in the implementation plan's Q-05 (Dependency Path) and were attempted during Phase 2 verification queries.

## 4. What Does Work

The following Cypher features work correctly against cognodb:

- `MERGE`, `MATCH`, `CREATE`, `SET`, `RETURN`
- Variable-length path patterns: `[:DEPENDS_ON*1..4]`
- `collect()`, `count()`, `DISTINCT`
- `OPTIONAL MATCH`
- `UNWIND`
- `ORDER BY`, `LIMIT`, `SKIP`
- `WITH` clause for chaining
- Node and relationship pattern matching
- Parameterized queries: `{id: $id}`
- `CREATE CONSTRAINT IF NOT EXISTS`

## 5. Workarounds

### 5.1 Shortest Path

Replace `shortestPath()` with fixed-depth variable-length traversal. Since the dependency graph is small (max 4 hops), iterate over depths:

```cypher
// Instead of:
MATCH path = shortestPath((a)-[*]-(b)) RETURN path

// Use separate queries per depth:
MATCH path = (a)-[:DEPENDS_ON*1]->(b) RETURN path
MATCH path = (a)-[:DEPENDS_ON*2]->(b) RETURN path
// ... up to max depth
```

Or use a single variable-length query and return the full path, then pick the shortest in application code:

```cypher
MATCH path = (a:Service)-[:DEPENDS_ON*1..4]->(b:Service)
RETURN path
```

### 5.2 Path Length

Replace `length(path)` and `size(path)` with application-side calculation. The number of relationships in a path can be computed from the path object in Node.js using the driver's result parsing, or by returning `nodes(path)` and computing `length(nodes) - 1`.

### 5.3 Blast Radius Query (Q-04)

The existing Q-04 query does not use `shortestPath` or `length`. It uses variable-length patterns and `COLLECT`, which work. Q-04 is safe to implement as-is.

### 5.4 Dependency Path Query (Q-05)

Q-05 as written in the implementation plan uses `shortestPath`, which will fail on cognodb. It must be rewritten for Phase 3 using one of the workarounds above.

## 6. Impact on Implementation

| Query | Status | Action Needed |
|-------|--------|---------------|
| Q-01: API Lookup | Works | None |
| Q-02: Direct Consumers | Works | None |
| Q-03: Multi-Hop Traversal | Works | None |
| Q-04: Blast Radius | Works | None |
| Q-05: Dependency Path | **Fails** | Rewrite without `shortestPath` |
| Q-06: Replacement API | Works | None |
| Q-07: Service Detail | Works | None |
| Q-08: Dashboard Aggregates | Works | None |

## 7. Recommendation

Before implementing Phase 3, rewrite Q-05 to avoid `shortestPath`. The simplest approach is a variable-length traversal returning paths, with the application layer selecting the shortest result. This avoids Cypher-level path functions entirely while preserving the same semantic outcome.
