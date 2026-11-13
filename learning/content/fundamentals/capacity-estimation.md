---
title: Estimate the load
description: Estimate average and peak requests, storage and concurrent work with explicit units and assumptions.
lesson: LESSON 03 OF 06
---

# Estimate the load

<div class="lesson-meta"><span>Capacity planning</span><span>5 min read + practice</span></div>

<p class="lesson-lead">An estimate helps you choose between designs. Keep it simple enough to explain and detailed enough to expose the constraint that matters.</p>

## Start with a workload

Consider a fictional link shortener receiving 10 million redirects and 100,000 new links per day. Assume one region and a peak five times the average. These are practice assumptions, not measured BuildMyX traffic.

| Quantity | Calculation | Approximate result |
| --- | --- | --- |
| Average redirects | 10,000,000 ÷ 86,400 seconds | 116 requests/second |
| Peak redirects | 116 × 5 | 580 requests/second |
| Average creations | 100,000 ÷ 86,400 seconds | 1.16 requests/second |
| Read/write ratio | 10,000,000 ÷ 100,000 | 100:1 |

This workload suggests the read path deserves attention. It does not prove that a single database cannot handle it. Hardware, indexes, query shape and latency targets still matter.

## Estimate storage with units

Assume each new mapping occupies about 500 bytes before database overhead:

```text
100,000 links/day × 500 bytes/link = 50,000,000 bytes/day
50 MB/day × 365 days ≈ 18.25 GB/year
```

This uses decimal units: 1 GB = 1,000,000,000 bytes. Three stored copies would use about 54.75 GB for this raw mapping data. Add separate allowances for indexes, transaction logs, backups, metadata and growth. Click events, if retained, could exceed the mapping data by a wide margin.

Do not multiply every number by an arbitrary safety factor. Show the assumptions so another person can challenge them.

## Think about concurrent work

For a stable system, average in-flight work is roughly arrival rate multiplied by average time in the system. At 580 requests/second and 0.1 seconds per request, that is around 58 concurrent requests on average during that steady load.

This relationship does not specify a connection-pool size or a safe maximum. Bursts, tail latency and downstream connection limits can require more careful measurements. As latency grows, the amount of in-flight work can also grow and exhaust resources.

## Let an estimate change a decision

An estimate is useful if it helps answer a question:

- Can this storage system meet the expected write rate with a suitable index?
- Is a cache likely to help, given the distribution of popular links?
- Will analytics events dominate retained storage?
- Can the service continue operating with one instance unavailable?

Validate the most consequential assumptions with a load test and observed metrics before making production capacity commitments.

## Practice

Suppose redirect traffic doubles to 20 million requests/day, with the same five-times peak assumption. Estimate the average and peak request rates. Does the mapping storage necessarily double too?

??? question "Reveal the reasoning"
    Average redirects become about 231/second, and the assumed peak is about 1,157/second. Mapping storage does not necessarily double: it depends on the creation rate and retention period. Redirect event storage would increase if you record and retain each visit.

[Continue: Design an API →](api-design.md){ .md-button .md-button--primary }
