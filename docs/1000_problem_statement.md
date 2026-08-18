# Problem Statement

## 1. Problem

Modern software systems are built from multiple interconnected services and APIs. A single API may be consumed by several services, which in turn may be dependencies of other services.

When an API is deprecated, modified, or becomes unavailable, engineering teams need to quickly understand:

- Which services directly depend on the API?
- Which services are indirectly affected through other services?
- Which teams own the affected services?
- How far does the impact propagate through the system?
- Which API or version could replace the affected dependency?

In a conventional relational representation, answering these questions can require multiple joins and recursive queries across services, APIs, versions, teams, and dependencies. As the number of relationships increases, understanding the dependency network becomes more difficult.

## 2. Proposed Solution

**API Impact Graph** is a web application that models software APIs, services, API versions, teams, and their dependencies as a graph.

The application allows a user to select an API or service and explore its dependency network. It calculates and visualizes the potential **blast radius** of a change, such as API deprecation or service failure.

The primary goal is not simply to display stored information, but to make connected relationships easy to explore.

## 3. Core Use Case

A user selects an API, for example:

> Payment API v1

The application identifies:

1. Direct consumer services.
2. Services indirectly dependent on those consumers.
3. Teams responsible for affected services.
4. Related API versions or possible replacements.
5. The dependency paths connecting the affected entities.

Example:

```text
Payment API v1
      |
      | CALLED_BY
      v
Order Service
      |
      | DEPENDS_ON
      v
Checkout Service
      |
      | OWNED_BY
      v
Commerce Team
```

The application should make these relationships understandable through both summary information and graph-oriented visualizations.

## 4. Why a Graph Database?

The central questions in this application are relationship-oriented.

The important operation is not simply:

> "Find the Payment API."

It is:

> "Starting from the Payment API, what services, dependencies, and teams can be reached through the system's relationships?"

A graph database is therefore a natural fit because entities can be represented as nodes and their dependencies as typed relationships. Multi-hop traversal can be performed directly over the dependency network.

The application will use **cognodb** as the graph database and access it through the official Neo4j driver using openCypher over Bolt.

## 5. Intended Outcome

The completed application should provide a small but complete demonstration of graph-based dependency analysis.

A non-technical user should be able to:

- Browse APIs and services.
- Select an entity of interest.
- Explore its connected dependencies.
- View the potential blast radius.
- Identify affected teams.
- Understand why the identified entities are connected.

The implementation should prioritize a clear graph model, meaningful Cypher queries, maintainable architecture, and a polished user experience.
