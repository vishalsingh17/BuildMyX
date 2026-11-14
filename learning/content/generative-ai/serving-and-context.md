---
title: "Serve a model and manage long context"
description: "Reason about prefill, decoding, memory, context extension and latency budgets."
course: Generative AI
lesson: CHAPTER 10 OF 32
---

# Serve a model and manage long context

<div class="genai-phase">MODEL FOUNDATIONS · STEP 10 OF 32</div>

**After this chapter:** Reason about prefill, decoding, memory, context extension and latency budgets.

**Before you start:** [09 · Generate the next token](decoding.md). Keep the [glossary](glossary.md) nearby when a term is new.

## Prefill and decoding do different work {#serving}

During **prefill**, a decoder processes the supplied prefix and constructs the state needed for generation. During **decoding**, it repeatedly computes a new position and extends the state. Measure time to the first token separately from time per subsequent token. A fast prefill implementation can still have poor single-request decoding latency.

Batching combines requests, while continuous batching can admit and finish sequences at different times. Prefix caching reuses compatible shared input work. Paged cache designs manage allocation and fragmentation. Weight quantization, cache quantization and model distillation are separate interventions with different quality and memory implications.

## Estimate before choosing hardware {#memory}

```python
layers, sequence, kv_heads, head_dimension, bytes_per_value = 24, 4096, 4, 64, 2
kv_bytes = 2 * layers * sequence * kv_heads * head_dimension * bytes_per_value
assert kv_bytes == 100663296  # 96 MiB for this single-sequence cache estimate
short_length, long_length = 2048, 4096
assert long_length**2 == 4 * short_length**2
assert long_length == 2 * short_length
```

Doubling a full dense attention length quadruples its pair count. Doubling the cached token count doubles this cache estimate. Neither number alone is the total memory or wall-clock cost of a serving system. Account for model weights, workspaces, active requests, allocator behavior and the actual implementation.

Measure on representative lengths and concurrency. Record precision, hardware, warm-up, batching policy and both latency and quality. Faster output that fails the task contract is not an equivalent service.

## A large window is a budget, not a guarantee {#long-context}

Long-context support requires more than accepting a large input. Position handling, training exposure, retrieval behavior, cache size and available compute all matter. Position interpolation and methods that adjust rotary-position behavior can help particular models extend their usable length; extrapolation still needs evaluation.

A model may overlook relevant information in the middle of a long prompt, confuse near-duplicate facts or follow an irrelevant distraction. Test evidence placement, question types and realistic documents. A successful synthetic “needle” test does not establish every long-document capability.

## Pack information with room for the answer {#budget}

```python
window = 8192
instructions, question, tool_schema, output_reserve = 600, 150, 450, 1000
available_evidence = window - instructions - question - tool_schema - output_reserve
assert available_evidence == 5992
assert available_evidence > 0
```

Use the model's tokenizer for an actual request. Word counts are only rough teaching estimates. Also verify the service's separate input, output and total limits; not every interface exposes one interchangeable window number.

**Context stuffing** spends the budget on everything available. A better experiment compares selective retrieval, useful ordering and concise evidence against a longer baseline. Summaries can remove details or lose provenance; measure the effect on the questions you need to answer.

## Choose retrieval and long context together {#rag-comparison}

Retrieval narrows a large or changing collection and can enforce metadata filters. Long context can help compare a known set of documents or follow a long contiguous artifact. A system can use both: retrieve the relevant documents, then provide enough surrounding material for the task.

Include update frequency, access control, exact citation requirements, task quality, latency and cost in the decision. Chapter 12 turns this budget into a context-assembly policy, and chapter 14 tests alternatives to a basic retriever.

## Try it yourself {#practice}

Create two evidence budgets for the same window: a short classification output and a long cited explanation. Predict the capacity left for evidence, then name the tokenizer you would use to verify the real counts.

## Check your understanding {#self-check}

Why can two requests with equal input token counts have different response latency?

??? question "Check your reasoning"
    Their output lengths, batching delays, cache reuse, model routing, tool calls, hardware load and decoding settings can differ. Separate the stages in a trace before attributing the whole delay to prompt length.

## Continue in order {#continue}

**Previous:** [09 · Generate the next token](decoding.md)<br>
**Next:** [11 · Write instructions and validate outputs](prompting.md)

**Source reading:** [Language models](https://aman.ai/primers/LLM/) · [Attention](https://aman.ai/primers/attention/). The explanations and numerical examples on this page are original BuildMyX teaching material. Use the linked primers for further detail and their research bibliographies.
