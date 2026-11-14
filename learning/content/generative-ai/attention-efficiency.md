---
title: "Multi-head attention and efficient inference"
description: "Separate model structure, attention approximation and hardware-efficient implementation."
course: Generative AI
lesson: CHAPTER 06 OF 32
---

# Multi-head attention and efficient inference

<div class="genai-phase">MODEL FOUNDATIONS · STEP 06 OF 32</div>

**After this chapter:** Separate model structure, attention approximation and hardware-efficient implementation.

**Before you start:** [05 · Understand attention, one weighted sum at a time](attention.md). Keep the [glossary](glossary.md) nearby when a term is new.

## Multiple heads learn different projections {#heads}

Multi-head attention forms several sets of queries, keys and values. Each head can represent a different relationship, and a learned output projection combines their results. The number of heads changes the parameterization and shape contracts; it does not ensure that each head acquires an easily named linguistic role.

Keep self-attention versus cross-attention separate from causal versus bidirectional access. A decoder can use causal self-attention and also cross-attend to a separate input. Local windows and global tokens define another axis: which positions are permitted to interact.

## Separate three efficiency questions {#taxonomy}

| Question | Example techniques | What changes? |
| --- | --- | --- |
| Which interactions exist? | Local, sparse, dilated or block-sparse attention | The attention pattern |
| How is the result approximated or reformulated? | Low-rank and linear-attention approaches | The computation or representational assumptions |
| How are exact operations scheduled? | IO-aware tiled attention, including FlashAttention | Memory traffic and implementation |

Exact dense attention has a quadratic interaction count during full-sequence processing. An IO-aware implementation can avoid materializing the full score matrix and reduce memory traffic while preserving the defined dense result up to numerical effects. That is different from deleting attention edges or approximating a matrix.

Linear-attention methods use a reformulation that changes the mechanism's properties. Different methods make different assumptions and trade-offs; benchmark recall, numerical stability and your actual sequence lengths instead of assuming that a complexity label predicts application quality.

## Understand the KV cache {#kv-cache}

During autoregressive generation, cached keys and values let a decoder reuse work from earlier tokens. Query computations still happen for the new token. **Multi-query attention (MQA)** shares a key/value head across query heads. **Grouped-query attention (GQA)** shares key/value heads within groups. These can reduce cache size and bandwidth. **Multi-head latent attention (MLA)** uses a compressed latent representation with architecture-specific reconstruction and positional handling.

```python
# Cache storage estimate, excluding metadata, alignment and temporary buffers.
layers, batch, tokens, head_dimension, bytes_per_value = 24, 1, 2048, 64, 2
query_heads, grouped_kv_heads = 16, 4

def cache_bytes(kv_heads):
    return 2 * layers * batch * tokens * kv_heads * head_dimension * bytes_per_value

multi_head = cache_bytes(query_heads)
grouped_query = cache_bytes(grouped_kv_heads)
assert multi_head == 4 * grouped_query
assert cache_bytes(1) < grouped_query
```

The leading 2 counts keys and values. This is an estimate of cache storage, rather than total model memory. Weights, activations, optimizer state during training, allocator behavior and precision add separate costs.

## Keep streaming behavior and instruction persistence distinct {#streaming}

Some streaming designs retain initial positions and a recent window. **Attention sinks** help explain why retaining certain early positions can stabilize particular models; they do not make those positions semantically sufficient for every task. Sliding-window methods must still be tested on information outside the retained window.

**Ghost Attention** concerns instruction persistence through training-oriented conversation construction. **Talking-Heads** mixes information across attention heads. **Synthesizer** explores alternative ways to construct mixing weights. Lightning and hybrid linear-attention approaches combine efficiency ideas with particular sequence-model designs. These occupy different rows in a design comparison; naming all of them “faster attention” loses the important distinctions.

## Verify implementations on the same problem {#verification}

Use a small exact implementation as a numerical reference. Check masks, scaling, output shapes and gradients where relevant. Then benchmark the optimized implementation on the same hardware, precision, batch sizes and lengths, with warm-up and repeated measurements. Training throughput and single-request decoding latency answer different questions.

Useful primary reading includes [FlashAttention](https://arxiv.org/abs/2205.14135) and [GQA](https://arxiv.org/abs/2305.13245). A production kernel's documented requirements matter as much as its high-level algorithm.

## Try it yourself {#practice}

Double the sequence length in the cache estimate. Then halve the stored value precision. Explain the effects independently and list at least two memory costs the estimate leaves out.

## Check your understanding {#self-check}

Does using FlashAttention automatically reduce the theoretical number of dense query-key interactions from quadratic to linear?

??? question "Check your reasoning"
    No. IO-aware exact attention changes memory access and intermediate storage. Sparse or linear-attention mechanisms change another part of the design. Keep arithmetic complexity, memory usage and measured wall-clock performance distinct.

## Continue in order {#continue}

**Previous:** [05 · Understand attention, one weighted sum at a time](attention.md)<br>
**Next:** [07 · Assemble a transformer](transformers.md)

**Source reading:** [Attention](https://aman.ai/primers/attention/). The explanations and numerical examples on this page are original BuildMyX teaching material. Use the linked primers for further detail and their research bibliographies.
