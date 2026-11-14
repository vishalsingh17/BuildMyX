---
title: "Measure quality before changing the system"
description: "Evaluate retrieval and answers separately, using held-out cases and meaningful baselines."
course: Generative AI
lesson: CHAPTER 16 OF 32
---

# Measure quality before changing the system

<div class="genai-phase">GROUNDED APPLICATIONS · STEP 16 OF 32</div>

**After this chapter:** Evaluate retrieval and answers separately, using held-out cases and meaningful baselines.

**Before you start:** [15 · Project: a grounded workshop assistant](grounded-assistant.md). Keep the [glossary](glossary.md) nearby when a term is new.

## Define what counts as success {#criteria}

A useful evaluation starts with representative inputs and a clear expected behavior. Our assistant needs supported answers, valid citations, appropriate abstention, permitted data access and acceptable latency. A single score can conceal a failure in one of those requirements.

Use a held-out set with realistic easy and difficult cases. Include temporal updates, ambiguous requests, unsupported questions, permission boundaries and adversarial document text. Record expected evidence or an acceptable outcome before inspecting a new system's answers.

## Measure retrieval independently {#retrieval-metrics}

Recall at k asks how many relevant documents appear among the first k results. Precision at k asks how much of the returned set is relevant. Reciprocal rank measures where the first relevant result appears. NDCG accounts for graded relevance and discounts lower-ranked gains. Empty relevant sets require an explicit evaluation convention.

```python
import math

relevant = {"python-1", "schedule-1"}
ranking = ["other-1", "python-1", "schedule-1"]
recall_at_2 = len(set(ranking[:2]) & relevant) / len(relevant)
first_relevant = next(index for index, value in enumerate(ranking, 1) if value in relevant)
reciprocal_rank = 1 / first_relevant
assert recall_at_2 == 0.5
assert reciprocal_rank == 0.5

def dcg(grades):
    return sum((2**grade - 1) / math.log2(rank + 1) for rank, grade in enumerate(grades, 1))
actual = [1, 3, 0]
ideal = sorted(actual, reverse=True)
assert 0 < dcg(actual) / dcg(ideal) < 1
```

Apply the same access filter and corpus version during evaluation as in the application. A relevant but unauthorized document is not a successful retrieval result for that reader.

## Evaluate answers with the right evidence {#answer-metrics}

Exact match fits some short factual tasks. Token overlap metrics such as BLEU or ROUGE measure particular surface similarities and can miss valid paraphrases or reward fluent overlap with a wrong claim. Embedding-based comparisons introduce a learned similarity model with its own assumptions.

For grounded answers, separately evaluate whether the answer addresses the question, whether its claims are supported by the supplied evidence and whether citations point to the supporting passages. A correct-looking answer can still have an invalid citation. A supported quote can still fail to answer the question.

Task-specific deterministic checks are powerful where available: a parsed schema, a computed result, an executable test or a permitted document set. Use a human or calibrated model-based assessment for properties those checks do not establish.

## Compare changes fairly {#experiments}

Freeze data treatment and evaluation cases for an experiment. Change one component, record configuration and run both the baseline and candidate on the same inputs. Repeat stochastic generation where it can affect the conclusion. Inspect failures by category rather than only averaging them away.

Small samples have uncertainty. Report the number of cases and individual results, and use an appropriate uncertainty estimate for a decision that depends on a small difference. A three-question classroom lab cannot establish production reliability.

## Make the evaluation a release gate {#gate}

An evaluation report should say what was measured, which cases were excluded, where quality changed and how latency or cost changed. Keep important failure classes visible. Chapter 17 adds semantic judging without granting the judge authority to redefine the answer contract.

## Try it yourself {#practice}

Create an evaluation table with five queries, expected evidence IDs, expected status and one hard requirement. Run the chapter 15 baseline and record its failures before proposing an improvement.

## Check your understanding {#self-check}

Candidate B has a higher average judge score but exposes one staff-only record. Should that be traded against better fluency elsewhere?

??? question "Check your reasoning"
    An enforced access boundary is a requirement, not a style preference to average away. Evaluate hard requirements independently, reject the violating candidate and investigate the first boundary that disclosed the record.

## Continue in order {#continue}

**Previous:** [15 · Project: a grounded workshop assistant](grounded-assistant.md)<br>
**Next:** [17 · Evaluate with a calibrated LLM judge](llm-judges.md)

**Source reading:** [Language models](https://aman.ai/primers/LLM/) · [Retrieval-augmented generation](https://aman.ai/primers/RAG/). The explanations and numerical examples on this page are original BuildMyX teaching material. Use the linked primers for further detail and their research bibliographies.
