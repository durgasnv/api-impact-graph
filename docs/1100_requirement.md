# Requirements

## 1. Product Scope

### 1.1 Application

Build a functional web application named **API Impact Graph** for exploring API and service dependencies using cognodb as the graph database layer.

### 1.2 Primary User

The primary user is a software engineer, developer, technical lead, or engineering team member who needs to understand dependencies between APIs and services.

### 1.3 Primary Workflow

The application must support the following workflow:

1. User opens the application.
2. User browses or searches available APIs/services.
3. User selects an API or service.
4. Application retrieves its connected dependency information from cognodb.
5. Application displays direct and indirect dependencies.
6. Application identifies affected services and responsible teams.
7. Application presents the dependency network in an understandable visual format.

---

## 2. Functional Requirements

### FR-01: API/Service Discovery

The application shall allow users to browse or search available APIs and services.

The result should provide enough information for the user to identify the entity they want to investigate.

### FR-02: API Details

The application shall display relevant information for a selected API, including where applicable:

- API name
- Description
- Version
- Status
- Owner/team
- Consumers
- Related or replacement versions

### FR-03: Dependency Exploration

The application shall retrieve and display relationships between:

- APIs
- API versions
- Services
- Teams

The application shall distinguish between direct and indirect dependencies.

### FR-04: Multi-Hop Traversal

The application shall support graph traversal across at least two relationship hops.

Example:

```text
API → Service → Service
```

or:

```text
API → Service → Team
```

The application should present the resulting connected entities and, where appropriate, the path between them.

### FR-05: Blast-Radius Analysis

The application shall provide a blast-radius view for a selected API or service.

The blast-radius result should identify:

- Directly affected services.
- Indirectly affected services.
- Affected teams.
- Relevant dependency paths.

### FR-06: Dependency Path Explanation

For an identified affected entity, the application should be able to explain why it is considered connected to the selected API/service.

Example:

```text
Payment API v1
→ Order Service
→ Checkout Service
→ Commerce Team
```

### FR-07: API Version Information

The application shall support relationships between API versions.

Where seed data contains a replacement relationship, the application should identify a newer/replacement API version for a deprecated version.

### FR-08: Seed Data

The repository shall contain a repeatable seed-data script.

The seed data shall include realistic examples of:

- Teams
- Services
- APIs
- API versions
- Service dependencies
- API consumption relationships
- Ownership relationships
- API replacement/version relationships

The seed script shall create the graph required for the application to function without manually entering individual records.

### FR-09: Cypher Queries

The repository shall contain the application's main Cypher queries in a documented location.

Queries shall demonstrate meaningful graph operations, including:

- Entity lookup.
- Direct dependency retrieval.
- Multi-hop traversal.
- Blast-radius analysis.
- A relationship-oriented query that would be awkward to implement using a conventional relational schema.

### FR-10: Parameterized Queries

All application-generated Cypher queries shall use parameters through the official Neo4j driver.

The application shall not construct Cypher statements by concatenating user-provided strings.

---

## 3. Graph Data Model Requirements

### 3.1 Node Types

The initial graph model shall contain the following node labels:

- `Team`
- `Service`
- `API`
- `APIVersion`

### 3.2 Relationship Types

The initial graph model shall contain relationships representing:

- `(:Team)-[:OWNS]->(:Service)`
- `(:Service)-[:CALLS]->(:API)`
- `(:Service)-[:DEPENDS_ON]->(:Service)`
- `(:API)-[:HAS_VERSION]->(:APIVersion)`
- `(:APIVersion)-[:REPLACED_BY]->(:APIVersion)`

Additional relationships may be introduced if they provide clear value to the use case.

### 3.3 Node Properties

Nodes should contain properties appropriate to their type.

Example:

```text
Team
- id
- name

Service
- id
- name
- description
- status

API
- id
- name
- description
- domain

APIVersion
- id
- version
- status
- releaseDate
```

Properties should be selected based on their usefulness to the application rather than added unnecessarily.

### 3.4 Graph Model Documentation

The README shall include a simple graph data-model diagram showing:

- Node types.
- Relationship types.
- Important properties.

---

## 4. UI/UX Requirements

### 4.1 Dashboard

The application shall provide a clear entry point showing useful system-level information, such as:

- Total APIs.
- Total services.
- Number of deprecated API versions.
- Number of teams.

### 4.2 API/Service Explorer

The user shall be able to select an API or service and inspect its relationships.

### 4.3 Blast-Radius View

The blast-radius analysis shall be visually distinguishable from ordinary entity information.

It should communicate:

- Selected entity.
- Direct dependencies.
- Indirect dependencies.
- Affected teams.
- Relevant paths.

### 4.4 Loading States

The application shall display an appropriate loading state while waiting for graph queries.

### 4.5 Empty States

The application shall display a useful message when a search or graph query returns no results.

### 4.6 Error States

