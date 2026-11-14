---
title: "Understand recursive computation"
description: "Separate repeated model depth, latent reasoning and recursive program-controlled model calls."
course: Generative AI
lesson: CHAPTER 29 OF 32
---

# Understand recursive computation

<div class="genai-phase">ADVANCED ARCHITECTURES · STEP 29 OF 32</div>

**After this chapter:** Separate repeated model depth, latent reasoning and recursive program-controlled model calls.

**Before you start:** [28 · Model sequences with a state-space model](state-space-models.md). Keep the [glossary](glossary.md) nearby when a term is new.

## Separate three meanings of recursion {#families}

| Family | What repeats? | Where to inspect the budget |
| --- | --- | --- |
| Looped or recurrent-depth transformer | A shared block or set of blocks | Number of internal depth iterations |
| Recursive latent reasoning | Updates to internal latent states, sometimes at several timescales | Update schedule, halting and training procedure |
| Recursive language-model execution | Program-controlled calls over subproblems or external context | Call depth, tool scope, token cost and termination |

These designs can interact, but they are not synonyms. A program that recursively calls an ordinary language model does not thereby make its transformer weights recurrent across internal depth.

## Understand shared computation through a toy update {#weight-sharing}

A repeated function can refine a state using the same parameters at each step. The following update approaches a fixed target because its particular coefficient makes it a contraction. Real neural recurrences require their own stability and training analysis.

```python
target, state = 1.0, 0.0
errors = []
for _ in range(5):
    state = 0.5 * state + 0.5 * target
    errors.append(abs(target - state))
assert all(later < earlier for earlier, later in zip(errors, errors[1:]))
assert errors[-1] == 0.03125
```

Weight sharing can change parameter count and the allocation of computation across depth. Additional iterations still have latency and activation/gradient costs. Quality must be measured at the intended iteration budget.

## Connect depth, latent state and training {#latent-reasoning}

Universal Transformers are an early recurrent self-attention example. Looped, staircase and ladder-style designs change how depth and sequence information interact. Hierarchical or tiny recursive reasoners investigate different state-update schedules and training procedures.

Ask which parameters are shared, which states are updated, whether steps have position/depth information, and how gradients pass through repeated computation. Truncating gradients, supervising intermediate states and training a halting rule are consequential design choices.

An internal latent update is not necessarily readable as a natural-language chain of thought. A convincing explanation also does not establish a faithful trace of the computation. Evaluate the produced artifact using independent checks.

## Bound recursive model calls {#recursive-calls}

A recursive language-model system can expose a large artifact through a program interface, decompose a question and make bounded subcalls. Context is externalized and selectively accessed. The controller still needs input boundaries, allowed operations, maximum depth and a result-verification policy.

A recursion tree can grow quickly. Count the whole tree's cost and define how partial failures, duplicate work and uncertain results propagate. Reusing the agent-loop and graph contracts from chapters 21–23 makes these responsibilities explicit.

## Design a fair experiment {#evaluation}

Compare task success at matched data and compute budgets. Evaluate both easy and difficult cases, extrapolation to different sizes or depths, and failure under an insufficient budget. Report parameter count separately from total inference computation.

Architectural claims, implementation evidence and speculation are different levels of support. Use the supplied primer as a route into the research bibliography, and prefer verifiable architecture descriptions and measured experiments when choosing a next project.

## Try it yourself {#practice}

Change the toy refinement coefficient and impose a maximum of three steps. Define success, budget exhaustion and divergence criteria before running the experiment.

## Check your understanding {#self-check}

A shared block has fewer unique parameters than an equally deep unshared stack. Does that prove it will answer faster?

??? question "Check your reasoning"
    No. The number of sequential iterations, operation shapes, memory traffic and hardware implementation determine latency. Weight sharing changes parameterization; it does not remove the cost of repeatedly executing the block.

## Continue in order {#continue}

**Previous:** [28 · Model sequences with a state-space model](state-space-models.md)<br>
**Next:** [30 · Predict a world and plan within it](world-models.md)

**Source reading:** [Recursive transformers](https://aman.ai/primers/recursive-transformers/). The explanations and numerical examples on this page are original BuildMyX teaching material. Use the linked primers for further detail and their research bibliographies.
