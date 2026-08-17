const { getDriver, closeDriver } = require("../db/driver");

const teams = [
  { id: "commerce-team", name: "Commerce Team" },
  { id: "user-team", name: "User Team" },
  { id: "analytics-team", name: "Analytics Team" },
  { id: "platform-team", name: "Platform Team" },
  { id: "integration-team", name: "Integration Team" },
];

const services = [
  { id: "order-service", name: "Order Service", description: "Handles order creation and processing", status: "active" },
  { id: "checkout-service", name: "Checkout Service", description: "Manages the checkout flow", status: "active" },
  { id: "cart-service", name: "Cart Service", description: "Manages shopping cart state", status: "active" },
  { id: "inventory-service", name: "Inventory Service", description: "Tracks product inventory", status: "active" },
  { id: "profile-service", name: "Profile Service", description: "Manages user profiles", status: "active" },
  { id: "session-service", name: "Session Service", description: "Handles user sessions", status: "active" },
  { id: "reporting-service", name: "Reporting Service", description: "Generates analytics reports", status: "active" },
  { id: "dashboard-service", name: "Dashboard Service", description: "Serves dashboard data", status: "active" },
  { id: "metrics-service", name: "Metrics Service", description: "Collects and aggregates metrics", status: "active" },
  { id: "gateway-service", name: "Gateway Service", description: "API gateway for external access", status: "active" },
  { id: "config-service", name: "Config Service", description: "Manages application configuration", status: "active" },
  { id: "notification-service", name: "Notification Service", description: "Sends email and push notifications", status: "active" },
];

const apis = [
  { id: "payment-api", name: "Payment API", description: "Processes payments", domain: "finance" },
  { id: "notification-api", name: "Notification API", description: "Sends notifications", domain: "communication" },
  { id: "auth-api", name: "Auth API", description: "Handles authentication", domain: "security" },
  { id: "user-api", name: "User API", description: "User management", domain: "identity" },
  { id: "analytics-api", name: "Analytics API", description: "Analytics data access", domain: "data" },
  { id: "inventory-api", name: "Inventory API", description: "Inventory management", domain: "commerce" },
  { id: "search-api", name: "Search API", description: "Product search", domain: "commerce" },
  { id: "config-api", name: "Config API", description: "Configuration management", domain: "platform" },
  { id: "logging-api", name: "Logging API", description: "Centralized logging", domain: "platform" },
  { id: "billing-api", name: "Billing API", description: "Billing and invoicing", domain: "finance" },
];

const apiVersions = [
  { id: "payment-api-v1", apiId: "payment-api", version: "1.0.0", status: "deprecated", releaseDate: "2023-01-15" },
  { id: "payment-api-v2", apiId: "payment-api", version: "2.0.0", status: "active", releaseDate: "2024-06-01" },
  { id: "notification-api-v1", apiId: "notification-api", version: "1.0.0", status: "deprecated", releaseDate: "2023-03-10" },
  { id: "notification-api-v2", apiId: "notification-api", version: "2.0.0", status: "active", releaseDate: "2024-08-15" },
  { id: "auth-api-v1", apiId: "auth-api", version: "1.0.0", status: "deprecated", releaseDate: "2022-11-01" },
  { id: "auth-api-v2", apiId: "auth-api", version: "2.0.0", status: "active", releaseDate: "2024-02-20" },
  { id: "user-api-v1", apiId: "user-api", version: "1.0.0", status: "active", releaseDate: "2023-06-15" },
  { id: "user-api-v2", apiId: "user-api", version: "2.0.0", status: "active", releaseDate: "2024-09-01" },
  { id: "analytics-api-v1", apiId: "analytics-api", version: "1.0.0", status: "deprecated", releaseDate: "2023-01-20" },
  { id: "analytics-api-v2", apiId: "analytics-api", version: "2.0.0", status: "active", releaseDate: "2023-09-10" },
  { id: "analytics-api-v3", apiId: "analytics-api", version: "3.0.0", status: "active", releaseDate: "2024-11-01" },
  { id: "inventory-api-v1", apiId: "inventory-api", version: "1.0.0", status: "active", releaseDate: "2023-04-12" },
  { id: "inventory-api-v2", apiId: "inventory-api", version: "2.0.0", status: "active", releaseDate: "2024-07-20" },
  { id: "search-api-v1", apiId: "search-api", version: "1.0.0", status: "active", releaseDate: "2023-08-05" },
  { id: "config-api-v1", apiId: "config-api", version: "1.0.0", status: "active", releaseDate: "2023-02-28" },
  { id: "logging-api-v1", apiId: "logging-api", version: "1.0.0", status: "active", releaseDate: "2023-05-18" },
  { id: "logging-api-v2", apiId: "logging-api", version: "2.0.0", status: "active", releaseDate: "2024-10-10" },
  { id: "billing-api-v1", apiId: "billing-api", version: "1.0.0", status: "active", releaseDate: "2023-07-22" },
];

