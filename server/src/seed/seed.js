const { getDriver, closeDriver } = require("../db/driver");

// ---------------------------------------------------------------------------
// Deterministic pseudo-random generator (mulberry32)
// ---------------------------------------------------------------------------
function createRng(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = createRng(42);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const pickN = (arr, n) => {
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, n);
};

// ---------------------------------------------------------------------------
// Teams (20)
// ---------------------------------------------------------------------------
const teamDefs = [
  { id: "commerce-team", name: "Commerce Team" },
  { id: "payments-team", name: "Payments Team" },
  { id: "identity-team", name: "Identity Team" },
  { id: "platform-team", name: "Platform Team" },
  { id: "data-team", name: "Data Engineering Team" },
  { id: "integration-team", name: "Integration Team" },
  { id: "mobile-team", name: "Mobile Team" },
  { id: "frontend-team", name: "Frontend Team" },
  { id: "notifications-team", name: "Notifications Team" },
  { id: "search-team", name: "Search & Discovery Team" },
  { id: "content-team", name: "Content Team" },
  { id: "logistics-team", name: "Logistics Team" },
  { id: "security-team", name: "Security Team" },
  { id: "devops-team", name: "DevOps Team" },
  { id: "billing-team", name: "Billing Team" },
  { id: "catalog-team", name: "Catalog Team" },
  { id: "analytics-team", name: "Analytics Team" },
  { id: "ml-team", name: "Machine Learning Team" },
  { id: "customer-success-team", name: "Customer Success Team" },
  { id: "quality-team", name: "Quality Engineering Team" },
];

