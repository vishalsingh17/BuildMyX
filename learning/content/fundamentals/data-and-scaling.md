---
title: Data, caching & scaling
description: Choose storage from access patterns, enforce uniqueness and reason through cache misses, queues and failure recovery.
lesson: LESSON 05 OF 06
---

# Data, caching & scaling

<div class="lesson-meta"><span>Architecture decisions</span><span>6 min read + practice</span></div>

<p class="lesson-lead">Start with a design you can operate. Add a new component when a specific correctness, latency or capacity requirement gives it a clear purpose.</p>

## Choose storage from the access pattern

A link shortener usually looks up a destination using a unique code. A possible mapping contains:

| Field | Purpose |
| --- | --- |
| `code` | Unique lookup key |
| `destination` | Validated target URL |
| `ownerId` | Ownership and authorization, if accounts are required |
| `createdAt`, `expiresAt` | Lifecycle rules |
| `revokedAt` | Explicit revocation, if supported |

A relational table with a unique index can work. A durable key-value database can also fit the lookup pattern. Compare guarantees, transactions, operational experience and cost against the expected workload. A product category alone does not settle the decision.

## Protect writes before optimizing reads

Generating random codes does not guarantee uniqueness. Use enough entropy for the expected population, enforce uniqueness in storage and retry code generation after a conflict. Keep that retry bounded and return a clear failure if it cannot succeed.

Consider enumeration and abuse as well as collisions. A short, predictable code can make private-looking links easy to discover. A short URL is not an authorization mechanism.

## What a cache changes

With a cache-aside read path, the API first checks a cache. On a miss, it reads storage and may populate the cache for subsequent requests.

This improves performance only when a useful share of requests can reuse cached values. It introduces decisions about:

- **Expiry:** a cache entry must never outlive the link’s valid lifetime.
- **Revocation:** a removed or changed destination must not violate the promised update delay.
- **Miss storms:** many simultaneous misses can overload storage; consider request coalescing and bounded concurrency.
- **Failure:** falling back to storage is safe only if storage can handle that extra load.

!!! note "Cache capacity is also a failure question"
    Test an empty or unavailable cache. A design that only works with a warm cache may have a difficult recovery path after deployment or an outage.

## When a queue is useful

Click analytics can often happen after the redirect decision. A queue can decouple event processing from that request, but you must choose how much event loss or delay is acceptable.

If the queue delivers at least once, a consumer may receive the same event more than once. Use event identifiers and idempotent processing when duplicate counts are unacceptable. If events must never be lost between a database write and queue publishing, consider an atomic outbox or an equivalent reliable handoff.

Do not claim a queue makes work instantaneous. It changes when the work happens and creates a backlog you must monitor and bound.

## Scale the constraint you can identify

First measure request latency, error rate, database saturation, cache hit rate and queue age. Add application instances if the application tier is saturated and the shared dependencies can support them.

Replication and partitioning solve different problems and introduce different trade-offs. A read replica can serve stale data. Partitioning can complicate queries and create hot keys. Explain the distribution and consistency requirements before introducing either.

## Practice

Your API gains more instances, but requests become slower. What evidence would you collect before adding still more instances?

??? question "Reveal the reasoning"
    Check latency by dependency, database connection use, resource saturation, retries and errors. More API instances may increase pressure on a database that is already the bottleneck. Reducing concurrency, improving a query or using a justified cache may help more than another application server.

[Continue: Design a link shortener →](../practice/design-a-link-shortener.md){ .md-button .md-button--primary }
