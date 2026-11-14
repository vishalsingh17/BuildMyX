---
title: "Evaluate with a calibrated LLM judge"
description: "Design pointwise, pairwise and listwise judgments, then check bias and human agreement."
course: Generative AI
lesson: CHAPTER 17 OF 32
---

# Evaluate with a calibrated LLM judge

<div class="genai-phase">GROUNDED APPLICATIONS · STEP 17 OF 32</div>

**After this chapter:** Design pointwise, pairwise and listwise judgments, then check bias and human agreement.

**Before you start:** [16 · Measure quality before changing the system](evaluation.md). Keep the [glossary](glossary.md) nearby when a term is new.

## Give the judge a specific job {#rubric}

An LLM judge estimates a property of an answer, such as evidence support, task relevance or clarity. It is another learned measurement component with limitations. Start with deterministic checks for properties that have exact answers, then define the semantic judgment those checks cannot establish.

A rubric should name the evidence available to the judge, the scoring dimensions, the meaning of each score and the treatment of uncertainty. Separate support from style. Include examples of unsupported but fluent answers and supported but incomplete answers.

## Choose the comparison format {#paradigms}

| Format | Question being asked | A useful check |
| --- | --- | --- |
| Pointwise | How does this answer meet the rubric? | Score calibration against human labels |
| Pairwise | Which of these answers better meets the rubric? | Swap their presentation order |
| Listwise | How should a group of answers be ranked? | Ordering, context budget and ranking stability |

These connect to learning-to-rank objectives. An encoder can score a query-response pair, an encoder–decoder can generate an ordered result and a decoder-only judge can produce a structured assessment. Architecture alone does not establish reliable rankings; training labels, context treatment and held-out measurement remain essential.

## Expose position bias with a small fixture {#bias}

The following observations are synthetic judge outputs, not calls to a model. A good preference should not reverse merely because the same candidates exchange positions.

```python
observations = [
    {"order": ["A", "B"], "winner": "A"},
    {"order": ["B", "A"], "winner": "B"},
]
first_position_wins = sum(row["winner"] == row["order"][0] for row in observations)
consistent_candidate = len({row["winner"] for row in observations}) == 1
assert first_position_wins == 2
assert consistent_candidate is False
```

Also test verbosity bias, model-identity preferences, prompt sensitivity, reference leakage and overconfidence. A long answer may be attractive while containing more unsupported claims. A judge can also be manipulated by instructions embedded inside the answer being evaluated.

## Calibrate against held-out human assessment {#calibration}

```python
human = [True, True, False, False]
judge = [True, False, False, False]
agreement = sum(left == right for left, right in zip(human, judge)) / len(human)
false_accepts = sum(predicted and not actual for actual, predicted in zip(human, judge))
false_rejects = sum(actual and not predicted for actual, predicted in zip(human, judge))
assert agreement == 0.75 and false_accepts == 0 and false_rejects == 1
```

This four-case example illustrates measurement bookkeeping. A real calibration set needs enough representative cases, a clear human-labeling process and uncertainty reporting. Agreement on one distribution may not transfer after a model, prompt or user population changes.

Research on calibrated surrogate or causal judge evaluation makes its assumptions part of the estimator. Preserve random audit samples and inspect how the labeling and sampling process affects any claimed correction. An untested correction formula is not a replacement for representative human evidence.

## Improve a judge without training to its own answer key {#improvement}

Prompt optimization can propose rubric changes from observed errors, evaluate candidates and retain better configurations. ProTeGi-style approaches use textual feedback to propose edits; the selection set must remain separate from the final test set. A trained judge or reward model needs similarly careful label and data-split handling.

A panel of judges can combine different views, but correlated errors limit the benefit. Voting does not turn shared assumptions into independent evidence. Multimodal judges need the relevant image or video evidence and their own perceptual evaluation. Reinforcement-trained judges also need checks against reward gaming and distribution shift.

Use the [MT-Bench and Chatbot Arena evaluation research](https://arxiv.org/abs/2306.05685) as one starting point for judge bias and human agreement. Record the judge version, rubric, evidence and uncertainty with every experiment.

## Try it yourself {#practice}

Create two candidate answers with the same factual content but different lengths. Design an order-swapped pairwise test and a support-first rubric, then state what observations would indicate bias.

## Check your understanding {#self-check}

If three judges trained on similar data agree, is that equivalent to three independent human audits?

??? question "Check your reasoning"
    No. Their errors can be strongly correlated, and they may share the same blind spots. Measure panel behavior against held-out human assessment and keep hard requirements independently enforced.

## Continue in order {#continue}

**Previous:** [16 · Measure quality before changing the system](evaluation.md)<br>
**Next:** [18 · Operate and improve a GenAI application](operations.md)

**Source reading:** [LLM evaluation and judges](https://aman.ai/primers/LLM-as-a-judge/). The explanations and numerical examples on this page are original BuildMyX teaching material. Use the linked primers for further detail and their research bibliographies.