// ---------------------------------------------------------------------------
// APIs by domain (70 APIs)
// ---------------------------------------------------------------------------
const apiDefs = [
  // Commerce
  { id: "payment-api", name: "Payment API", description: "Processes payments across multiple providers", domain: "commerce" },
  { id: "cart-api", name: "Cart API", description: "Manages shopping cart state and operations", domain: "commerce" },
  { id: "order-api", name: "Order API", description: "Handles order creation, updates, and cancellation", domain: "commerce" },
  { id: "inventory-api", name: "Inventory API", description: "Tracks product inventory across warehouses", domain: "commerce" },
  { id: "catalog-api", name: "Catalog API", description: "Product catalog browsing and management", domain: "commerce" },
  { id: "pricing-api", name: "Pricing API", description: "Dynamic pricing and discount rules", domain: "commerce" },
  { id: "checkout-api", name: "Checkout API", description: "End-to-end checkout flow orchestration", domain: "commerce" },
  { id: "refund-api", name: "Refund API", description: "Processes refunds and chargebacks", domain: "commerce" },
  { id: "tax-api", name: "Tax API", description: "Tax calculation and compliance", domain: "commerce" },
  // Identity
  { id: "auth-api", name: "Auth API", description: "Authentication and token management", domain: "identity" },
  { id: "user-api", name: "User API", description: "User profile management and CRUD", domain: "identity" },
  { id: "session-api", name: "Session API", description: "User session lifecycle management", domain: "identity" },
  { id: "oauth-api", name: "OAuth API", description: "OAuth 2.0 provider for third-party apps", domain: "identity" },
  { id: "sso-api", name: "SSO API", description: "Single sign-on for enterprise customers", domain: "identity" },
  { id: "preference-api", name: "Preference API", description: "User preference and settings management", domain: "identity" },
  // Communication
  { id: "notification-api", name: "Notification API", description: "Multi-channel notification dispatch", domain: "communication" },
  { id: "email-api", name: "Email API", description: "Transactional and marketing email delivery", domain: "communication" },
  { id: "sms-api", name: "SMS API", description: "SMS message sending and delivery tracking", domain: "communication" },
  { id: "push-api", name: "Push API", description: "Mobile and web push notifications", domain: "communication" },
  { id: "webhook-api", name: "Webhook API", description: "Outbound webhook delivery and retry logic", domain: "communication" },
  // Data
  { id: "analytics-api", name: "Analytics API", description: "Analytics data ingestion and querying", domain: "data" },
  { id: "reporting-api", name: "Reporting API", description: "Scheduled and ad-hoc report generation", domain: "data" },
  { id: "metrics-api", name: "Metrics API", description: "Metrics collection and time-series storage", domain: "data" },
  { id: "logging-api", name: "Logging API", description: "Centralized structured logging", domain: "data" },
  { id: "audit-api", name: "Audit API", description: "Audit trail and compliance logging", domain: "data" },
  { id: "pipeline-api", name: "Data Pipeline API", description: "ETL pipeline orchestration and monitoring", domain: "data" },
  // Platform
  { id: "config-api", name: "Config API", description: "Centralized configuration management", domain: "platform" },
  { id: "feature-flag-api", name: "Feature Flag API", description: "Feature flags and gradual rollouts", domain: "platform" },
  { id: "rate-limit-api", name: "Rate Limit API", description: "API rate limiting and throttling", domain: "platform" },
  { id: "gateway-api", name: "Gateway API", description: "API gateway routing and load balancing", domain: "platform" },
  { id: "cache-api", name: "Cache API", description: "Distributed caching layer", domain: "platform" },
  { id: "queue-api", name: "Queue API", description: "Message queue management", domain: "platform" },
  { id: "scheduler-api", name: "Scheduler API", description: "Cron job and task scheduling", domain: "platform" },
  { id: "health-api", name: "Health Check API", description: "Service health and readiness probes", domain: "platform" },
  // Logistics
  { id: "shipping-api", name: "Shipping API", description: "Shipping rate calculation and label generation", domain: "logistics" },
  { id: "tracking-api", name: "Tracking API", description: "Package tracking and delivery updates", domain: "logistics" },
  { id: "warehouse-api", name: "Warehouse API", description: "Warehouse inventory and operations", domain: "logistics" },
  { id: "fulfillment-api", name: "Fulfillment API", description: "Order fulfillment workflow orchestration", domain: "logistics" },
  { id: "delivery-api", name: "Delivery API", description: "Last-mile delivery management", domain: "logistics" },
  // Security
  { id: "fraud-api", name: "Fraud Detection API", description: "Real-time fraud detection and scoring", domain: "security" },
  { id: "encryption-api", name: "Encryption API", description: "Data encryption at rest and in transit", domain: "security" },
  { id: "key-mgmt-api", name: "Key Management API", description: "Cryptographic key lifecycle management", domain: "security" },
  { id: "access-control-api", name: "Access Control API", description: "Role-based and attribute-based access control", domain: "security" },
  { id: "compliance-api", name: "Compliance API", description: "Regulatory compliance checks and reporting", domain: "security" },
  // Finance
  { id: "billing-api", name: "Billing API", description: "Customer billing and invoice generation", domain: "finance" },
  { id: "subscription-api", name: "Subscription API", description: "Subscription lifecycle management", domain: "finance" },
  { id: "revenue-api", name: "Revenue API", description: "Revenue recognition and reporting", domain: "finance" },
  { id: "ledger-api", name: "Ledger API", description: "Double-entry accounting ledger", domain: "finance" },
  // Search
  { id: "search-api", name: "Search API", description: "Full-text product and content search", domain: "search" },
  { id: "recommendation-api", name: "Recommendation API", description: "Product and content recommendations", domain: "search" },
  { id: "personalization-api", name: "Personalization API", description: "User-specific content personalization", domain: "search" },
  // Content
  { id: "cms-api", name: "CMS API", description: "Content management and publishing", domain: "content" },
  { id: "media-api", name: "Media API", description: "Image and video upload, processing, and CDN", domain: "content" },
  { id: "localization-api", name: "Localization API", description: "Multi-language and regionalization support", domain: "content" },
  // ML
  { id: "model-serving-api", name: "Model Serving API", description: "ML model inference and prediction serving", domain: "ml" },
  { id: "training-api", name: "Training Pipeline API", description: "ML model training orchestration", domain: "ml" },
  { id: "feature-store-api", name: "Feature Store API", description: "Feature engineering and storage", domain: "ml" },
  // Customer Success
  { id: "support-api", name: "Support API", description: "Customer support ticket management", domain: "customer-success" },
  { id: "feedback-api", name: "Feedback API", description: "Customer feedback collection and analysis", domain: "customer-success" },
  { id: "loyalty-api", name: "Loyalty API", description: "Loyalty points and rewards program", domain: "customer-success" },
  // Quality
  { id: "testing-api", name: "Testing API", description: "Automated test execution and results", domain: "quality" },
  { id: "monitoring-api", name: "Monitoring API", description: "Application monitoring and alerting", domain: "quality" },
];