// Service → API (CALLS) — tracks which APIs a service uses
const serviceCallsApi = [
  { serviceId: "order-service", apiId: "payment-api" },
  { serviceId: "order-service", apiId: "notification-api" },
  { serviceId: "checkout-service", apiId: "payment-api" },
  { serviceId: "cart-service", apiId: "inventory-api" },
  { serviceId: "inventory-service", apiId: "inventory-api" },
  { serviceId: "profile-service", apiId: "auth-api" },
  { serviceId: "profile-service", apiId: "user-api" },
  { serviceId: "session-service", apiId: "auth-api" },
  { serviceId: "reporting-service", apiId: "analytics-api" },
  { serviceId: "dashboard-service", apiId: "analytics-api" },
  { serviceId: "dashboard-service", apiId: "search-api" },
  { serviceId: "metrics-service", apiId: "logging-api" },
  { serviceId: "gateway-service", apiId: "config-api" },
  { serviceId: "notification-service", apiId: "notification-api" },
  { serviceId: "notification-service", apiId: "billing-api" },
  { serviceId: "order-service", apiId: "inventory-api" },
  { serviceId: "checkout-service", apiId: "billing-api" },
  { serviceId: "reporting-service", apiId: "logging-api" },
  { serviceId: "metrics-service", apiId: "analytics-api" },
  { serviceId: "gateway-service", apiId: "logging-api" },
  { serviceId: "profile-service", apiId: "logging-api" },
];

// Service → APIVersion (USES_VERSION) — pins each service to a specific version
const serviceUsesVersion = [
  { serviceId: "order-service", versionId: "payment-api-v2" },
  { serviceId: "order-service", versionId: "notification-api-v2" },
  { serviceId: "checkout-service", versionId: "payment-api-v2" },
  { serviceId: "cart-service", versionId: "inventory-api-v1" },
  { serviceId: "inventory-service", versionId: "inventory-api-v2" },
  { serviceId: "profile-service", versionId: "auth-api-v2" },
  { serviceId: "profile-service", versionId: "user-api-v1" },
  { serviceId: "session-service", versionId: "auth-api-v1" },
  { serviceId: "reporting-service", versionId: "analytics-api-v2" },
  { serviceId: "dashboard-service", versionId: "analytics-api-v3" },
  { serviceId: "dashboard-service", versionId: "search-api-v1" },
  { serviceId: "metrics-service", versionId: "logging-api-v2" },
  { serviceId: "gateway-service", versionId: "config-api-v1" },
  { serviceId: "notification-service", versionId: "notification-api-v2" },
  { serviceId: "notification-service", versionId: "billing-api-v1" },
  { serviceId: "order-service", versionId: "inventory-api-v2" },
  { serviceId: "checkout-service", versionId: "billing-api-v1" },
  { serviceId: "reporting-service", versionId: "logging-api-v1" },
  { serviceId: "metrics-service", versionId: "analytics-api-v1" },
  { serviceId: "gateway-service", versionId: "logging-api-v2" },
  { serviceId: "profile-service", versionId: "logging-api-v1" },
];

// Service → Service (DEPENDS_ON) — A depends on B
const serviceDependsOn = [
  { dependentId: "checkout-service", dependencyId: "order-service" },
  { dependentId: "cart-service", dependencyId: "checkout-service" },
  { dependentId: "inventory-service", dependencyId: "order-service" },
  { dependentId: "session-service", dependencyId: "profile-service" },
  { dependentId: "dashboard-service", dependencyId: "reporting-service" },
  { dependentId: "metrics-service", dependencyId: "dashboard-service" },
  { dependentId: "notification-service", dependencyId: "order-service" },
  { dependentId: "gateway-service", dependencyId: "config-service" },
];

