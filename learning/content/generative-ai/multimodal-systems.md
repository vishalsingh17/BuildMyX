---
title: "Build and evaluate a multimodal system"
description: "Keep spatial and temporal evidence intact through multimodal retrieval, generation and evaluation."
course: Generative AI
lesson: CHAPTER 27 OF 32
---

# Build and evaluate a multimodal system

<div class="genai-phase">OTHER GENERATIVE MODELS · STEP 27 OF 32</div>

**After this chapter:** Keep spatial and temporal evidence intact through multimodal retrieval, generation and evaluation.

**Before you start:** [26 · Connect images and language](vision-language.md). Keep the [glossary](glossary.md) nearby when a term is new.

## Preserve the evidence's coordinates and time {#evidence}

Text, screenshots, diagrams, audio and video have different structures. Store page numbers, bounding boxes, crop transforms, frame timestamps, speaker segments and source versions when they are relevant. A caption can summarize content while omitting the exact detail needed by a question.

A multimodal RAG system may retrieve text captions, direct modality embeddings or several linked representations. Keep the relationship to the original artifact so the answer can point to inspectable evidence. A generated caption is a derived representation with its own error rate.

## Budget video input deliberately {#video}

Frame sampling reduces input size but can miss a short action. Higher resolution can expose small text while increasing visual tokens. Measure the question types your sampling scheme must answer, including temporal order and event duration.

```python
frames = [
    {"id": "frame-0", "time_s": 0.0},
    {"id": "frame-1", "time_s": 0.5},
    {"id": "frame-2", "time_s": 1.0},
]
start, end = 0.4, 0.8
selected = [frame for frame in frames if start <= frame["time_s"] <= end]
assert [frame["id"] for frame in selected] == ["frame-1"]
patches_per_frame, text_tokens = 256, 200
assert len(frames) * patches_per_frame + text_tokens == 968
```

This arithmetic is a teaching budget, not a model-specific tokenizer. An actual interface may resize, tile or encode frames differently. Always verify the model's documented treatment.

## Validate spatial outputs {#coordinates}

```python
width, height = 640, 480
box = {"x1": 20, "y1": 30, "x2": 210, "y2": 160}
assert 0 <= box["x1"] < box["x2"] <= width
assert 0 <= box["y1"] < box["y2"] <= height
```

A valid bounding-box shape does not prove the box identifies the requested object. Check the coordinate frame, resize/crop transformation and semantic target. If a model proposes a UI action, treat the proposed coordinates as an input to a separately validated tool interface.

## Diagnose failures across modalities {#failure-modes}

| Failure | First boundaries to inspect |
| --- | --- |
| Wrong small text | Resolution, crop, OCR and visual encoder representation |
| Invented object or relation | Visual evidence, grounding instructions and response evaluation |
| Incorrect event order | Timestamp alignment and temporal sampling |
| Relevant source absent | Retrieval representation, metadata and index coverage |
| Good perception, wrong answer | Context assembly, question interpretation and generation |
| Correct answer with wrong citation | Provenance links and citation verification |

Audio introduces sample rate, duration and transcription uncertainty. Any-to-any systems also need modality-specific generation and evaluation. A shared model interface does not make an audio quality metric interchangeable with a text or video metric.

## Evaluate the complete application {#evaluation}

Build test cases with the original artifact and a clearly defined expected result. Include unreadable or ambiguous evidence, missing frames, conflicting captions and irrelevant sources. Assess both perceptual correctness and the final task contract, including access rules for source images or recordings.

A VLM judge can assist on some semantic criteria, but it can share the same perceptual blind spots as the generating model. Use representative human or deterministic checks where the task needs independent evidence. Record model, preprocessing and artifact versions with the result.

## Try it yourself {#practice}

Design a question that a one-frame-per-second sampler could miss. Specify a retrieval/sampling change and an evaluation case that would show whether it fixed the problem.

## Check your understanding {#self-check}

A sampled video contains a person at time 0 and a person at time 1. Can the system infer every action that happened in between?

??? question "Check your reasoning"
    No. Sampling can omit events. The answer must be limited by the available evidence, or the system must retrieve a denser segment. Temporal claims need evaluation against the relevant time interval, not just plausible endpoint images.

## Continue in order {#continue}

**Previous:** [26 · Connect images and language](vision-language.md)<br>
**Next:** [28 · Model sequences with a state-space model](state-space-models.md)

**Source reading:** [Vision-language models](https://aman.ai/primers/VLM/) · [Retrieval-augmented generation](https://aman.ai/primers/RAG/). The explanations and numerical examples on this page are original BuildMyX teaching material. Use the linked primers for further detail and their research bibliographies.
