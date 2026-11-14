---
title: "Transfer behavior with knowledge distillation"
description: "Compare teacher-student objectives, data policies and the evidence needed to assess a smaller model."
course: Generative AI
lesson: CHAPTER 20 OF 32
---

# Transfer behavior with knowledge distillation

<div class="genai-phase">ADAPTATION AND AGENTS · STEP 20 OF 32</div>

**After this chapter:** Compare teacher-student objectives, data policies and the evidence needed to assess a smaller model.

**Before you start:** [19 · Adapt a model with parameter-efficient tuning](fine-tuning.md). Keep the [glossary](glossary.md) nearby when a term is new.

## Transfer a behavior, then measure what survived {#teacher-student}

Knowledge distillation trains a student using information from a teacher or a teacher ensemble. The transferred signal can be probabilities, features, attention relationships, generated responses or task outcomes. A smaller student may reduce cost, but its errors and capabilities still need independent evaluation.

Teacher quality, training-data rights, output-use permissions and data coverage affect the experiment. A teacher can transfer systematic mistakes or omit important failure cases. Document how examples were produced, filtered and labeled.

## Compare hard and soft targets {#objective}

A hard label selects one class. Soft teacher probabilities express relative preference among several classes. Temperature can expose that structure. A common classification objective combines a hard-label loss and a teacher-student divergence, with scaling appropriate to the temperature and formulation.

```python
import math

def softmax(values, temperature):
    values = [value / temperature for value in values]
    weights = [math.exp(value - max(values)) for value in values]
    return [value / sum(weights) for value in weights]

def kl(teacher, student):
    return sum(p * math.log(p / q) for p, q in zip(teacher, student) if p > 0)

teacher = softmax([4.0, 2.0, 0.0], 2.0)
student = softmax([3.0, 2.0, 1.0], 2.0)
assert math.isclose(kl(teacher, teacher), 0.0, abs_tol=1e-12)
assert kl(teacher, student) > 0
assert teacher[0] < softmax([4.0, 2.0, 0.0], 1.0)[0]
```

This inspects a divergence; it does not train the student. For token-level distillation, teacher and student targets must refer to compatible contexts and token events. Different tokenizers can prevent a naive coordinate-by-coordinate logit comparison.

## Keep two taxonomy axes separate {#taxonomy}

| Axis | Choices | What to ask |
| --- | --- | --- |
| Teacher timing | Offline fixed teacher, online co-training, self-distillation | Which model or representation supplies the target now? |
| Prefix/data distribution | Off-policy examples, student on-policy rollouts | On whose states or prefixes is the teacher supervising? |
| Target type | Logits, features, relations, complete responses | What signal reaches the student? |
| Teacher count | Single teacher, ensemble or specialized teachers | How are disagreements and coverage handled? |

An online method is not automatically on-policy. A fixed teacher can supervise prefixes produced by the current student. On-policy distillation can reduce the mismatch between teacher-generated training states and the student's own behavior, while introducing sampling, stability and teacher-query costs.

## Extend the objective only when needed {#variants}

Feature or attention transfer requires compatible interfaces or a learned mapping. Sequence-level distillation uses generated examples or responses. Self-distillation can use another stage, view or checkpoint of a model. Multi-teacher designs need aggregation and conflict handling. Reinforcement-learning hybrids introduce reward definitions and policy-update decisions in addition to the transfer signal.

For language tasks, track whether the student retains support, refusal, formatting and tool-call behavior. A shorter, cheaper response that loses the critical qualification can be an application regression even if a broad language benchmark remains stable.

## Evaluate the compression decision {#decision}

Use identical held-out tasks and the intended serving setup to compare teacher, student and a simpler baseline. Report quality by failure category, memory, latency and cost. Include tail cases the teacher finds difficult. Keep the final test set independent of teacher-example selection.

The [foundational distillation paper](https://arxiv.org/abs/1503.02531) provides one starting point. Its results are tied to its experiments; the student in a new application needs its own evidence.

## Try it yourself {#practice}

Design two distillation datasets: one with teacher-written answers and one with teacher feedback on student-generated prefixes. Identify the different sampling distributions and the evaluations each needs.

## Check your understanding {#self-check}

The student agrees with its teacher on 98% of generated training examples. Is that a complete quality result?

??? question "Check your reasoning"
    No. Agreement on the training distribution can conceal shared errors and unseen cases. Use held-out tasks, independent ground truth or human labels, and the deployed cost/latency setup to assess whether the student meets the application contract.

## Continue in order {#continue}

**Previous:** [19 · Adapt a model with parameter-efficient tuning](fine-tuning.md)<br>
**Next:** [21 · Design a bounded agent loop](agent-loops.md)

**Source reading:** [Knowledge distillation](https://aman.ai/primers/knowledge-distillation/). The explanations and numerical examples on this page are original BuildMyX teaching material. Use the linked primers for further detail and their research bibliographies.
