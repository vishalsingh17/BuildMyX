---
title: Design an API
description: Define a small link-shortening API with clear validation, idempotency, redirect behavior and failure responses.
lesson: LESSON 04 OF 06
---

# Design an API

<div class="lesson-meta"><span>Interfaces & correctness</span><span>6 min read + practice</span></div>

<p class="lesson-lead">An API is a promise about behavior. Describe what a request means, when it succeeds and what a client can safely do after a failure.</p>

## Begin with the two user actions

For our practice link shortener, clients create a mapping and visitors resolve it.

| Action | Interface | Success |
| --- | --- | --- |
| Create a link | `POST /v1/links` | `201 Created` with a stable code and short URL |
| Resolve a code | `GET /r/{code}` | `302 Found` with the destination in `Location` |

A temporary redirect is useful when destinations or revocation rules can change. A permanent redirect may be cached by browsers for longer than you control. Choose deliberately, and define cache headers that fit the product promise.

## Specify a creation request

```http
POST /v1/links
Content-Type: application/json
Idempotency-Key: 0cc2943e-016d-4cba-a65c-41f1f1bfad51

{"destination":"https://example.com/learning","expiresAt":"2027-01-01T00:00:00Z"}
```

```json
{
  "code": "g7K2mQp",
  "shortUrl": "https://links.example/r/g7K2mQp",
  "expiresAt": "2027-01-01T00:00:00Z"
}
```

These domains and responses illustrate the contract; the learning site does not run a link-shortening API.

Validate the destination’s scheme and length, set request-size limits and define expiration rules. Authentication, quotas, reporting and abuse controls need their own requirements. If the service fetches destination previews, it also needs protection against requests to private or internal network addresses.

## Make retries predictable

The server could commit a link and then lose its connection before the client receives the response. The client cannot tell whether the write happened.

Use an idempotency key scoped to the caller and operation. Atomically store the operation’s result with its request fingerprint. A retry with the same key and payload receives the original result; reusing that key for a different payload should be rejected. Set and document a retention window for those keys.

An in-memory map on one server cannot provide this guarantee across instances or restarts. The idempotency record belongs in shared durable storage with appropriate concurrency control.

## Define failure responses

| Situation | Possible response | What the client should do |
| --- | --- | --- |
| Invalid destination | `400 Bad Request` | Correct the request |
| Same key, different payload | `409 Conflict` | Reconcile the operation rather than retrying blindly |
| Unknown code | `404 Not Found` | Show a missing-link message |
| Known expired code | `410 Gone` | Explain expiry, if the product retains that distinction |
| Rate limit reached | `429 Too Many Requests` | Respect `Retry-After` where supplied |
| Temporary dependency failure | `503 Service Unavailable` | Retry within a bounded budget, with backoff and jitter |

Do not label every storage error as “not found.” That hides outages and gives users incorrect information.

## Practice

A user double-clicks “Create” and the client sends two requests. Would two different idempotency keys prevent duplicate links?

??? question "Reveal the reasoning"
    No. Different keys describe different operations. The client should create one key for the intended submission, keep it stable through retries and disable or coalesce duplicate submissions while that operation is pending. Server-side uniqueness and idempotency remain necessary even with that UI behavior.

[Continue: Data, caching & scaling →](data-and-scaling.md){ .md-button .md-button--primary }
