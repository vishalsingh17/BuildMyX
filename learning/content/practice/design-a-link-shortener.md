---
title: Design a link shortener
description: Practise an end-to-end system design with a fictional workload, clear constraints, a review checklist and a possible solution.
lesson: LESSON 06 OF 06
---

# Design a link shortener

<div class="lesson-meta"><span>Guided practice</span><span>45-minute exercise</span><span>Pen & paper welcome</span></div>

<p class="lesson-lead">Use the foundations to make a small system work, then explain what you would change when its constraints become harder.</p>

## Your brief

Design a service that turns a destination URL into a short link and redirects visitors when they open it. Use these fictional constraints to keep the exercise concrete:

- 100,000 new links and 10 million redirects each day.
- A peak redirect rate five times the average.
- One serving region in the first version.
- Links may expire; destinations are immutable after creation.
- Users can revoke a link, and revocation should take effect within 60 seconds.
- Redirect p95 latency target: under 200 ms, measured at the service boundary, excluding the destination site’s response time.
- Click counts can be delayed. Payments and custom domains are outside scope.

The numbers are assumptions for learning. They are not a capacity promise or the traffic of an actual customer.

## Work through four passes

### 1. Clarify and estimate · 10 minutes

Write the user actions, the correctness rules and the average/peak request rates. Estimate a year of mapping storage using 500 bytes per mapping before overhead. Name the assumptions most likely to change your design.

### 2. Draw the first working design · 10 minutes

Show the creation and redirect paths. Define the API responses, the mapping fields and the point at which the service acknowledges a successful write. Enforce code uniqueness and describe how creation retries behave.

### 3. Stress the design · 20 minutes

Choose two scenarios to investigate:

- A popular link receives most of the traffic.
- The cache is empty after an outage.
- A create request commits, then its response is lost.
- A link is revoked while a cached copy exists.
- Analytics processing stops for an hour.

Explain the user-visible behavior and a recovery strategy. Name one metric that would tell you the strategy is failing.

### 4. Review · 5 minutes

Walk through a request once more. Identify one accepted limitation and one condition that would justify changing the design. If possible, ask someone else to challenge an assumption.

## A possible approach

Try the exercise before expanding this discussion. Many other designs can be reasonable when their assumptions and trade-offs are explicit.

??? example "Reveal a possible design"
    **Write path:** an authenticated API validates the request, checks the caller’s quota and creates a random code. A durable database transaction enforces code uniqueness and stores an idempotency record with the mapping. The response is acknowledged after commit.

    **Read path:** the API resolves the code through a cache, then storage on a miss. Unknown codes receive a 404. A known expired or revoked link is rejected. Database failures receive temporary error responses rather than false 404s.

    **Revocation:** for this exercise, permit at most 60 seconds of stale redirects. Bound the entire server/client caching behavior to that limit, and never cache past the link’s expiry. If the requirement changes to immediate revocation, revisit this choice; best-effort cache deletion alone is not a complete guarantee.

    **Analytics:** publish click events to an asynchronous processor if that fits the agreed loss/delivery guarantees. Use stable event IDs to handle duplicates, monitor oldest-event age and define what happens when the backlog limit is reached.

    **Capacity:** 10 million redirects/day is about 116/second on average and 580/second at the assumed peak. The raw mapping data is about 18.25 GB/year before indexes and other overhead. Benchmark the chosen database and application path before adding partitioning.

    **Operations:** use timeouts and bounded concurrency. Test storage slowdown and a cold cache. Track redirect p95/p99 latency, error rates, dependency saturation, cache hit rate and revocation delay. Keep recovery and access-control procedures explicit.

## Review your own design

| Check | Evidence to look for |
| --- | --- |
| Clear scope | You can name the two main actions and the excluded features |
| Correctness | Uniqueness and retry behavior are enforced across instances |
| Defined latency | You explain where the target is measured and what happens on a miss |
| Revocation | All cache layers respect the agreed delay |
| Failure handling | You distinguish missing data from unavailable storage |
| Operational simplicity | Every component serves an identified requirement |

## Keep practising

Change one constraint and revise your drawing: require two regions, allow destination updates or insist on immediate revocation. Explain which part changes first and which cost increases.

[Revisit the learning path →](../index.md){ .md-button }
