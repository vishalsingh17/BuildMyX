---
title: "How language models are trained"
description: "Distinguish pretraining, instruction tuning and preference optimization, with sound data splits."
course: Generative AI
lesson: CHAPTER 08 OF 32
---

# How language models are trained

<div class="genai-phase">MODEL FOUNDATIONS · STEP 08 OF 32</div>

**After this chapter:** Distinguish pretraining, instruction tuning and preference optimization, with sound data splits.

**Before you start:** [07 · Assemble a transformer](transformers.md). Keep the [glossary](glossary.md) nearby when a term is new.

## Pretraining learns a broad prediction problem {#pretraining}

Pretraining adjusts parameters using a large collection of examples and a chosen objective, often next-token prediction. Corpus selection, licensing, filtering, deduplication, language mix and contamination checks are part of the learning system. More data or parameters alone does not establish useful, reliable behavior for a particular user population.

The model repeatedly processes batches, computes losses, propagates gradients and updates parameters. Record tokenizer, sequence packing, masks, optimizer, schedule, precision and data version. Distributed training may split examples, parameter tensors, layers or optimizer state across devices; these are different communication and memory trade-offs.

## Keep target loss and task quality separate {#objective}

```python
import math

correct_token_probabilities = [0.8, 0.5, 0.25]
loss = -sum(math.log(value) for value in correct_token_probabilities) / 3
perplexity = math.exp(loss)
assert loss > 0 and perplexity > 1
better_probabilities = [0.9, 0.7, 0.5]
better_loss = -sum(math.log(value) for value in better_probabilities) / 3
assert better_loss < loss
```

Improving the probabilities of recorded next tokens reduces this loss. It does not directly check whether an answer cites a current workshop schedule or whether a tool call should be permitted. Those are application-level properties requiring additional examples and evaluation.

## Adapt a pretrained model to an interface {#post-training}

**Supervised fine-tuning (SFT)** learns from chosen input-response examples. Instruction data can demonstrate format, task behavior, tool-use syntax and appropriate abstention. Poor examples can train the wrong behavior just as efficiently as good ones.

Preference methods compare candidate behaviors. A reward model can estimate preferences, and reinforcement-learning approaches optimize a policy subject to their objective and constraints. Direct preference optimization uses preference comparisons with a different training formulation. Group-relative optimization is another family of policy-update design. The data, reward definition and evaluation determine whether these methods improve a task; the word “alignment” does not replace those checks.

Separate the model that generates an output from the system that verifies it. Optimizing a judge's score can exploit flaws in that judge. Chapter 17 makes this measurement problem concrete.

## Protect your evaluation boundary {#data-quality}

```python
training_documents = {"workshop-001", "workshop-002"}
validation_documents = {"workshop-003"}
test_documents = {"workshop-004"}
assert training_documents.isdisjoint(validation_documents)
assert training_documents.isdisjoint(test_documents)
assert validation_documents.isdisjoint(test_documents)
```

Real leakage checks also need near-duplicate content, shared templates, temporal splits and related-user or related-document groups. A set intersection catches one kind of leak, not all of them.

Use quality-controlled held-out examples to compare behaviors before and after training. Include supported and unsupported questions, different user languages, long inputs and cases requiring exact format. Keep the final test set outside prompt and hyperparameter selection.

## Decide whether training is the right intervention {#decision}

If the problem is missing or stale facts, first inspect retrieval and context construction. If the problem is a consistently wrong output style or a narrow task behavior, good SFT examples may help. If a large model already solves the task but costs too much, consider distillation. If access permission is missing, changing weights is not a substitute for an enforced access boundary.

Chapters 19 and 20 focus on adaptation and transfer after you have an evaluation baseline. Training requires a demonstrated target behavior and a way to assess whether it improved.

## Try it yourself {#practice}

Write three distinct failure reports: stale knowledge, inconsistent formatting and access leakage. Propose the first system boundary you would inspect for each.

## Check your understanding {#self-check}

A tuned model follows JSON formatting better but gives more unsupported answers. Is the tuning clearly successful?

??? question "Check your reasoning"
    Only one dimension improved. Compare the full task contract and held-out results, including support, abstention, format, cost and latency. Keep changes that meet the intended release criteria rather than selecting a single favorable metric.

## Continue in order {#continue}

**Previous:** [07 · Assemble a transformer](transformers.md)<br>
**Next:** [09 · Generate the next token](decoding.md)

**Source reading:** [Language models](https://aman.ai/primers/LLM/). The explanations and numerical examples on this page are original BuildMyX teaching material. Use the linked primers for further detail and their research bibliographies.
