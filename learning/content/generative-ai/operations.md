---
title: "Operate and improve a GenAI application"
description: "Trace failures, budget cost and latency, and release a versioned system through explicit checks."
course: Generative AI
lesson: CHAPTER 18 OF 32
---

# Operate and improve a GenAI application

<div class="genai-phase">GROUNDED APPLICATIONS · STEP 18 OF 32</div>

**After this chapter:** Trace failures, budget cost and latency, and release a versioned system through explicit checks.

**Before you start:** [17 · Evaluate with a calibrated LLM judge](llm-judges.md). Keep the [glossary](glossary.md) nearby when a term is new.

## Trace the system you actually release {#trace}

A deployed application combines a model, tokenizer, prompt, corpus, retriever, context policy, tools and verification rules. Version the whole configuration. A prompt-only version number cannot reconstruct a result if the document collection changed underneath it.

A trace should identify the stages and their outcomes: ingestion/index version, permitted retrieval candidates, selected evidence IDs, generation settings, validation result and final status. Record timing and token usage at the relevant boundary. Retain only the content appropriate for your data policy; debugging does not require copying every private passage into unrestricted logs.

## Measure cost and latency by stage {#budgets}

Input tokens, output tokens, retrieval work, reranking, tool calls and repeated attempts contribute different costs. Estimate them using the actual provider or hardware pricing for a deployment decision. The following uses fictional units to make the arithmetic visible.

```python
usage = {"input_tokens": 1200, "output_tokens": 250, "retrieval_ms": 30, "generation_ms": 700}
fictional_input_units, fictional_output_units = 1, 3
cost_units = usage["input_tokens"] * fictional_input_units + usage["output_tokens"] * fictional_output_units
latency_ms = usage["retrieval_ms"] + usage["generation_ms"]
assert cost_units == 1950 and latency_ms == 730
```

For a parallel graph, total latency follows the critical path and scheduling overhead, rather than the sum of every node's duration. Total cost still includes the work performed by all nodes. Report tail latency and failure rates alongside averages.

## Make retries bounded and outcomes explicit {#retries}

A timeout means the caller lacks a confirmed result. It does not always establish whether an external action occurred. Read-only retrieval is often safe to retry within a deadline; a side-effecting operation needs an idempotency key or a reconciliation procedure. Distinguish a provider outage, an unsupported question, invalid output and an application rule rejection.

Use cancellation and total budgets across the whole request. A loop with three retries at each of four nested stages can create a much larger worst case than its designer expects.

## Gate changes with evidence {#release}

```python
baseline = {"supported_rate": 0.90, "p95_ms": 1500, "access_violations": 0}
candidate = {"supported_rate": 0.93, "p95_ms": 1400, "access_violations": 0}
release_allowed = (
    candidate["supported_rate"] >= baseline["supported_rate"]
    and candidate["p95_ms"] <= 1600
    and candidate["access_violations"] == 0
)
assert release_allowed
```

These are illustrative point estimates, not statistically justified release thresholds. A real gate specifies sample sizes, uncertainty, hard requirements and the consequences of an error. Review failed cases before interpreting an average improvement.

## Build an improvement loop {#monitoring}

Monitor changes in query patterns, corpus freshness, refusals, citation failures, tool errors and user feedback. A rise in abstention may indicate missing content, a broken index or a changed question distribution. Use traces to locate the first failed boundary.

Retain a known-good configuration and define rollback behavior for code, indexes and data changes. Some changes cannot be reversed merely by switching a model version. Convert incidents into new evaluation cases, then test the whole workflow before expanding its scope.

Use this operational baseline before chapters 19–23 introduce adaptation and autonomous iteration. Extra model capability creates value only when it improves a measured task within the intended constraints.

## Try it yourself {#practice}

Draw a request trace with retrieval, reranking, generation and verification. Assign an overall deadline and show how one stage timing out affects the budget left for recovery.

## Check your understanding {#self-check}

Why can retrying a timed-out registration-writing tool create a duplicate even if no success response was received?

??? question "Check your reasoning"
    The first action may have succeeded while its response was lost. Use an operation identity that the authoritative service can deduplicate, or reconcile the existing result before repeating the action. A caller timeout alone does not prove the action failed.

## Continue in order {#continue}

**Previous:** [17 · Evaluate with a calibrated LLM judge](llm-judges.md)<br>
**Next:** [19 · Adapt a model with parameter-efficient tuning](fine-tuning.md)

**Source reading:** [Context engineering](https://aman.ai/primers/context-engineering/) · [Loop and graph engineering](https://aman.ai/primers/loop-and-graph-engineering/). The explanations and numerical examples on this page are original BuildMyX teaching material. Use the linked primers for further detail and their research bibliographies.
