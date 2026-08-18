# Graph Data Model

## 1. Purpose

The graph data model defines how APIs, services, teams, and their dependencies are stored in cognodb. Every node type, property, and relationship direction is chosen to support the core use case: finding what is affected when an API or service changes.

## 2. Node Types

### Team

Represents an engineering team that owns one or more services.

| Property | Type   | Description               |
|----------|--------|---------------------------|
| `id`     | String | Unique identifier         |
| `name`   | String | Human-readable team name  |

### Service

Represents a software service in the system.

| Property      | Type   | Description                    |
|---------------|--------|--------------------------------|
| `id`          | String | Unique identifier              |
| `name`        | String | Human-readable service name    |
| `description` | String | What the service does          |
| `status`      | String | `active`, `deprecated`, etc.   |

### API

Represents a logical API that services consume.

| Property      | Type   | Description                    |
|---------------|--------|--------------------------------|
| `id`          | String | Unique identifier              |
| `name`        | String | Human-readable API name        |
| `description` | String | What the API does              |
| `domain`      | String | Business domain (e.g. finance) |

### APIVersion

Represents a specific version of an API.

| Property      | Type   | Description                         |
|---------------|--------|-------------------------------------|
| `id`          | String | Unique identifier                   |
| `version`     | String | Semantic version (e.g. "2.0.0")     |
| `status`      | String | `active` or `deprecated`            |
| `releaseDate` | String | ISO date of release                 |

## 3. Relationship Types

### OWNS

```
(:Team)-[:OWNS]->(:Service)
```

A team owns and is responsible for a service. Used to identify which team to contact when a service is affected.

### CALLS

```
(:Service)-[:CALLS]->(:API)
```

A service consumes an API. The service is the caller; the API is the dependency. This is the primary relationship for API dependency analysis.

**Direction:** Service → API. The consumer points to what it depends on.

### DEPENDS_ON

```
(:Service)-[:DEPENDS_ON]->(:Service)
```

A service depends on another service. If the dependency fails, the dependent service is affected.

**Direction:** Dependent → Dependency. `A -[:DEPENDS_ON]-> B` means A depends on B.

**Consequence:** Blast-radius traversal follows **incoming** DEPENDS_ON edges. If B breaks, we find all A where `A -[:DEPENDS_ON]-> B`.

### HAS_VERSION

```
(:API)-[:HAS_VERSION]->(:APIVersion)
```

An API has one or more versions. Links the logical API to its concrete versions.

### REPLACED_BY

```
(:APIVersion)-[:REPLACED_BY]->(:APIVersion)
```

A deprecated API version has a replacement. The deprecated version points forward to the active version.

**Direction:** Old → New. `(:APIVersion {status:'deprecated'})-[:REPLACED_BY]->(:APIVersion {status:'active'})`

## 4. Visual Schema

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

## 5. Direction Semantics

All dependency edges point from the dependent entity toward the entity it depends on:

| Relationship    | From      | To          | Reads as                            |
|----------------|-----------|-------------|-------------------------------------|
| `CALLS`        | Service   | API         | "Service calls API"                 |
| `DEPENDS_ON`   | Service   | Service     | "Service depends on Service"        |
| `OWNS`         | Team      | Service     | "Team owns Service"                 |
| `HAS_VERSION`  | API       | APIVersion  | "API has Version"                   |
| `REPLACED_BY`  | APIVersion| APIVersion  | "Old version replaced by New"       |

## 6. Blast Radius Traversal

When an API becomes unavailable, blast-radius analysis finds all affected entities:

**Step 1:** Find direct consumers — services that call the API.

```cypher
(a:API)<-[:CALLS]-(direct:Service)
```

**Step 2:** Find indirectly affected services — services that depend on the direct consumers.

```cypher
(indirect:Service)-[:DEPENDS_ON*1..4]->(direct:Service)
```

**Step 3:** Find affected teams.

```cypher
(t:Team)-[:OWNS]->(svc:Service)
```

## 7. Seed Data Summary

Verified against cognodb in Phase 2:

| Entity Type | Count |
|-------------|-------|
| Team | 5 |
| Service | 12 |
| API | 10 |
| APIVersion | 18 |
| **Total nodes** | **45** |

| Relationship | Count |
|-------------|-------|
| OWNS | 12 |
| CALLS | 21 |
| DEPENDS_ON | 8 |
| HAS_VERSION | 18 |
| REPLACED_BY | 5 |
| **Total relationships** | **64** |

### Verified Dependency Chains

**Payment API blast radius (3 hops):**
```
Cart Service ──DEPENDS_ON──► Checkout Service ──DEPENDS_ON──► Order Service ──CALLS──► Payment API
```

**Analytics blast radius (3 hops):**
```
Metrics Service ──DEPENDS_ON──► Dashboard Service ──DEPENDS_ON──► Reporting Service ──CALLS──► Analytics API
```

**Auth blast radius (2 hops):**
```
Session Service ──DEPENDS_ON──► Profile Service ──CALLS──► Auth API
```

### Deprecated API Versions

| Deprecated | Replacement |
|------------|-------------|
| payment-api-v1 | payment-api-v2 |
| notification-api-v1 | notification-api-v2 |
| auth-api-v1 | auth-api-v2 |
| analytics-api-v1 | analytics-api-v2 |
| analytics-api-v2 | analytics-api-v3 |
