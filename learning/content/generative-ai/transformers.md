---
title: "Assemble a transformer"
description: "Connect attention, residual paths, normalization, positions and feed-forward blocks."
course: Generative AI
lesson: CHAPTER 07 OF 32
---

# Assemble a transformer

<div class="genai-phase">MODEL FOUNDATIONS · STEP 07 OF 32</div>

**After this chapter:** Connect attention, residual paths, normalization, positions and feed-forward blocks.

**Before you start:** [06 · Multi-head attention and efficient inference](attention-efficiency.md). Keep the [glossary](glossary.md) nearby when a term is new.

## Trace one block before stacking many {#block}

Start with token embeddings plus a way to represent position. An attention sublayer mixes information across permitted positions. A feed-forward sublayer transforms each position's features. Residual paths add sublayer results to an existing representation, and normalization helps manage activation scale. Repeating these blocks builds a deeper model.

In a common **pre-normalization** arrangement, the input is normalized before a sublayer and its result is added to the residual stream. Post-normalization puts normalization after the residual addition. LayerNorm and RMSNorm have different definitions; check the architecture instead of treating every normalization box as interchangeable.

A feed-forward block often expands the feature dimension, applies a nonlinearity and projects back. Gated variants such as SwiGLU combine transformed features through a gate. A mixture-of-experts layer routes positions to a subset of available expert networks, introducing routing, capacity and communication choices.

## Work through a tiny residual block {#worked-block}

The following is an inference-only numerical sketch: identity query/key/value projections, causal attention and a small ReLU transformation. A trainable implementation adds learned projection matrices, explicit normalization and automatic differentiation.

```python
import math

representations = [[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]]
result = []
for position, query in enumerate(representations):
    visible = representations[:position + 1]
    scores = [sum(q*k for q, k in zip(query, key)) / math.sqrt(2) for key in visible]
    shifted = [math.exp(score - max(scores)) for score in scores]
    weights = [value / sum(shifted) for value in shifted]
    mixed = [sum(weight * row[column] for weight, row in zip(weights, visible)) for column in range(2)]
    residual = [value + update for value, update in zip(query, mixed)]
    transformed = [max(0.0, value * 0.1) for value in residual]
    result.append([value + update for value, update in zip(residual, transformed)])
assert len(result) == 3 and all(len(row) == 2 for row in result)
assert result[0] == [2.2, 0.0]
```

This demonstrates sequence mixing followed by a per-position transformation. Reading the numbers also exposes the causal boundary: the first output depends only on the first input.

## Choose an architecture for the task {#architectures}

| Architecture | Typical information flow | Example task shape |
| --- | --- | --- |
| Encoder-only | Bidirectional representations of visible input | Classification or retrieval encoding |
| Decoder-only | Causally conditioned output sequence | Continue or answer in text |
| Encoder–decoder | Encode input, then generate with cross-attention | Translation or structured transformation |

RNNs process an evolving recurrent state; convolutional models mix local neighborhoods through kernels; attention connects permitted positions directly. Parallel training, sequential generation, inductive bias and memory requirements differ. A useful architecture comparison fixes the task, compute budget and data instead of comparing names alone.

## Encode position intentionally {#position}

Attention over a set of vectors does not by itself identify token order. Absolute position embeddings, sinusoidal features, relative biases and rotary position embeddings supply different forms of positional information. RoPE rotates query/key components according to position; ALiBi introduces attention-score biases. Their extrapolation behavior depends on the method and training setup.

Position and mask handling must agree when batching, padding, extending context or reusing a cache. An off-by-one position can produce plausible-looking outputs that fail a strict parity test.

## End at vocabulary scores {#output}

The final representation at an output position is projected to vocabulary logits. A generation rule selects the next token, appends it and repeats. Some models tie input and output embedding weights. Weight tying reduces an independent parameter matrix while imposing a shared representation choice.

A transformer can also be viewed as message passing on a dense or masked graph whose edge weights are data-dependent. That connection is useful for reasoning about information flow, but it does not make every transformer a replacement for every graph-learning problem.

Read the [original architecture paper](https://arxiv.org/abs/1706.03762) alongside this block-level picture. For tensor implementation practice, revisit [PyTorch shapes](../pytorch/shapes.md) before translating the equations into a library.

## Try it yourself {#practice}

Modify the last token in the numerical example and verify that the first output stays unchanged. Explain which parts of the calculation enforce that result.

## Check your understanding {#self-check}

Why must a residual sublayer project back to the residual stream’s feature dimension?

??? question "Check your reasoning"
    Elementwise addition requires compatible shapes. A feed-forward layer can expand internally, but its final projection must restore the intended residual dimension. An accidental broadcast may run while implementing a different function.

## Continue in order {#continue}

**Previous:** [06 · Multi-head attention and efficient inference](attention-efficiency.md)<br>
**Next:** [08 · How language models are trained](training-llms.md)

**Source reading:** [Transformers](https://aman.ai/primers/transformers/) · [Attention](https://aman.ai/primers/attention/). The explanations and numerical examples on this page are original BuildMyX teaching material. Use the linked primers for further detail and their research bibliographies.
