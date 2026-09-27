# Feature Summary

This document describes the features currently available in API Impact Graph and points to the detailed documentation for each area.

## Dashboard

The dashboard summarizes the number of APIs, services, teams, and deprecated API versions. It displays a dependency overview graph for APIs with consumers, quick links to the main entity lists, global search, and the database connection status.

See [Dashboard Page](2300_dashboard_page.md).

## API browsing and version details

The API list supports text search, domain and deprecation filters, sorting, and pagination. An API detail page shows its versions and related consumers, and provides a route to analyze the impact of a selected version.

See [API Browsing Pages](1800_api_browsing_pages.md).

## Blast-radius analysis

For an API version, blast-radius analysis finds services that use it directly and services that depend on those consumers, then identifies the teams responsible for affected services. The page presents impact counts, an interactive dependency graph, node details, and graph navigation controls. Results depend on the dependency and ownership relationships stored in the graph; the traversal is bounded by the query depth configured in the backend.

See [Blast Radius Visualization](1900_blast_radius_visualization.md) and [Blast Radius Redesign](2100_blast_radius_redesign.md).

## Dependency paths and exports

Dependency path information helps explain how entities are connected. The blast-radius view can export its displayed result as CSV or JSON. The critical-path panel estimates a longest chain from the graph assembled for display; the advanced-features doc notes that its placeholder edges make it an estimate rather than an authoritative path.

See [Advanced Features](2900_advanced_features.md).

## Services and teams

The service list supports text search, status and owner-team filters, sorting, and pagination. Service detail pages show service relationships and ownership. The team list supports search, sorting by name or service count, and pagination; team detail pages show the team’s owned services.

See [Service and Team Pages](2200_service_team_pages.md).

## Shared navigation and presentation

The app has responsive layouts, dark mode, breadcrumbs on detail pages, loading and error states, and empty states for lists and analyses. The dashboard and entity pages link together so users can move between APIs, services, and their owning teams.

See [Dark Mode and Responsive Design](2400_dark_mode_and_responsive.md) and [Fullscreen and Drawer UI](2800_fullscreen_and_drawer_ui.md).

## Data and operations

The graph models teams, services, APIs, API versions, and their relationships. REST endpoints provide dashboard aggregates, entity listings and details, dependency paths, and blast-radius results. Seed data supports a populated demo environment, and the health endpoint reports whether the graph database can be reached.

See [Architecture Overview](1400_architecture_overview.md), [Graph Data Model](1500_graph_data_model.md), [REST API Layer](1700_rest_api_layer.md), [Seed Data Design](2500_seed_data_design.md), and [Deployment Guide](2700_deployment_guide.md).

## Known limits

- Global search fetches API, service, and team lists and matches names in the browser; it returns at most eight results.
- List filtering, sorting, and pagination run in the browser, with 12 results per page.
- Blast-radius analysis depends on graph completeness and the configured traversal depth.
- The critical-path display is an estimate while its graph uses placeholder dependency edges.
- The application currently documents a read-and-explore workflow; the feature pages do not describe user-facing graph editing.