// Team → Service (OWNS)
const teamOwnsService = [
  { teamId: "commerce-team", serviceId: "order-service" },
  { teamId: "commerce-team", serviceId: "checkout-service" },
  { teamId: "commerce-team", serviceId: "cart-service" },
  { teamId: "commerce-team", serviceId: "inventory-service" },
  { teamId: "user-team", serviceId: "profile-service" },
  { teamId: "user-team", serviceId: "session-service" },
  { teamId: "analytics-team", serviceId: "reporting-service" },
  { teamId: "analytics-team", serviceId: "dashboard-service" },
  { teamId: "analytics-team", serviceId: "metrics-service" },
  { teamId: "platform-team", serviceId: "gateway-service" },
  { teamId: "platform-team", serviceId: "config-service" },
  { teamId: "integration-team", serviceId: "notification-service" },
];

// APIVersion → APIVersion (REPLACED_BY)
const versionReplaces = [
  { oldId: "payment-api-v1", newId: "payment-api-v2" },
  { oldId: "notification-api-v1", newId: "notification-api-v2" },
  { oldId: "auth-api-v1", newId: "auth-api-v2" },
  { oldId: "analytics-api-v1", newId: "analytics-api-v2" },
  { oldId: "analytics-api-v2", newId: "analytics-api-v3" },
];

async function seed() {
  const driver = getDriver();
  const session = driver.session();

  try {
    console.log("Creating constraints...");

    const constraints = [
      "CREATE CONSTRAINT IF NOT EXISTS FOR (t:Team) REQUIRE t.id IS UNIQUE",
      "CREATE CONSTRAINT IF NOT EXISTS FOR (s:Service) REQUIRE s.id IS UNIQUE",
      "CREATE CONSTRAINT IF NOT EXISTS FOR (a:API) REQUIRE a.id IS UNIQUE",
      "CREATE CONSTRAINT IF NOT EXISTS FOR (v:APIVersion) REQUIRE v.id IS UNIQUE",
    ];

    for (const cypher of constraints) {
      await session.run(cypher);
    }

    console.log("Seeding teams...");
    for (const t of teams) {
      await session.run("MERGE (t:Team {id: $id}) SET t.name = $name", t);
    }

    console.log("Seeding services...");
    for (const s of services) {
      await session.run(
        "MERGE (s:Service {id: $id}) SET s.name = $name, s.description = $description, s.status = $status",
        s
      );
    }

    console.log("Seeding APIs...");
    for (const a of apis) {
      await session.run(
        "MERGE (a:API {id: $id}) SET a.name = $name, a.description = $description, a.domain = $domain",
        a
      );
    }

    console.log("Seeding API versions...");
    for (const v of apiVersions) {
      await session.run(
        "MERGE (v:APIVersion {id: $id}) SET v.version = $version, v.status = $status, v.releaseDate = $releaseDate",
        v
      );
      await session.run(
        "MATCH (a:API {id: $apiId}), (v:APIVersion {id: $id}) MERGE (a)-[:HAS_VERSION]->(v)",
        v
      );
    }

    console.log("Creating CALLS relationships...");
    for (const rel of serviceCallsApi) {
      await session.run(
        "MATCH (s:Service {id: $serviceId}), (a:API {id: $apiId}) MERGE (s)-[:CALLS]->(a)",
        rel
      );
    }

    console.log("Creating USES_VERSION relationships...");
    for (const rel of serviceUsesVersion) {
      await session.run(
        "MATCH (s:Service {id: $serviceId}), (v:APIVersion {id: $versionId}) MERGE (s)-[:USES_VERSION]->(v)",
        rel
      );
    }

    console.log("Creating DEPENDS_ON relationships...");
    for (const rel of serviceDependsOn) {
      await session.run(
        "MATCH (dep:Service {id: $dependentId}), (d:Service {id: $dependencyId}) MERGE (dep)-[:DEPENDS_ON]->(d)",
        rel
      );
    }

    console.log("Creating OWNS relationships...");
    for (const rel of teamOwnsService) {
      await session.run(
        "MATCH (t:Team {id: $teamId}), (s:Service {id: $serviceId}) MERGE (t)-[:OWNS]->(s)",
        rel
      );
    }

    console.log("Creating REPLACED_BY relationships...");
    for (const rel of versionReplaces) {
      await session.run(
        "MATCH (old:APIVersion {id: $oldId}), (new:APIVersion {id: $newId}) MERGE (old)-[:REPLACED_BY]->(new) SET old.status = 'deprecated'",
        rel
      );
    }

    console.log("Seed complete.");
  } finally {
    await session.close();
  }
}

seed()
  .then(() => closeDriver())
  .catch((err) => {
    console.error("Seed failed:", err.message);
    closeDriver().then(() => process.exit(1));
  });