// ---------------------------------------------------------------------------
// Generate API versions
// ---------------------------------------------------------------------------
const apiVersions = [];
const versionReplaces = [];

for (const api of apiDefs) {
  const numVersions = rng() < 0.4 ? 1 : rng() < 0.6 ? 2 : 3;
  let releaseYear = 2022;
  let releaseMonth = Math.floor(rng() * 12) + 1;

  for (let v = 1; v <= numVersions; v++) {
    const month = String(releaseMonth).padStart(2, "0");
    const day = String(Math.floor(rng() * 28) + 1).padStart(2, "0");
    const isLast = v === numVersions;
    const status = isLast ? "active" : (rng() < 0.7 ? "deprecated" : "active");
    const versionId = `${api.id}-v${v}`;

    apiVersions.push({
      id: versionId,
      apiId: api.id,
      version: `${v}.0.0`,
      status,
      releaseDate: `${releaseYear}-${month}-${day}`,
    });

    if (v > 1) {
      versionReplaces.push({
        oldId: `${api.id}-v${v - 1}`,
        newId: versionId,
      });
    }

    releaseMonth += Math.floor(rng() * 8) + 4;
    if (releaseMonth > 12) {
      releaseMonth -= 12;
      releaseYear++;
    }
  }
}

// ---------------------------------------------------------------------------
// Team → Service ownership mapping
// ---------------------------------------------------------------------------
const teamServiceMap = {
  "commerce-team": ["order", "checkout", "cart", "inventory", "return", "wishlist"],
  "payments-team": ["payment-processing", "payment-reconciliation", "payment-fraud", "tokenization"],
  "identity-team": ["auth", "user-profile", "session", "oauth", "sso", "mfa"],
  "platform-team": ["gateway", "config", "feature-flags", "rate-limiter", "cache", "queue", "scheduler", "health-check"],
  "data-team": ["analytics-ingestion", "data-pipeline", "data-lake", "etl-orchestrator"],
  "integration-team": ["webhook-relay", "third-party-connector", "event-bus", "integration-monitor"],
  "mobile-team": ["mobile-bff", "push-notifications", "device-registration", "app-config"],
  "frontend-team": ["web-bff", "cdn-orchestrator", "a-b-testing", "ab-test-analytics"],
  "notifications-team": ["email-sender", "sms-sender", "push-sender", "notification-preference", "notification-template"],
  "search-team": ["search-indexer", "search-query", "recommendation-engine", "personalization-engine"],
  "content-team": ["cms", "media-processor", "localization", "content-review"],
  "logistics-team": ["shipping", "tracking", "warehouse-mgmt", "fulfillment", "delivery-scheduler"],
  "security-team": ["fraud-detection", "encryption", "key-management", "access-control", "vulnerability-scanner"],
  "devops-team": ["ci-pipeline", "deployment", "infrastructure", "secrets-management", "log-aggregator"],
  "billing-team": ["billing", "invoice", "subscription", "revenue-recognition"],
  "catalog-team": ["catalog", "pricing", "product-search", "category-mgmt", "review-service"],
  "analytics-team": ["reporting", "metrics-collector", "audit-trail", "real-time-dashboard"],
  "ml-team": ["model-serving", "training-pipeline", "feature-store", "ab-test-ml", "anomaly-detection"],
  "customer-success-team": ["support-ticketing", "feedback-collector", "loyalty", "nps-survey"],
  "quality-team": ["test-runner", "monitoring", "performance-profiler", "contract-testing"],
};

const services = [];
const teamOwnsService = [];

for (const [teamId, prefixes] of Object.entries(teamServiceMap)) {
  for (const prefix of prefixes) {
    const serviceId = `${prefix}-service`;
    services.push({
      id: serviceId,
      name: prefix.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") + " Service",
      description: `Handles ${prefix.replace(/-/g, " ")} operations`,
      status: rng() < 0.05 ? "deprecated" : "active",
    });
    teamOwnsService.push({ teamId, serviceId });
  }
}

