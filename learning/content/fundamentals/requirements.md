---
title: Start with requirements
description: Separate user actions from system qualities, define scope and turn vague words like fast and reliable into assumptions you can test.
lesson: LESSON 02 OF 06
---

# Start with requirements

<div class="lesson-meta"><span>Problem framing</span><span>5 min read + practice</span></div>

<p class="lesson-lead">A good first question can remove an hour of unnecessary design. Agree on the behavior that matters before choosing how to implement it.</p>

## Separate actions from qualities

Functional requirements describe what a user can do. For a booking service, that might be viewing available slots, reserving a slot and cancelling a reservation.

Quality requirements describe how well the service must perform and which guarantees it makes. A booking must not allocate the same seat twice. A search result might tolerate a few seconds of staleness. Those two paths can need different designs.

| Vague request | Better clarification |
| --- | --- |
| “It should be fast.” | Which action? What response time at the 95th percentile, measured where? |
| “It must be reliable.” | Which failures must it survive, and what recovery time is acceptable? |
| “It should scale.” | How many requests at peak, with what read/write mix? |
| “Keep all the data.” | Which records, for how long, and with what deletion obligations? |

## Make the scope explicit

For a first booking design, agree on a short list:

1. Users search for available slots.
2. A user can reserve one available slot.
3. The service prevents two confirmed reservations for the same slot.

Payments, recommendations and recurring bookings might be excluded from the first discussion. Exclusion is a scope decision, not a claim that these features are unimportant.

## Find the rule that must never be broken

An **invariant** is a rule that should remain true after every operation. “One confirmed reservation per slot” is an example. The data model and write path should enforce it even when requests arrive at the same time.

A read-then-write check in application code is not enough on its own. Two requests may both read “available” before either writes. Consider a unique constraint, transaction or another atomic coordination mechanism appropriate to the storage system.

!!! note "A stale read is not always a failed design"
    Showing a recently booked slot in search can be acceptable if the reservation operation reliably rejects it and explains the conflict. Confirm this product behavior; do not silently assume it.

## Write a small decision brief

Before drawing the system, say something like:

> We are designing slot search and reservation for one region. Search may be a few seconds behind. Confirmation must prevent double bookings. We will estimate peak traffic next. Payments are outside this first design.

This gives everyone a chance to correct a consequential assumption early.

## Practice

You are asked to design a link shortener. Write answers to these questions:

- Can a destination change after a link is created?
- Do links expire, and can they be revoked immediately?
- Must anyone be allowed to create a link, or only authenticated users?
- Is click tracking required on the critical redirect path?

??? question "Why does immediate revocation change the design?"
    A cache with a long lifetime may continue serving a revoked link. You need a defined invalidation or validation strategy, or an explicitly agreed delay. The requirement affects both correctness and operational cost.

[Continue: Estimate the load →](capacity-estimation.md){ .md-button .md-button--primary }
