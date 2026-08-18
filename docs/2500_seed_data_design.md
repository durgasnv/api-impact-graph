# Seed Data Design

## What We Built

A deterministic seed script generating 20 teams, 94 services, 70+ APIs, 112+ API versions, and 789 relationships — representing a realistic microservices ecosystem.

## Key Decisions

- Used a seeded PRNG (mulberry32, seed=42) so the same data generates every run — essential for reproducible demos and testing
- Domain-aware service-to-API matching: commerce services call commerce APIs, identity services call identity APIs. Random matching would produce nonsensical relationships.
- Structured dependency chains (69 patterns) instead of random DEPENDS_ON edges — ensures blast radius traversals produce meaningful multi-hop results
- `MERGE` instead of `CREATE` for all inserts — allows re-running the seed script without duplicates
- `UNWIND` batch inserts — dramatically faster than individual `CREATE` statements for 700+ relationships

## Errors Encountered

### Seed script took 3+ minutes on first run
**Cause:** Individual `CREATE` statements for each relationship — 789 separate Cypher queries over the network.
**Fix:** Batched inserts with `UNWIND $rows AS r MATCH ... MERGE ...` — reduced to ~12 queries total. Runtime dropped to ~15 seconds.

### Some services had no API calls
**Cause:** Domain affinity rules were too strict — some service prefixes didn't match any API domains.
**Fix:** Added a fallback: if no domain match found, the service calls 2 random APIs. This ensures every service has at least some CALLS relationships.

### Blast radius for Payment API showed only 2 services
**Cause:** The initial dependency chains were too shallow — most were 1-hop only.
**Fix:** Added deeper chains (3-4 hops): cart→checkout→order→payment-processing, fulfillment→warehouse→shipping, etc. These create the interesting multi-hop traversals.

### Deprecated versions had no replacement info
**Cause:** `REPLACED_BY` relationships were only created for APIs with 3+ versions. APIs with exactly 2 versions got deprecated status but no replacement link.
**Fix:** Created `REPLACED_BY` for all multi-version APIs — if v1 is deprecated, v2 replaces it.

## What We Learned

- Deterministic data generation is critical for demo reproducibility — random seeds change every run
- Domain affinity matching produces far more realistic dependency graphs than random assignment
- Structured dependency chains (hand-designed) are better than random edges for demonstrating multi-hop traversal
- `UNWIND` batch inserts are 50x faster than individual Cypher statements over Bolt
- You need to think about what the blast radius query will actually return when designing seed data — backwards from the visualization