The application shall provide a user-friendly error message when:

- The backend cannot be reached.
- The graph database is unavailable.
- A graph query fails.

Raw database errors should not be unnecessarily exposed to the user.

### 4.7 Responsive and Readable Interface

The UI shall use:

- Clear navigation.
- Readable typography.
- Consistent spacing.
- Intuitive controls.
- Clear visual hierarchy.

Design effort is considered part of the evaluation.

---

## 5. Backend Requirements

### 5.1 API Layer

The backend shall expose REST endpoints required by the frontend.

The API should separate:

- Routing.
- Database access.
- Business logic.
- Configuration.

### 5.2 Suggested Endpoints

The initial API may include:

```text
GET /api/health

GET /api/apis

GET /api/apis/:id

GET /api/apis/:id/blast-radius

GET /api/services

GET /api/services/:id/dependencies
```

The final endpoint structure may be adjusted during implementation if a different design produces a cleaner architecture.

### 5.3 Database Connection

The backend shall connect to cognodb using the official Neo4j driver.

Connection details shall be loaded from environment variables.

Expected configuration includes:

```text
COGNODB_URI
COGNODB_USERNAME
COGNODB_PASSWORD
```

Database credentials must never be committed to source control.

---

## 6. Engineering Requirements

### ER-01: Project Structure

The codebase shall use a clear and maintainable project structure.

### ER-02: Environment Configuration

Secrets and environment-specific configuration shall be stored outside the source code.

A `.env.example` file should document the required variables without containing real credentials.

### ER-03: Error Handling

The backend shall handle database connectivity and query failures gracefully.

### ER-04: Database Sessions

Database sessions should be created and closed appropriately rather than being left open indefinitely.

### ER-05: Input Validation

User-provided identifiers and query parameters should be validated before database operations.

### ER-06: Maintainability

The implementation should be sufficiently clear that every major component can be explained during a technical interview.

---

## 7. Data Requirements

The seed dataset should be realistic enough to demonstrate meaningful graph traversal.

The minimum target is approximately:

- 5+ teams
- 10+ services
- 10+ APIs
- 15+ API versions
- 20+ service/API relationships
- Multiple dependency chains of at least 2–4 hops
- At least one deprecated API version with a replacement

The exact dataset size may be increased if useful for demonstrating the application.

---

## 8. Required Graph Queries

The implementation must include at least the following query categories.

### Q-01: API Lookup

Find an API and its available versions.

### Q-02: Direct Consumers

Find services that directly call a selected API.

### Q-03: Multi-Hop Dependency Traversal

Find services reachable through multiple dependency relationships.

Example:

```text
API
→ Service
→ Service
→ Service
```

### Q-04: Blast Radius

Starting from a selected API/version, identify downstream services and affected teams.

### Q-05: Dependency Path

Return the path explaining how an affected service is connected to the selected API.

### Q-06: Replacement API

Find a replacement API version for a deprecated version where the graph contains that relationship.

At least one query shall demonstrate a relationship-oriented operation that would be awkward or require recursive/complex joins in a relational database.

---

## 9. Security Requirements

- Database credentials must not be committed.
- `.env` must be included in `.gitignore`.
- `.env.example` shall contain only placeholder values.
- User input shall not be concatenated directly into Cypher.
- Database errors should not expose credentials or sensitive connection details.

---

## 10. Documentation Requirements

The GitHub repository README shall contain:

1. Project overview.
2. Problem statement.
3. Why a graph database?
4. Key features.
5. Technology stack.
6. Graph data-model diagram.
7. Architecture overview.
8. Setup instructions.
9. cognodb setup instructions.
10. Environment variable configuration.
11. Seed-data instructions.
12. How to run the application.
13. Main Cypher queries and their purpose.
14. Screenshots of the UI.
15. Hosted demo link.
16. Short explanation of design decisions.

---

## 11. Deployment Requirements

The application shall be deployed using a free hosting tier where possible.

The final submission shall provide:

- GitHub repository URL.
- Hosted application URL.
- Short screen recording demonstrating the application.

The cognodb instance should remain available after submission so the hosted application can be tested against live data.

---

## 12. Acceptance Criteria

The project will be considered complete when:

- [ ] A user can open the hosted application.
- [ ] The application successfully connects to cognodb.
- [ ] Seed data can be loaded through a repository script.
- [ ] APIs and services can be explored.
- [ ] At least one 2+ hop traversal works.
- [ ] Blast-radius analysis works for a selected API/service.
- [ ] Affected teams can be identified.
- [ ] Dependency paths can be displayed or explained.
- [ ] Queries are parameterized.
- [ ] Database credentials are stored in environment variables.
- [ ] Database failures are handled gracefully.
- [ ] Loading and empty states are implemented.
- [ ] The README documents setup, architecture, graph model, queries, and usage.
- [ ] The application has a hosted demo.
- [ ] A short screen recording is available.
