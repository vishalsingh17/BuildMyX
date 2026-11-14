---
title: "Generate the next token"
description: "Use temperature, top-k, nucleus sampling and stopping rules deliberately."
course: Generative AI
lesson: CHAPTER 09 OF 32
---

# Generate the next token

<div class="genai-phase">MODEL FOUNDATIONS · STEP 09 OF 32</div>

**After this chapter:** Use temperature, top-k, nucleus sampling and stopping rules deliberately.

**Before you start:** [08 · How language models are trained](training-llms.md). Keep the [glossary](glossary.md) nearby when a term is new.

## Generation needs a selection rule {#selection}

The model gives scores over possible next tokens. **Greedy decoding** chooses the highest score. **Sampling** draws from a probability distribution. **Beam search** keeps several high-scoring partial sequences and compares their extensions. Each rule explores a different part of the model's distribution; a higher sequence probability does not automatically mean a better user answer.

Temperature divides logits before softmax. A lower positive temperature concentrates probability; a higher temperature spreads it. Treat a temperature of zero through the interface's documented greedy behavior instead of dividing by zero in your own calculation.

```python
import math
import random

def distribution(logits, temperature=1.0):
    if temperature <= 0:
        raise ValueError("Use an explicit greedy branch for temperature zero")
    scaled = [value / temperature for value in logits]
    values = [math.exp(value - max(scaled)) for value in scaled]
    return [value / sum(values) for value in values]

cold = distribution([3.0, 2.0, 0.0], 0.5)
warm = distribution([3.0, 2.0, 0.0], 2.0)
assert cold[0] > warm[0]
```

## Filter candidates deliberately {#sampling}

Top-k retains a fixed number of high-scoring candidates. Nucleus, or top-p, retains enough candidates to reach a cumulative probability threshold. Normalize after filtering. Different interfaces may combine filters in a documented order, which can affect the final distribution.

```python
probabilities = distribution([3.0, 2.0, 0.0])
ranked = sorted(range(len(probabilities)), key=probabilities.__getitem__, reverse=True)
selected, cumulative = [], 0.0
for index in ranked:
    selected.append(index)
    cumulative += probabilities[index]
    if cumulative >= 0.9:
        break
rng = random.Random(7)
chosen = rng.choices(selected, weights=[probabilities[index] for index in selected], k=1)[0]
assert chosen in selected
assert cumulative >= 0.9
```

This code checks the selection boundary rather than asserting one sampled token forever. Seeded results are useful for debugging, but hardware kernels, model revisions and service implementations can also affect reproducibility.

## Separate reasoning quality from output length {#reasoning}

Extra inference-time computation can support proposal, verification or search. It can also produce a longer wrong answer. A request for visible step-by-step text does not guarantee a faithful account of the internal computation. Use concise, checkable justifications, executable tests or cited evidence according to the task.

Speculative decoding uses a cheaper proposal mechanism and a verification procedure to accelerate generation under its defined acceptance rule. It is different from trusting an unverified draft answer. Keep speed measurements separate from quality measurements.

## Stop and validate {#stopping}

Set an output budget, recognize end-of-sequence markers and handle truncation explicitly. A JSON response cut off at the token limit is an incomplete object. Repetition controls and stopping strings also need tests: a stop string embedded inside legitimate code can truncate a useful result.

Constrained generation can restrict outputs to a grammar or schema. It helps enforce syntax, while business validity and factual support remain separate checks. **Token healing** addresses how a supplied text prefix may end inside an inconvenient token boundary; use the tokenizer and generation interface's documented handling rather than manually splicing arbitrary token IDs.

Compare decoding choices using the same held-out tasks. Record the prompt, model revision, selection parameters, stop rules and the number of repeated samples. A favorable single output is weak evidence for a general policy.

## Try it yourself {#practice}

Implement a top-k filter for the same logits. Try k=1 and k=2, renormalize and explain how this differs from the top-p set.

## Check your understanding {#self-check}

Would increasing temperature be a reliable way to fix a wrong workshop date?

??? question "Check your reasoning"
    No. It changes the selection distribution, not the source of truth. Inspect the evidence and the model's use of it. Use decoding changes when evaluation shows a benefit for the intended task, not as a substitute for grounding.

## Continue in order {#continue}

**Previous:** [08 · How language models are trained](training-llms.md)<br>
**Next:** [10 · Serve a model and manage long context](serving-and-context.md)

**Source reading:** [Language models](https://aman.ai/primers/LLM/). The explanations and numerical examples on this page are original BuildMyX teaching material. Use the linked primers for further detail and their research bibliographies.
