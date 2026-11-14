---
title: "Adapt a model with parameter-efficient tuning"
description: "Choose a tuning method and understand what a LoRA or quantized-base update changes."
course: Generative AI
lesson: CHAPTER 19 OF 32
---

# Adapt a model with parameter-efficient tuning

<div class="genai-phase">ADAPTATION AND AGENTS · STEP 19 OF 32</div>

**After this chapter:** Choose a tuning method and understand what a LoRA or quantized-base update changes.

**Before you start:** [18 · Operate and improve a GenAI application](operations.md). Keep the [glossary](glossary.md) nearby when a term is new.

## Decide what behavior needs adaptation {#choice}

Fine-tuning changes learned parameters. Begin with examples of a task behavior and a held-out evaluation. If the failure comes from missing current facts, retrieval or data maintenance may be the first intervention. If the model consistently needs a specialized format, vocabulary or task behavior, supervised adaptation can be appropriate.

Parameter-efficient fine-tuning updates a smaller set of trainable values than a full-model update. It reduces particular training or storage costs, while activations, optimizer state, precision and the frozen base still contribute to memory. The actual benefit depends on the architecture, method and implementation.

## Understand the LoRA update {#lora}

For a base matrix `W` shaped `[output, input]`, LoRA adds a low-rank update `scale × B A`, where `A` has shape `[rank, input]` and `B` has shape `[output, rank]`. The base can remain frozen. A common initialization makes the initial update zero while preserving a path for learning.

```python
W = [[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]]
A = [[0.2, -0.1]]       # rank 1, input dimension 2
B = [[0.0], [0.0], [0.0]]
rank, alpha = 1, 2
scale = alpha / rank
assert all(scale * B[row][0] * A[0][column] == 0 for row in range(3) for column in range(2))
# A hypothetical learned B, supplied here to inspect the resulting update.
B = [[0.3], [-0.2], [0.1]]
merged = [[W[row][column] + scale * B[row][0] * A[0][column] for column in range(2)] for row in range(3)]
assert merged[0][0] > W[0][0]
input_size, output_size, rank = 1024, 1024, 8
assert rank * (input_size + output_size) < input_size * output_size
```

The example computes an update; it does not run optimization. Rank controls capacity and trainable parameter count. More rank or more adapted layers may help a task, but they also change cost and overfitting risk. Check the target modules and scaling convention of the chosen implementation.

## Compare method families {#methods}

| Family | What is learned | A trade-off to assess |
| --- | --- | --- |
| Soft prompts | Additional learned input vectors | Capacity and context/interface constraints |
| Prefix tuning | Learned prefix representations in the model | Architecture-specific insertion and cache behavior |
| Adapters | Small inserted modules | Additional computation and deployment format |
| Bias or sparse updates | Selected existing parameters | Whether the selected parameters can express the task |
| LoRA | Low-rank matrix updates | Rank, target layers and adapter management |
| QLoRA | Adapters over a quantized frozen base | Quantization and training-memory interactions |

[LoRA](https://arxiv.org/abs/2106.09685) and [QLoRA](https://arxiv.org/abs/2305.14314) describe their specific methods and experiments. QLoRA includes choices such as NF4, quantization of quantization constants and paged optimizer behavior. A four-bit base does not imply that every activation, gradient and trainable value is stored in four bits.

## Keep research variants in their proper layer {#variants}

DoRA separates magnitude and direction in adaptation. ReLoRA explores repeated merging and reinitialization. QA-LoRA incorporates quantization-aware adaptation. Sparse-selection methods, including the SPAFIT line of work, change which parameters are updated. NOLA and MoRA explore other parameterizations or update capacity. Their assumptions and implementations need task-specific assessment.

S-LoRA concerns serving many adapters efficiently. It belongs in a deployment discussion as well as an adaptation survey. Avoid comparing a serving system and a training objective as though they were interchangeable alternatives.

## Run a controlled tuning experiment {#experiment}

Preserve base model, tokenizer, training examples, adapted-module configuration and checkpoint format. Use separate training, selection and final test data. Compare against the untuned model and a simpler prompting or retrieval baseline. Check support, format, access behavior and cost, then test the actual merged or adapter-loaded artifact you intend to serve.

## Try it yourself {#practice}

Calculate the LoRA trainable count for input=2048, output=4096 and ranks 4, 8 and 16. Describe an evaluation that would justify increasing rank.

## Check your understanding {#self-check}

If an adapter checkpoint is small, does that mean the complete serving model has the same small footprint?

??? question "Check your reasoning"
    No. The frozen base model and runtime state are still needed unless an explicitly supported artifact combines or transforms them. Adapter size, trainable parameter count and total inference memory are separate quantities.

## Continue in order {#continue}

**Previous:** [18 · Operate and improve a GenAI application](operations.md)<br>
**Next:** [20 · Transfer behavior with knowledge distillation](distillation.md)

**Source reading:** [Parameter-efficient tuning](https://aman.ai/primers/parameter-efficient-fine-tuning/). The explanations and numerical examples on this page are original BuildMyX teaching material. Use the linked primers for further detail and their research bibliographies.
