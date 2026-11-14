---
title: Generative AI source guide and further reading
description: How the 16 supplied Aman.ai primers map into the ordered course, with source snapshots and primary research starting points.
course: Generative AI
---

# Source guide and further reading

The supplied references form a broad research reading list. This course arranges their main subject areas into an original beginner-to-advanced teaching sequence, with worked numerical examples and projects. It is a curated learning path; use each primer and its bibliography for the deeper survey and model-specific material.

The 17 submitted links contain **16 unique pages**. The loop-and-graph engineering URL was supplied twice and appears once below. Sources were retrieved on **14 November 2026**. The course avoids using changing leaderboards or speculative model descriptions as established architectural facts.

## Follow each source into the course {#source-map}

| Supplied primer | Start in the course | Continue with… |
| --- | --- | --- |
| [Language models](https://aman.ai/primers/LLM/) | [01 · Start learning Generative AI](getting-started.md) | [02](math-and-learning.md) · [03](tokens-and-language.md) · [08](training-llms.md) · [09](decoding.md) · [10](serving-and-context.md) · [11](prompting.md) · [16](evaluation.md) |
| [Transformers](https://aman.ai/primers/transformers/) | [02 · The math behind a prediction](math-and-learning.md) | [03](tokens-and-language.md) · [07](transformers.md) |
| [Attention](https://aman.ai/primers/attention/) | [05 · Understand attention, one weighted sum at a time](attention.md) | [06](attention-efficiency.md) · [07](transformers.md) · [10](serving-and-context.md) |
| [Embeddings](https://aman.ai/primers/embeddings/) | [04 · Represent meaning with embeddings](embeddings.md) | [13](rag.md) · [14](retrieval-strategies.md) · [26](vision-language.md) |
| [Context engineering](https://aman.ai/primers/context-engineering/) | [11 · Write instructions and validate outputs](prompting.md) | [12](context-engineering.md) · [15](grounded-assistant.md) · [18](operations.md) · [21](agent-loops.md) |
| [Retrieval-augmented generation](https://aman.ai/primers/RAG/) | [13 · Build a retrieval-augmented generation pipeline](rag.md) | [14](retrieval-strategies.md) · [15](grounded-assistant.md) · [16](evaluation.md) · [23](workflow-project.md) · [27](multimodal-systems.md) · [32](capstone.md) |
| [LLM evaluation and judges](https://aman.ai/primers/LLM-as-a-judge/) | [17 · Evaluate with a calibrated LLM judge](llm-judges.md) | [32](capstone.md) |
| [Parameter-efficient tuning](https://aman.ai/primers/parameter-efficient-fine-tuning/) | [19 · Adapt a model with parameter-efficient tuning](fine-tuning.md) | The source bibliography for deeper study |
| [Knowledge distillation](https://aman.ai/primers/knowledge-distillation/) | [20 · Transfer behavior with knowledge distillation](distillation.md) | The source bibliography for deeper study |
| [Loop and graph engineering](https://aman.ai/primers/loop-and-graph-engineering/) | [18 · Operate and improve a GenAI application](operations.md) | [21](agent-loops.md) · [22](agent-graphs.md) · [23](workflow-project.md) · [32](capstone.md) |
| [Diffusion models](https://aman.ai/primers/diffusion-models/) | [24 · Learn to reverse a noising process](diffusion.md) | [25](conditional-diffusion.md) |
| [Vision-language models](https://aman.ai/primers/VLM/) | [26 · Connect images and language](vision-language.md) | [27](multimodal-systems.md) |
| [State-space models](https://aman.ai/primers/state-space-models/) | [28 · Model sequences with a state-space model](state-space-models.md) | The source bibliography for deeper study |
| [Recursive transformers](https://aman.ai/primers/recursive-transformers/) | [29 · Understand recursive computation](recursive-transformers.md) | The source bibliography for deeper study |
| [World modeling](https://aman.ai/primers/world-modeling/) | [30 · Predict a world and plan within it](world-models.md) | [31](physical-ai.md) |
| [Physical AI](https://aman.ai/primers/physical-ai/) | [31 · Connect perception, prediction and action](physical-ai.md) | The source bibliography for deeper study |

## Use research evidence at the right level {#evidence}

An architecture description, one benchmark result and a production reliability claim require different evidence. Read the task, data, baselines, compute budget and limitations of a paper before transferring a result to a new use case. Reproduce a small mechanism and evaluate the actual application contract.

| Topic | Primary starting point |
| --- | --- |
| Sequence architecture | [Attention Is All You Need](https://arxiv.org/abs/1706.03762) |
| Efficient exact attention | [FlashAttention](https://arxiv.org/abs/2205.14135) |
| Key/value sharing | [Grouped-Query Attention](https://arxiv.org/abs/2305.13245) |
| Sentence representations | [Sentence-BERT](https://arxiv.org/abs/1908.10084) |
| Retrieval and generation | [Retrieval-Augmented Generation](https://arxiv.org/abs/2005.11401) |
| Low-rank adaptation | [LoRA](https://arxiv.org/abs/2106.09685) and [QLoRA](https://arxiv.org/abs/2305.14314) |
| Teacher–student transfer | [Distilling the Knowledge in a Neural Network](https://arxiv.org/abs/1503.02531) |
| Judge evaluation | [MT-Bench and Chatbot Arena](https://arxiv.org/abs/2306.05685) |
| Denoising generation | [Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239) |
| Vision-language alignment | [CLIP](https://arxiv.org/abs/2103.00020) |
| Selective state-space models | [Mamba](https://arxiv.org/abs/2312.00752) |
| Predictive representations and control | [World Models](https://arxiv.org/abs/1803.10122) |
| Vision-language-action systems | [OpenVLA](https://arxiv.org/abs/2406.09246) |

## What the exercises establish {#validation}

The core Python programs check small numerical calculations and explicit application boundaries. They do not train or benchmark a large model, execute a robot controller or call a hosted model service. The included assistant is a deterministic extractive prototype with fictional records. Its tests establish only the documented behavior on those fixtures.

Model-specific integrations require their own environment, permissions, data treatment and evaluation. An example's successful assertion is a starting point for understanding, rather than a general capability claim.

## Credit and attribution {#credit}

The primers remain the work of their respective authors. This course links to them as source reading and presents original BuildMyX explanations, diagrams, numerical examples and teaching projects. Research ideas are attributed through the linked primary papers. Source-page fingerprints are retained in the curriculum manifest for editorial traceability; the course download contains our teaching files and metadata, rather than copies of the source articles.

[Back to the learning sequence](index.md#learning-sequence){ .md-button }
