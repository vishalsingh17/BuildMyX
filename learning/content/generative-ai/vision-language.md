---
title: "Connect images and language"
description: "Distinguish aligned embeddings, multimodal fusion and generative vision-language models."
course: Generative AI
lesson: CHAPTER 26 OF 32
---

# Connect images and language

<div class="genai-phase">OTHER GENERATIVE MODELS · STEP 26 OF 32</div>

**After this chapter:** Distinguish aligned embeddings, multimodal fusion and generative vision-language models.

**Before you start:** [25 · Condition image and video generation](conditional-diffusion.md). Keep the [glossary](glossary.md) nearby when a term is new.

## Identify the vision-language task first {#tasks}

Image retrieval, captioning, visual question answering, OCR, grounding and video understanding expose different input/output requirements. A model that matches a picture to a label does not necessarily generate a faithful description of every detail in that picture.

Represent an image as pixels, patches or encoded visual tokens. A vision encoder converts those inputs into features. A language component encodes text or generates a response. The connection between the components determines whether the system primarily aligns representations, fuses modalities or generates a sequence conditioned on visual information.

## Align representations or generate a response {#architectures}

| Design | Main interface | What to inspect |
| --- | --- | --- |
| Dual encoder | Compare image and text embeddings | Similarity calibration and candidate-label coverage |
| Fusion / cross-attention | Joint reasoning over visual and language features | Which details survive the visual representation |
| Projector or bridge into a language model | Generate text with visual features in context | Alignment training, grounding and output support |
| Any-to-any multimodal system | Read and/or produce several modalities | Modality-specific representations and decoders |

[CLIP](https://arxiv.org/abs/2103.00020) is a foundational aligned-embedding example. BLIP-2, Flamingo and LLaVA illustrate other connections between vision and language components. Study their actual architecture and training procedure before assuming they provide the same interface.

## Score a tiny shared embedding space {#similarity}

```python
images = {"image-A": [1.0, 0.0], "image-B": [0.0, 1.0]}
labels = {"a diagram": [0.9, 0.1], "a garden": [0.1, 0.9]}

def score(left, right):
    return sum(x*y for x, y in zip(left, right))

ranking = sorted(labels, key=lambda label: score(images["image-A"], labels[label]), reverse=True)
assert ranking[0] == "a diagram"
assert score(images["image-A"], labels["a diagram"]) > score(images["image-A"], labels["a garden"])
```

These hand-chosen coordinates illustrate matching. A real encoder needs learned geometry, normalization choices and evaluation. Selecting the best of two labels means “best among these candidates,” rather than proving that either label describes the image correctly.

## Keep training stages distinct {#training}

An alignment stage can connect image and text representations or a visual bridge and a language model. Supervised multimodal instruction tuning teaches response behavior on selected tasks. Fine-tuning may update the vision encoder, bridge, language model or an adapter subset. Record which parts are frozen and what examples supply supervision.

Image-text correspondence can be weak: a caption may omit most of the scene, contain an inference or refer to surrounding context. Grounding and instruction quality depend on more than collecting many paired files.

## Evaluate perception and language separately {#grounding}

A response can be grammatically strong while misreading a small label, counting an object twice or inventing a spatial relationship. Preserve the original input, resolution and any crop or resize transformations so errors can be traced.

Test tasks that require exact text, location, count, relation and uncertainty. For a diagram question, ask whether the answer follows an actual arrow or a plausible convention. If evidence is unreadable, the output should communicate that limitation rather than filling in a familiar-looking label.

Deployment adds image-token budgets, resolution-dependent cost and latency. Chapter 27 connects those constraints to retrieval and time-sensitive multimodal evidence.

## Try it yourself {#practice}

Add a third candidate label that is unrelated to either image. Explain how a closed candidate set can make a top-ranked result look more certain than the evidence warrants.

## Check your understanding {#self-check}

A model chooses “a diagram” over “a garden” with a large score gap. Can it conclude that the diagram contains a correctly labeled feedback loop?

??? question "Check your reasoning"
    No. The matching decision and the detailed structural claim are different tasks. The latter needs relevant visual evidence and a grounded assessment of labels, edges and directions.

## Continue in order {#continue}

**Previous:** [25 · Condition image and video generation](conditional-diffusion.md)<br>
**Next:** [27 · Build and evaluate a multimodal system](multimodal-systems.md)

**Source reading:** [Vision-language models](https://aman.ai/primers/VLM/) · [Embeddings](https://aman.ai/primers/embeddings/). The explanations and numerical examples on this page are original BuildMyX teaching material. Use the linked primers for further detail and their research bibliographies.
