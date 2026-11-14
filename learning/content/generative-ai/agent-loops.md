---
title: "Design a bounded agent loop"
description: "Define state, observations, tool contracts, progress checks and termination before adding autonomy."
course: Generative AI
lesson: CHAPTER 21 OF 32
---

# Design a bounded agent loop

<div class="genai-phase">ADAPTATION AND AGENTS · STEP 21 OF 32</div>

**After this chapter:** Define state, observations, tool contracts, progress checks and termination before adding autonomy.

**Before you start:** [20 · Transfer behavior with knowledge distillation](distillation.md). Keep the [glossary](glossary.md) nearby when a term is new.

## Use a loop when the next useful step depends on feedback {#suitability}

A fixed pipeline is enough when the steps and dependencies are known. An agent loop can help when an observation determines the next action: retrieve a missing source, inspect a tool result or revise a proposed artifact. Begin with a successful manual baseline and define what useful adaptation would add.

A loop has a state, a proposal mechanism, an allowed action interface, observations and a verifier. A model can propose the next step, while an application-owned controller enforces the allowed transitions. The model's claim of success is an observation to verify.

## Define termination before iteration {#termination}

Useful terminal states include completed, unsupported, stalled, budget exhausted, failed and needs human review. A score that improves forever without reaching the actual goal is not completion. Detect no progress, repeated states and oscillation; preserve the best checked artifact when an iteration gets worse.

```python
observed_quality = [0.2, 0.6, 0.6, 0.6, 0.9]
maximum_steps, no_progress_limit = 4, 2
best, stagnant, status, used = -1.0, 0, "running", 0
for score in observed_quality[:maximum_steps]:
    used += 1
    if score > best:
        best, stagnant = score, 0
    else:
        stagnant += 1
    if score >= 0.85:
        status = "completed"
        break
    if stagnant >= no_progress_limit:
        status = "stalled"
        break
else:
    status = "budget_exhausted"
assert status == "stalled" and used == 4 and best == 0.6
```

The quality observations are synthetic. In a real task, the verifier must measure the intended result rather than a signal the proposal mechanism can easily game.

## Bound the whole run {#budget}

A contract includes maximum iterations, token/cost budgets, deadlines, allowed tools and scope. Count retries and nested model calls toward the same overall limits. Resetting a budget inside each loop body can create an effectively unbounded run.

Prefer compact current state and relevant observations over an ever-growing transcript. Keep authoritative state outside generated prose. A fresh context can reconstruct the next step from checked artifacts, evidence and a versioned checkpoint.

## Separate proposals from effects {#control}

Validate tool names, parameter types, access scope and expected result shape before execution. Read-only lookup, artifact editing and irreversible external actions have different recovery needs. Put required human authorization into the controller as an explicit state, rather than relying on the model to remember a sentence in its prompt.

An action result should report what the authoritative service confirmed. A timeout needs reconciliation when the outcome is uncertain. Idempotency and version checks prevent a repeated or stale attempt from silently replacing a valid result.

## Observe both outcome and trajectory {#evaluation}

Log allowed state transitions, tool-result identities, verifier outcomes and budgets. Evaluate task completion, unnecessary actions, recovery behavior and cost. A successful final answer can conceal an unsafe intermediate action; a safe failed run can provide useful evidence about a missing capability.

Add scope gradually after the minimal bounded loop has passed normal and injected-failure cases. Chapter 22 shows where several such components need a graph-level contract.

## Try it yourself {#practice}

Add an oscillating sequence of proposed states to the example. Define a repeated-state detector and explain how it differs from the numeric no-progress counter.

## Check your understanding {#self-check}

The verifier score stops improving, but the model keeps proposing new variations. What should determine whether the loop continues?

??? question "Check your reasoning"
    The controller's contract: remaining budget, measured progress and explicit termination rules. More proposals alone are not evidence of useful progress. Preserve the best verified result and enter a stalled or review state when the rule requires it.

## Continue in order {#continue}

**Previous:** [20 · Transfer behavior with knowledge distillation](distillation.md)<br>
**Next:** [22 · Connect work with a reliable graph](agent-graphs.md)

**Source reading:** [Loop and graph engineering](https://aman.ai/primers/loop-and-graph-engineering/) · [Context engineering](https://aman.ai/primers/context-engineering/). The explanations and numerical examples on this page are original BuildMyX teaching material. Use the linked primers for further detail and their research bibliographies.
