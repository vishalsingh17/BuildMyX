---
title: "Capstone: explain, test and improve your assistant"
description: "Produce a reproducible prototype, an evaluation report and a justified next experiment."
course: Generative AI
lesson: CHAPTER 32 OF 32
---

# Capstone: explain, test and improve your assistant

<div class="genai-phase">FINISH THE PATH · STEP 32 OF 32</div>

**After this chapter:** Produce a reproducible prototype, an evaluation report and a justified next experiment.

**Before you start:** [31 · Connect perception, prediction and action](physical-ai.md). Keep the [glossary](glossary.md) nearby when a term is new.

## Produce an artifact someone else can inspect {#deliverable}

Complete a workshop-assistant prototype with a defined corpus, permitted-reader scope, response contract, evaluation cases and a bounded controller. The [lab download](assets/generative-ai-labs.zip) includes all chapter programs plus a standalone capstone prototype and a test runner.

Start with the deterministic extractive responder. It exposes retrieval and verification without a service account. A real language-model adapter can later produce a response under the same checked interface. Keep the distinction clear in your report: the included prototype demonstrates an evaluation-first system boundary, not the quality of an unspecified trained generator.

## Follow a reproducible run {#run}

```sh
# After extracting generative-ai-labs.zip:
python3 capstone_assistant.py
python3 -m unittest test_capstone.py
python3 labs/05-attention.py
```

Read `README.md` in the archive for the file layout. The examples use Python 3.12+ and the standard library. All workshop records and policy examples are fictional teaching fixtures. The scripts make no model-service, notification or hardware calls.

## Evaluate one change at a time {#experiment}

```python
baseline_cases = [True, True, False, True, False]
candidate_cases = [True, True, True, True, False]
improved = sum(candidate_cases) - sum(baseline_cases)
regressions = [index for index, (old, new) in enumerate(zip(baseline_cases, candidate_cases)) if old and not new]
assert improved == 1 and regressions == []
```

This compares a tiny synthetic outcome table. Replace it with actual recorded results for supported, unsupported, ambiguous and access-restricted questions. Include retrieval evidence, support, schema validity, citation membership, abstention and latency. Explain the sample size and uncertainty before generalizing from a result.

A useful next experiment could add lexical normalization, hybrid retrieval, a reranker, a better context budget or a model adapter. State the expected failure it addresses before implementing it. Keep a final held-out set outside the selection loop.

## Write a short model-and-system report {#report}

| Section | Evidence to include |
| --- | --- |
| Task and scope | Intended readers, inputs and acceptable outcomes |
| Data | Fictional or approved sources, versions, access metadata and splits |
| Architecture | Retrieval, context, responder, verifier and controller boundaries |
| Evaluation | Cases, labels, metrics, uncertainty and hard requirements |
| Results | Baseline/candidate comparison and inspected failure categories |
| Operations | Budgets, timeout/retry semantics, replay identity and recovery |
| Limits | Known unsupported cases and the next justified experiment |

Your report should make it possible to reconstruct a result. A polished screenshot alone does not establish retrieval correctness or reliable generation.

## Demonstrate understanding at each stage {#checkpoints}

1. **Foundations:** explain token IDs, logits, embeddings and a held-out split.
2. **Models:** calculate one attention row and trace a transformer block into vocabulary scores.
3. **Applications:** distinguish retrieval failure, insufficient evidence and unsupported generation.
4. **Adaptation and workflows:** justify tuning or distillation, then trace a bounded run and its recovery.
5. **Advanced architectures:** distinguish a VLM from an aligned retriever, an SSM from a KV cache, recursive depth from program recursion, and rendering from predictive control.

Return to a chapter when you can repeat its vocabulary but cannot explain its worked example. The [glossary](glossary.md) and [source guide](sources.md) provide routes back to the relevant ideas.

## Choose the next project deliberately {#study-plan}

For a text application, improve chapters 13–23 against your own approved evidence. For multimodal understanding, extend chapters 26–27 with inspectable image or video examples. For architecture research, translate a small mechanism from chapters 28–29 into tested tensors. For world modeling, begin with a known simulator and the error analysis in chapters 30–31.

Use our [PyTorch learning path](../pytorch/index.md) when you are ready to replace numerical sketches with trainable modules. Bring a small artifact and an evaluation question to [discuss guided learning](/?interest=learning#enquire).

## Try it yourself {#practice}

Run the downloaded prototype, add two evaluation cases and write a one-page report. Identify one failure boundary and propose one measured improvement without changing the final test set.

## Check your understanding {#self-check}

Your candidate improves one average score. What should the final capstone report establish before recommending it?

??? question "Check your reasoning"
    It should show whether the change meets the full task contract on appropriate held-out cases, including hard requirements, uncertainty, failure categories and operational costs. It should also make the configuration and evidence reproducible and clearly describe its limitations.

## Continue in order {#continue}

**Previous:** [31 · Connect perception, prediction and action](physical-ai.md)<br>
**Next:** [Review the source guide](sources.md)

**Source reading:** [Retrieval-augmented generation](https://aman.ai/primers/RAG/) · [LLM evaluation and judges](https://aman.ai/primers/LLM-as-a-judge/) · [Loop and graph engineering](https://aman.ai/primers/loop-and-graph-engineering/). The explanations and numerical examples on this page are original BuildMyX teaching material. Use the linked primers for further detail and their research bibliographies.
