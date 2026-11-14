---
title: "Model sequences with a state-space model"
description: "Trace recurrent state, structured and selective SSMs, and their memory trade-offs."
course: Generative AI
lesson: CHAPTER 28 OF 32
---

# Model sequences with a state-space model

<div class="genai-phase">ADVANCED ARCHITECTURES · STEP 28 OF 32</div>

**After this chapter:** Trace recurrent state, structured and selective SSMs, and their memory trade-offs.

**Before you start:** [27 · Build and evaluate a multimodal system](multimodal-systems.md). Keep the [glossary](glossary.md) nearby when a term is new.

## Summarize a sequence through a changing state {#recurrence}

A state-space model relates an evolving hidden state to inputs and outputs. A simple discrete form is `h_t = A h_(t-1) + B x_t`, with output `y_t = C h_t + D x_t`. The state is a learned or designed summary; its width determines what information can be represented at once.

Continuous-time formulations use a differential equation and a discretization rule to obtain a step update. Stability and timescales matter: a scalar transition magnitude below one decays, while uncontrolled amplification can make a long sequence numerically difficult.

```python
inputs = [2.0, 2.0, 1.0]
state, recurrent = 0.0, []
for value in inputs:
    state = 0.5 * state + value
    recurrent.append(state)
convolution = [sum((0.5 ** (time - index)) * inputs[index] for index in range(time + 1)) for time in range(len(inputs))]
assert recurrent == [2.0, 3.0, 2.5]
assert recurrent == convolution
```

The recurrence and convolution agree here because the coefficients are fixed and the system is linear and time invariant. Input-dependent transitions change that computation and its efficient implementation.

## Connect structured models to long memory {#structured}

HiPPO-style ideas study how a state can retain information about past signals. S4 uses structured state-space parameterizations and efficient sequence computation. Simplified or related families, including S4D, DSS, S5 and H3, explore different structures and mixing mechanisms. Their details belong to the method's equations and implementation, rather than a single universal “SSM layer.”

The long-memory goal is different from exact arbitrary retrieval. A fixed-size state can be useful while losing details that a later query needs. Evaluate content-based recall alongside predictive quality and speed.

## Add input-dependent selection {#mamba}

Mamba makes parts of the state update depend on the input and uses an efficient scan implementation for that computation. The selection mechanism can regulate what propagates or is forgotten. [The Mamba paper](https://arxiv.org/abs/2312.00752) is a primary starting point for this architecture.

```python
state = 0.0
for value in [1.0, 0.0, 3.0]:
    retention = 0.2 if value > 2 else 0.8
    state = retention * state + value
assert abs(state - 3.16) < 1e-12
```

This scalar illustration exposes input-dependent retention; it is not a reproduction of a trained Mamba block.

Mamba-2 develops a structured state-space duality connecting certain SSM and attention formulations. The supplied primer also surveys later inference-oriented designs, including Mamba-3, and hybrid SSM-attention architectures. Study a particular implementation's recurrence, precision and hardware behavior before drawing performance conclusions from its family name.

## Compare the complete computation {#tradeoffs}

For fixed state width, a recurrent inference update can retain state without storing a growing token-by-token KV cache. Training still needs an actual algorithm for activations and gradients; constant inference state does not imply every training implementation uses constant total memory.

Attention can consult a set of retained positions directly. Recurrent summaries offer different memory, bandwidth and recall trade-offs. Hybrids combine the mechanisms at chosen layers or stages. Test the sequence lengths, batching, retrieval demands and modalities that matter to your application.

Beyond language, structured sequence models can apply to audio, sensor streams, vision sequences and other ordered data. Match architecture and evaluation to the structure of the signal, including irregular timing and missing observations.

## Try it yourself {#practice}

Set the scalar transition coefficient to 1.2 and inspect a long constant input sequence. Compare its growth with the 0.5 example and explain why stability matters.

## Check your understanding {#self-check}

Does a fixed-size recurrent state guarantee perfect recall of every detail in an arbitrarily long sequence?

??? question "Check your reasoning"
    No. It is a bounded representation, and its learned update determines which information survives. Evaluate the recall behavior your task needs; use an appropriate retrieval or attention mechanism when the application requires access to specific past evidence.

## Continue in order {#continue}

**Previous:** [27 · Build and evaluate a multimodal system](multimodal-systems.md)<br>
**Next:** [29 · Understand recursive computation](recursive-transformers.md)

**Source reading:** [State-space models](https://aman.ai/primers/state-space-models/). The explanations and numerical examples on this page are original BuildMyX teaching material. Use the linked primers for further detail and their research bibliographies.
