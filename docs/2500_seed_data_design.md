# Seed Data Design

> Deterministic data generation for a realistic microservices ecosystem.

## 1. Overview

The seed script (`server/src/seed/seed.js`) generates a complete, reproducible dataset representing a realistic microservices architecture. Running `npm run seed` wipes all existing data and creates the demonstration dataset.

## 2. Deterministic RNG

The script uses a **mulberry32** pseudo-random number generator seeded with `42`:

```js
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(42);
```

This ensures the same data is generated every run, making the dataset reproducible for development, testing, and demonstrations.

## 3. Entity Counts

| Entity | Count | Notes |
|--------|-------|-------|
| Teams | 20 | One per engineering domain |
| Services | 94 | 2–8 per team |
| APIs | 70 | Across 13 domains |
| API Versions | 112+ | 1–3 per API |
| OWNS relationships | 94 | One per service |
| CALLS relationships | 239 | 2–5 per service |
| USES_VERSION relationships | 239 | Paired with CALLS |
| HAS_VERSION relationships | 112+ | One per version |
| REPLACED_BY relationships | 50 | For multi-version APIs |
| DEPENDS_ON relationships | 69 | Structured dependency chains |

## 4. Teams

20 teams covering all engineering domains:

| Team | Domain |
|------|--------|
| Commerce Team | E-commerce operations |
| Payments Team | Payment processing |
| Identity Team | Authentication/authorization |
| Platform Team | Infrastructure services |
| Data Engineering Team | Data pipelines |
| Integration Team | External integrations |
| Mobile Team | Mobile BFF |
| Frontend Team | Web BFF |
| Notifications Team | Messaging |
| Search & Discovery Team | Search |
| Content Team | CMS |
| Logistics Team | Shipping/fulfillment |
| Security Team | Security services |
| DevOps Team | CI/CD |
| Billing Team | Billing |
| Catalog Team | Product catalog |
| Analytics Team | Analytics |
| Machine Learning Team | ML services |
| Customer Success Team | Support |
| Quality Engineering Team | Testing |

## 5. APIs by Domain

| Domain | APIs |
|--------|------|
| commerce | Payment, Cart, Order, Inventory, Catalog, Pricing, Checkout, Refund, Tax |
| identity | Auth, User, Session, OAuth, SSO, Preference |
| communication | Notification, Email, SMS, Push, Webhook |
| data | Analytics, Reporting, Metrics, Logging, Audit, Data Pipeline |
| platform | Config, Feature Flag, Rate Limit, Gateway, Cache, Queue, Scheduler, Health Check |
| logistics | Shipping, Tracking, Warehouse, Fulfillment, Delivery |
| security | Fraud Detection, Encryption, Key Management, Access Control, Compliance |
| finance | Billing, Subscription, Revenue, Ledger |
| search | Search, Recommendation, Personalization |
| content | CMS, Media, Localization |
| ml | Model Serving, Training Pipeline, Feature Store |
| customer-success | Support, Feedback, Loyalty |
| quality | Testing, Monitoring |

## 6. API Versions

Each API gets 1–3 versions:
- **40% chance** of 1 version only
- **60% chance** of 2–3 versions
- Version numbers: `1.0.0`, `2.0.0`, `3.0.0`
- Last version is always `active`
- Earlier versions: 70% `deprecated`, 30% `active`
- Release dates: starting from 2022, incrementing by 4–12 months

## 7. Services

94 services distributed across teams. Each service has:
- `id`: kebab-case (e.g., `order-service`)
- `name`: human-readable
- `description`: contextual sentence
- `status`: 95% `active`, 5% `deprecated`

Services per team follow a `teamServiceMap` that defines realistic service names for each domain.

## 8. Service-to-API Matching (Domain Affinity)

Services call APIs based on domain affinity rules. A `domainMap` defines which API domains are relevant to each service prefix:

| Service Prefix | Relevant API Domains |
|---------------|---------------------|
| order, checkout, cart | commerce |
| payment | finance, commerce |
| auth, user, session | identity |
| search | search |
| shipping, tracking | logistics |
| billing, invoice | finance |
| email, sms, push | communication |
| fraud, encryption | security |
| analytics, reporting | data |
| model, training | ml |

Each service calls 2–5 APIs from its relevant domains, ensuring realistic domain-aligned relationships.

## 9. Dependency Chains (DEPENDS_ON)

69 structured dependency patterns organized by architectural flow:

### Commerce Flow
`cart → checkout → order → payment-processing → payment-fraud`

### Identity Flow
`session, oauth, sso, mfa → auth`
`user-profile → auth`

### Notification Flow
`email-sender, sms-sender, push-sender → notification-template`
`notification-preference → user-profile`

### Data Flow
`reporting → analytics-ingestion`
`data-pipeline → analytics-ingestion`

### Platform Flow
`gateway → rate-limiter, config`
`feature-flags → config`
`web-bff, mobile-bff → gateway`

### Search Flow
`search-query → search-indexer`
`recommendation, personalization → feature-store`

### Logistics Flow
`fulfillment → warehouse-mgmt, shipping`
`delivery-scheduler → tracking → shipping`

### Security Flow
`fraud-detection → model-serving, user-profile`
`access-control → key-management`

### Billing Flow
`invoice → billing → payment-processing`
`revenue-recognition, subscription → billing`

### ML Flow
`training-pipeline → feature-store`
`anomaly-detection → model-serving → feature-store`

### Content Flow
`media-processor, localization, content-review → cms`

### Customer Success Flow
`feedback-collector, nps-survey → support-ticketing`
`loyalty → user-profile`

### Quality Flow
`contract-testing → test-runner`
`performance-profiler → monitoring → log-aggregator`

### Cross-Cutting
`event-bus → queue`
`ci-pipeline → deployment`
`secrets-management → key-management`

### Deep Chains (3–4 hops)
- `ab-test-analytics → real-time-dashboard → metrics-collector → analytics-ingestion`
- `webhook-relay → event-bus → queue → scheduler`
- `payment-reconciliation → ledger → billing → payment-processing`

## 10. Seed Execution Process

1. **Wipe:** `MATCH (n) DETACH DELETE n` — removes all existing data
2. **Constraints:** Create 4 unique constraints on `Team.id`, `Service.id`, `API.id`, `APIVersion.id`
3. **Batch insert nodes:** `UNWIND $rows AS r MERGE (n:Type {id: r.id}) SET n = r` for each entity type
4. **Batch insert relationships:** `UNWIND $rows AS r MATCH (a {id: r.from}) MATCH (b {id: r.to}) MERGE (a)-[:TYPE]->(b)`
5. **Summary:** Print node and relationship counts

All inserts use `MERGE` (not `CREATE`) to avoid duplicates if run multiple times.

## 11. Verified Dependency Chains

These chains were verified against the seed data:

| Chain | Hops |
|-------|------|
| Cart → Checkout → Order → Payment Processing | 3 |
| Checkout → Order → Payment Processing → Payment Fraud | 4 |
| Session → Auth | 1 |
| Search Query → Search Indexer | 1 |
| Fulfillment → Warehouse Mgmt | 1 |
| Fulfillment → Shipping | 1 |
| Invoice → Billing → Payment Processing | 3 |
| Training Pipeline → Feature Store | 1 |
| Anomaly Detection → Model Serving → Feature Store | 3 |
