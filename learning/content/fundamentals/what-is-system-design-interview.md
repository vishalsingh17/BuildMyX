---
title: What is a system design interview?
description: Understand the purpose of a system design interview, walk through a practical design discussion and check your reasoning with three short questions.
lesson: LESSON 01 OF 06
---

# What is a system design interview?

<div class="lesson-meta"><span>Foundations</span><span>8 min read + practice</span><span>Beginner friendly</span></div>

<p class="lesson-lead">A system design interview asks you to turn a product need into a technical plan. The useful part is the reasoning: what the system must do, how a request travels through it, and why your choices fit the constraints.</p>

You might be asked to design a booking service, an activity feed or a tool that creates short links. There is rarely enough information in the opening prompt to make every decision. Asking for the missing information is part of the work.

By the end of this lesson, you should be able to describe what a design discussion produces, outline a sensible approach and explain one trade-off without relying on a list of technology names.

!!! note "The idea to keep"
    Give every component a job. Before adding a cache, queue or second service, explain the requirement it serves and the new failure case it creates.

## What are you being asked to produce?

Think of the result as a small set of connected explanations:

- **A defined problem:** the users, the essential actions and the constraints you agreed on.
- **A request path:** the components a request touches, the data they own and the response the user receives.
- **A defensible decision:** why you chose one approach and which cost you accepted.
- **A failure plan:** what happens when a dependency is unavailable or the same request arrives twice.

A diagram helps communicate these ideas, but boxes alone do not show how the system behaves. Walk through a concrete request and label where data is read, written and acknowledged.

## How does this differ from a coding interview?

Both involve problem solving. The level at which you make decisions changes.

| Discussion | Example task | The decisions you explain |
| --- | --- | --- |
| Coding | Find a route through a grid | Algorithm, data structure and complexity |
| Component design | Design a reservation module | Interfaces, invariants and responsibilities |
| System design | Build a reservation service for many venues | Data ownership, concurrency, capacity and recovery |

Expectations vary. A discussion for an early-career role may stay close to a single service, while a more senior role may require deeper operational and organizational decisions. Confirm the format with the recruiter rather than assuming a universal rubric.

## A practical way to structure the discussion

If you have about 45 minutes, the following is a useful practice budget. Adjust it to the interviewer’s instructions and the hardest part of the prompt.

| Time | Focus | A useful output |
| --- | --- | --- |
| First 5 minutes | Clarify the brief | Two core user actions and explicit exclusions |
| Next 5 minutes | Establish constraints | Traffic assumptions, latency target and data lifetime |
| Next 10 minutes | Sketch a working design | API, data model and one complete request path |
| Next 20 minutes | Investigate the hard part | A concurrency, scaling or failure decision in depth |
| Final 5 minutes | Review the design | Trade-offs, limitations and what you would measure |

Do not disappear into arithmetic or spend the whole discussion drawing the initial architecture. Invite feedback as you go: “I’m assuming a redirect can use a slightly stale destination. Would that be acceptable?”

## Follow one request through the system

For a link-shortening service, begin with two actions: create a short link and open it. A first design can be small.

<figure class="architecture">
  <div class="architecture__flow" role="img" aria-label="A browser sends a request to a link API, which reads or writes a mapping in a database and returns the response to the browser.">
    <div class="architecture__node">Browser<small>Creates or opens a link</small></div>
    <span class="architecture__arrow" aria-hidden="true">→</span>
    <div class="architecture__node">Link API<small>Validates and resolves</small></div>
    <span class="architecture__arrow" aria-hidden="true">→</span>
    <div class="architecture__node">Database<small>Stores code → destination</small></div>
  </div>
  <figcaption>Start with an understandable request path. Add a cache only after you identify the read-load or latency problem it should solve.</figcaption>
</figure>

For creation, the API validates the destination, generates a candidate code and attempts a write under a unique constraint. If that code already exists, it tries another. It returns success after the mapping is durably stored.

For opening, the API reads the code and returns a redirect to the destination. An unknown or expired code gets a clear error. If storage is unavailable, returning a temporary failure is more honest than reporting that a valid link does not exist.

Now there is something concrete to discuss: What happens if a client retries creation? Can destinations change? Could an extremely popular link overload the database? Each answer may change the design.

## Explain choices through their consequences

Suppose reads become expensive. A cache could reduce repeated database lookups and improve response time for popular links. It also introduces expiry, invalidation and a second dependency to operate.

Compare the alternatives against the actual requirement:

- If destinations never change, a longer cache lifetime may be acceptable, but expiry still matters.
- If users can immediately revoke links, serving stale cache entries could break the product’s promise. Define an invalidation strategy or accept a shorter cache lifetime explicitly.
- If the database already meets the expected load and latency, a cache may not yet justify its cost.

“Use a cache” is a component choice. “Cache immutable mappings for a bounded lifetime to reduce repeated reads, and never beyond link expiry” explains the behavior you intend.

## Common traps to avoid

**Choosing products before defining needs.** A database brand is not a reason to choose its consistency model. Start with access patterns and correctness requirements.

**Treating averages as peaks.** A service that handles the daily average can still fail during a short burst. Keep the assumptions visible.

**Saying retries solve failures.** A retry can duplicate a write or intensify an outage. Define idempotency, timeouts and a retry budget.

**Claiming the design has no weaknesses.** A useful review names a limitation and explains how you would detect when it matters.

## Check your understanding

Try answering before revealing each explanation. These checks are local reading exercises; no account or saved progress is required.

??? question "1. The prompt is ‘design a booking platform’. What should you do first?"
    Establish the users and the critical booking rules. For example: can two people reserve the same seat, and when does a reservation expire? Those answers matter more to the initial design than selecting a database or queue.

??? question "2. Does putting a cache in front of storage guarantee lower latency?"
    No. The result depends on the hit rate, lookup overhead and miss path. Cold or unavailable caches can add latency or cause a rush of reads to storage. Measure both typical and tail latency, and consider the miss case.

??? question "3. A create-link request times out after the database commits. What can go wrong?"
    The client may retry and create another link. A stable idempotency key lets the service recognize the same operation and return the earlier result. A timeout alone does not prove the write failed.

## Your next step

Write three clarification questions for a booking service. Include one user action, one correctness rule and one operational constraint. Then compare them with the [requirements lesson](requirements.md).

[Continue: Start with requirements →](requirements.md){ .md-button .md-button--primary }