// ---------------------------------------------------------------------------
// Service → API (CALLS) — each service calls 2-5 APIs
// ---------------------------------------------------------------------------
const serviceCallsApi = [];
const serviceUsesVersion = [];
const usedVersionIds = {};

for (const svc of services) {
  const prefix = svc.id.replace("-service", "");
  // Match service to relevant APIs by domain affinity
  const relevantApis = apiDefs.filter((a) => {
    if (prefix.includes("payment") || prefix.includes("billing") || prefix.includes("invoice") || prefix.includes("revenue") || prefix.includes("subscription") || prefix.includes("ledger")) {
      return ["commerce", "finance", "security"].includes(a.domain);
    }
    if (prefix.includes("auth") || prefix.includes("user") || prefix.includes("session") || prefix.includes("oauth") || prefix.includes("sso") || prefix.includes("mfa")) {
      return ["identity", "security", "platform"].includes(a.domain);
    }
    if (prefix.includes("search") || prefix.includes("recommendation") || prefix.includes("personalization")) {
      return ["search", "data", "ml"].includes(a.domain);
    }
    if (prefix.includes("email") || prefix.includes("sms") || prefix.includes("push") || prefix.includes("notification")) {
      return ["communication"].includes(a.domain);
    }
    if (prefix.includes("shipping") || prefix.includes("tracking") || prefix.includes("warehouse") || prefix.includes("fulfillment") || prefix.includes("delivery")) {
      return ["logistics", "commerce"].includes(a.domain);
    }
    if (prefix.includes("fraud") || prefix.includes("encryption") || prefix.includes("key") || prefix.includes("access") || prefix.includes("vulnerability")) {
      return ["security", "identity"].includes(a.domain);
    }
    if (prefix.includes("analytics") || prefix.includes("reporting") || prefix.includes("metrics") || prefix.includes("audit") || prefix.includes("dashboard")) {
      return ["data", "platform"].includes(a.domain);
    }
    if (prefix.includes("model") || prefix.includes("training") || prefix.includes("feature") || prefix.includes("anomaly")) {
      return ["ml", "data"].includes(a.domain);
    }
    if (prefix.includes("cms") || prefix.includes("media") || prefix.includes("localization") || prefix.includes("content")) {
      return ["content", "communication"].includes(a.domain);
    }
    if (prefix.includes("test") || prefix.includes("monitor") || prefix.includes("contract")) {
      return ["quality", "platform", "data"].includes(a.domain);
    }
    if (prefix.includes("support") || prefix.includes("feedback") || prefix.includes("loyalty") || prefix.includes("nps")) {
      return ["customer-success", "communication"].includes(a.domain);
    }
    // Fallback: match by partial name overlap with any API
    return a.id.includes(prefix.split("-")[0]) || prefix.split("-").some((p) => a.id.includes(p));
  });

  const numApis = Math.min(relevantApis.length || 1, Math.floor(rng() * 4) + 2);
  const chosenApis = pickN(relevantApis.length ? relevantApis : apiDefs, numApis);

  for (const api of chosenApis) {
    serviceCallsApi.push({ serviceId: svc.id, apiId: api.id });

    // Pick a version for USES_VERSION
    const versions = apiVersions.filter((v) => v.apiId === api.id);
    if (versions.length > 0) {
      // 70% chance of using the latest version, 30% older
      const vIdx = rng() < 0.7 ? versions.length - 1 : Math.floor(rng() * versions.length);
      const v = versions[vIdx];
      const key = `${svc.id}|${v.id}`;
      if (!usedVersionIds[key]) {
        usedVersionIds[key] = true;
        serviceUsesVersion.push({ serviceId: svc.id, versionId: v.id });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Service → Service (DEPENDS_ON) — realistic dependency chains
// ---------------------------------------------------------------------------
const serviceDependsOn = [];
const serviceIds = services.map((s) => s.id);

// Create structured dependency chains (services in the same team or adjacent teams tend to depend on each other)
const dependencyPatterns = [
  // Commerce flow
  ["checkout-service", "order-service"],
  ["cart-service", "checkout-service"],
  ["order-service", "payment-processing-service"],
  ["order-service", "inventory-service"],
  ["return-service", "order-service"],
  ["wishlist-service", "catalog-service"],
  // Identity flow
  ["session-service", "auth-service"],
  ["oauth-service", "auth-service"],
  ["sso-service", "auth-service"],
  ["mfa-service", "auth-service"],
  ["user-profile-service", "auth-service"],
  // Notification flow
  ["email-sender-service", "notification-template-service"],
  ["sms-sender-service", "notification-template-service"],
  ["push-sender-service", "notification-template-service"],
  ["notification-preference-service", "user-profile-service"],
  // Data flow
  ["reporting-service", "analytics-ingestion-service"],
  ["data-pipeline-service", "analytics-ingestion-service"],
  ["real-time-dashboard-service", "metrics-collector-service"],
  ["metrics-collector-service", "log-aggregator-service"],
  ["audit-trail-service", "event-bus-service"],
  // Platform flow
  ["gateway-service", "rate-limiter-service"],
  ["gateway-service", "config-service"],
  ["feature-flags-service", "config-service"],
  ["web-bff-service", "gateway-service"],
  ["mobile-bff-service", "gateway-service"],
  // Search flow
  ["search-query-service", "search-indexer-service"],
  ["recommendation-engine-service", "feature-store-service"],
  ["personalization-engine-service", "feature-store-service"],
  ["product-search-service", "search-indexer-service"],
  // Logistics flow
  ["fulfillment-service", "warehouse-mgmt-service"],
  ["fulfillment-service", "shipping-service"],
  ["delivery-scheduler-service", "tracking-service"],
  ["tracking-service", "shipping-service"],
  // Security flow
  ["fraud-detection-service", "model-serving-service"],
  ["fraud-detection-service", "user-profile-service"],
  ["access-control-service", "key-management-service"],
  // Billing flow
  ["invoice-service", "billing-service"],
  ["billing-service", "payment-processing-service"],
  ["revenue-recognition-service", "billing-service"],
  ["subscription-service", "billing-service"],
  ["ledger-service", "billing-service"],
  // ML flow
  ["training-pipeline-service", "feature-store-service"],
  ["anomaly-detection-service", "model-serving-service"],
  ["model-serving-service", "feature-store-service"],
  // Content flow
  ["media-processor-service", "cms-service"],
  ["localization-service", "cms-service"],
  ["content-review-service", "cms-service"],
  // Customer success flow
  ["feedback-collector-service", "support-ticketing-service"],
  ["nps-survey-service", "support-ticketing-service"],
  ["loyalty-service", "user-profile-service"],
  // Quality flow
  ["contract-testing-service", "test-runner-service"],
  ["performance-profiler-service", "monitoring-service"],
  ["monitoring-service", "log-aggregator-service"],
  // Cross-cutting
  ["event-bus-service", "queue-service"],
  ["ci-pipeline-service", "deployment-service"],
  ["secrets-management-service", "key-management-service"],
  // Deeper chains (3-4 hops)
  ["ab-test-analytics-service", "real-time-dashboard-service"],
  ["ab-test-ml-service", "feature-store-service"],
  ["webhook-relay-service", "event-bus-service"],
  ["third-party-connector-service", "gateway-service"],
  ["cdn-orchestrator-service", "media-processor-service"],
  ["app-config-service", "config-service"],
  ["integration-monitor-service", "monitoring-service"],
  ["payment-reconciliation-service", "ledger-service"],
  ["payment-fraud-service", "fraud-detection-service"],
  ["tokenization-service", "encryption-service"],
  ["category-mgmt-service", "catalog-service"],
  ["review-service-service", "catalog-service"],
  ["data-lake-service", "data-pipeline-service"],
  ["etl-orchestrator-service", "data-pipeline-service"],
  ["infrastructure-service", "deployment-service"],
];

for (const [dependentId, dependencyId] of dependencyPatterns) {
  if (serviceIds.includes(dependentId) && serviceIds.includes(dependencyId)) {
    serviceDependsOn.push({ dependentId, dependencyId });
  }
}

// ---------------------------------------------------------------------------
// Wipe existing data and re-seed
// ---------------------------------------------------------------------------
async function seed() {
  const driver = getDriver();
  const session = driver.session();

  try {
    // Wipe all data
    console.log("Wiping existing data...");
    await session.run("MATCH (n) DETACH DELETE n");

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

    // Batch insert nodes
    console.log(`Seeding ${teamDefs.length} teams...`);
    await session.run(
      "UNWIND $rows AS r MERGE (t:Team {id: r.id}) SET t.name = r.name",
      { rows: teamDefs }
    );

    console.log(`Seeding ${services.length} services...`);
    await session.run(
      "UNWIND $rows AS r MERGE (s:Service {id: r.id}) SET s.name = r.name, s.description = r.description, s.status = r.status",
      { rows: services }
    );

    console.log(`Seeding ${apiDefs.length} APIs...`);
    await session.run(
      "UNWIND $rows AS r MERGE (a:API {id: r.id}) SET a.name = r.name, a.description = r.description, a.domain = r.domain",
      { rows: apiDefs }
    );

    console.log(`Seeding ${apiVersions.length} API versions...`);
    await session.run(
      "UNWIND $rows AS r MERGE (v:APIVersion {id: r.id}) SET v.version = r.version, v.status = r.status, v.releaseDate = r.releaseDate",
      { rows: apiVersions }
    );

    // Batch insert relationships
    console.log("Creating HAS_VERSION relationships...");
    await session.run(
      "UNWIND $rows AS r MATCH (a:API {id: r.apiId}), (v:APIVersion {id: r.id}) MERGE (a)-[:HAS_VERSION]->(v)",
      { rows: apiVersions }
    );

    console.log(`Creating ${teamOwnsService.length} OWNS relationships...`);
    await session.run(
      "UNWIND $rows AS r MATCH (t:Team {id: r.teamId}), (s:Service {id: r.serviceId}) MERGE (t)-[:OWNS]->(s)",
      { rows: teamOwnsService }
    );

    console.log(`Creating ${serviceCallsApi.length} CALLS relationships...`);
    await session.run(
      "UNWIND $rows AS r MATCH (s:Service {id: r.serviceId}), (a:API {id: r.apiId}) MERGE (s)-[:CALLS]->(a)",
      { rows: serviceCallsApi }
    );

    console.log(`Creating ${serviceUsesVersion.length} USES_VERSION relationships...`);
    await session.run(
      "UNWIND $rows AS r MATCH (s:Service {id: r.serviceId}), (v:APIVersion {id: r.versionId}) MERGE (s)-[:USES_VERSION]->(v)",
      { rows: serviceUsesVersion }
    );

    console.log(`Creating ${serviceDependsOn.length} DEPENDS_ON relationships...`);
    await session.run(
      "UNWIND $rows AS r MATCH (dep:Service {id: r.dependentId}), (d:Service {id: r.dependencyId}) MERGE (dep)-[:DEPENDS_ON]->(d)",
      { rows: serviceDependsOn }
    );

    console.log(`Creating ${versionReplaces.length} REPLACED_BY relationships...`);
    await session.run(
      "UNWIND $rows AS r MATCH (old:APIVersion {id: r.oldId}), (new:APIVersion {id: r.newId}) MERGE (old)-[:REPLACED_BY]->(new)",
      { rows: versionReplaces }
    );

    // Summary
    const counts = await session.run(`
      MATCH (n) WITH labels(n)[0] AS label, count(n) AS cnt
      RETURN label, cnt ORDER BY cnt DESC
    `);
    const relCounts = await session.run(`
      MATCH ()-[r]->() WITH type(r) AS type, count(r) AS cnt
      RETURN type, cnt ORDER BY cnt DESC
    `);

    console.log("\n--- Seed Summary ---");
    console.log("Nodes:");
    for (const rec of counts.records) {
      console.log(`  ${rec.get("label")}: ${rec.get("cnt").toNumber()}`);
    }
    console.log("Relationships:");
    for (const rec of relCounts.records) {
      console.log(`  ${rec.get("type")}: ${rec.get("cnt").toNumber()}`);
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
