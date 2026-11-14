---
title: Generative AI glossary
description: Plain-language definitions with links back to the ordered lessons.
course: Generative AI
---

# Generative AI glossary

Use a definition to orient yourself, then return to the worked example. Several terms describe different interfaces in different model families; the chapter explains the intended setting.

## Activation {#activation}

A value computed inside a model for a particular input. It differs from a learned parameter shared across inputs. [Work through the concept →](math-and-learning.md)

## Adapter {#adapter}

A smaller trainable component added to or associated with a base model for adaptation. Its serving requirements depend on the method. [Work through the concept →](fine-tuning.md)

## Agent loop {#agent-loop}

A controller repeatedly proposes, executes and checks bounded steps using observations and authoritative state. [Work through the concept →](agent-loops.md)

## Attention {#attention}

A data-dependent weighted combination of values, formed from query–key scores under a defined access pattern. [Work through the concept →](attention.md)

## Autoregressive {#autoregressive}

A factorization that predicts an element using available earlier elements. [Work through the concept →](tokens-and-language.md)

## Batch {#batch}

A group of examples or requests processed together. Training batches and serving batches answer different optimization problems. [Work through the concept →](training-llms.md)

## Bi-encoder {#bi-encoder}

A retrieval design that represents the query and document independently so document vectors can be reused. [Work through the concept →](embeddings.md)

## BM25 {#bm25}

A lexical ranking approach using term-frequency saturation, document frequency and document-length treatment. [Work through the concept →](retrieval-strategies.md)

## Calibration {#calibration}

Checking or adjusting how a score or judgment relates to observed outcomes on a defined distribution. [Work through the concept →](llm-judges.md)

## Causal mask {#causal-mask}

An access rule preventing a prediction position from reading future positions. [Work through the concept →](attention.md)

## Checkpoint {#checkpoint}

A recorded model or workflow state with enough configuration and identity information to support the intended recovery. [Work through the concept →](workflow-project.md)

## Chunk {#chunk}

A unit of indexed source content with boundaries and metadata chosen for retrieval and answer construction. [Work through the concept →](rag.md)

## Classifier-free guidance {#classifier-free-guidance}

A sampling construction combining conditional and unconditional predictions under a stated convention. [Work through the concept →](conditional-diffusion.md)

## Context {#context}

The instructions, input, evidence, state and interfaces available during one model request. [Work through the concept →](context-engineering.md)

## Context engineering {#context-engineering}

The policy for selecting, representing, budgeting and updating information made available to a model or workflow. [Work through the concept →](context-engineering.md)

## Contrastive learning {#contrastive-learning}

Learning representations using compatible and contrasting examples under a specified objective. [Work through the concept →](embeddings.md)

## Cross-attention {#cross-attention}

Attention whose queries and keys/values come from different representation streams. [Work through the concept →](attention.md)

## Cross-encoder {#cross-encoder}

A model that jointly reads a query and candidate to score their relationship. [Work through the concept →](retrieval-strategies.md)

## Cross-entropy {#cross-entropy}

A loss that penalizes low predicted probability for a specified target distribution or correct event. [Work through the concept →](math-and-learning.md)

## Decoder {#decoder}

A component that produces output representations or a sequence according to an architecture-specific access pattern. [Work through the concept →](transformers.md)

## Diffusion {#diffusion}

A family of generative approaches connecting a corruption process, a learned denoising or score model and an inference sampler. [Work through the concept →](diffusion.md)

## Distillation {#distillation}

Training a student using teacher-provided information, such as probabilities, features or responses. [Work through the concept →](distillation.md)

## Embedding {#embedding}

A vector representation whose geometry should preserve relationships useful for the intended task. [Work through the concept →](embeddings.md)

## Encoder {#encoder}

A component that transforms available input into a representation for another task or component. [Work through the concept →](transformers.md)

## Evaluation set {#evaluation-set}

Cases and expected criteria used to assess behavior. Its separation from selection data matters. [Work through the concept →](evaluation.md)

## Fine-tuning {#fine-tuning}

Updating learned parameters using a selected adaptation objective and examples. [Work through the concept →](fine-tuning.md)

## FlashAttention {#flashattention}

An IO-aware exact-attention approach that changes implementation and intermediate storage rather than simply removing dense interactions. [Work through the concept →](attention-efficiency.md)

## GQA {#gqa}

Grouped-query attention: several query heads share a smaller set of key/value heads. [Work through the concept →](attention-efficiency.md)

## Gradient {#gradient}

A local derivative describing how a parameter change affects an objective. [Work through the concept →](math-and-learning.md)

## Graph {#graph}

Named units of work connected by data or control dependencies, with explicit join and recovery semantics. [Work through the concept →](agent-graphs.md)

## Grounding {#grounding}

Relating an output claim to the source, visual, temporal or environmental evidence that supports it. [Work through the concept →](grounded-assistant.md)

## Hallucination {#hallucination}

An output claim unsupported or contradicted by the task’s relevant evidence or facts. Define the evaluation convention explicitly. [Work through the concept →](evaluation.md)

## Idempotency {#idempotency}

A property that repeated attempts of an identified operation preserve the intended single-effect semantics. [Work through the concept →](operations.md)

## Inference {#inference}

Using learned parameters to compute a result for an input. [Work through the concept →](getting-started.md)

## JEPA {#jepa}

A joint-embedding predictive architecture that predicts representations under a specified target and learning design. [Work through the concept →](world-models.md)

## Judge {#judge}

A human or model measurement component applying an explicit evaluation criterion. [Work through the concept →](llm-judges.md)

## Key/value cache {#key-value-cache}

Stored past attention keys and values reused during compatible autoregressive decoding. [Work through the concept →](attention-efficiency.md)

## Latent {#latent}

An internal representation rather than a directly observed input or output. Its interpretation depends on the model. [Work through the concept →](world-models.md)

## Logit {#logit}

An unnormalized score before a normalization or selection operation. [Work through the concept →](math-and-learning.md)

## LoRA {#lora}

A low-rank parameter update added to selected base weight matrices during adaptation. [Work through the concept →](fine-tuning.md)

## Loss {#loss}

A numerical objective defining a particular training or evaluation penalty. [Work through the concept →](math-and-learning.md)

## Memory {#memory}

Information retained beyond one immediate model request under a defined read/write and provenance policy. [Work through the concept →](context-engineering.md)

## MoE {#moe}

A mixture-of-experts design that routes computation among expert components. [Work through the concept →](transformers.md)

## Multimodal {#multimodal}

Involving more than one input or output modality, such as text, images, audio or video. [Work through the concept →](vision-language.md)

## NDCG {#ndcg}

A ranking measure using graded relevance gains and position discounts, normalized against an ideal ranking. [Work through the concept →](evaluation.md)

## On-policy distillation {#on-policy-distillation}

Teacher supervision on states or prefixes generated by the student’s current behavior policy. [Work through the concept →](distillation.md)

## Parameter {#parameter}

A learned value shared across inputs under a model definition. [Work through the concept →](training-llms.md)

## PEFT {#peft}

Parameter-efficient fine-tuning: methods that adapt a selected or additional set of values instead of every base parameter. [Work through the concept →](fine-tuning.md)

## Perplexity {#perplexity}

The exponential of an average negative log-likelihood under a defined tokenization and data protocol. [Work through the concept →](tokens-and-language.md)

## Prefill {#prefill}

Processing the supplied input prefix before autoregressive decoding. [Work through the concept →](serving-and-context.md)

## Prompt {#prompt}

The expressed instructions, examples and input for a model request. [Work through the concept →](prompting.md)

## Provenance {#provenance}

The source identity, version and transformation history needed to inspect the support for a result. [Work through the concept →](rag.md)

## QLoRA {#qlora}

An adaptation approach that trains low-rank adapters over a quantized frozen base under its specific training design. [Work through the concept →](fine-tuning.md)

## RAG {#rag}

Retrieval-augmented generation: an explicit combination of evidence retrieval and generation. [Work through the concept →](rag.md)

## Recall at k {#recall-at-k}

The fraction of relevant items present in the first k retrieved results under a stated convention. [Work through the concept →](evaluation.md)

## Recursive depth {#recursive-depth}

Repeated internal model computation, potentially with shared parameters, under a defined update and halting schedule. [Work through the concept →](recursive-transformers.md)

## Reranker {#reranker}

A component that reorders an already retrieved candidate set using another relevance signal. [Work through the concept →](retrieval-strategies.md)

## Residual path {#residual-path}

A connection that adds a sublayer update to an existing representation. [Work through the concept →](transformers.md)

## RoPE {#rope}

Rotary position embeddings: a position-dependent transformation of query/key components. [Work through the concept →](transformers.md)

## RRF {#rrf}

Reciprocal rank fusion: combining rankings through contributions based on item positions. [Work through the concept →](retrieval-strategies.md)

## Sampler {#sampler}

The inference procedure that selects tokens or follows a generative model’s update trajectory. [Work through the concept →](decoding.md)

## Schema {#schema}

An explicit representation of allowed structure, types and related validation constraints. [Work through the concept →](prompting.md)

## Self-attention {#self-attention}

Attention using queries, keys and values derived from one representation sequence. [Work through the concept →](attention.md)

## SFT {#sft}

Supervised fine-tuning on selected input-output examples. [Work through the concept →](training-llms.md)

## Softmax {#softmax}

A normalization converting finite logits into positive values summing to one; masked positions need defined handling. [Work through the concept →](math-and-learning.md)

## SSM {#ssm}

A state-space model relating an evolving hidden state to inputs and outputs. [Work through the concept →](state-space-models.md)

## Temperature {#temperature}

A positive scale applied to logits before softmax under a stated convention. [Work through the concept →](decoding.md)

## Token {#token}

A model-interface unit mapped to an identifier by a tokenizer; it need not correspond to a word. [Work through the concept →](tokens-and-language.md)

## Transformer {#transformer}

An architecture built from attention, position handling, residual/normalization paths and feature transformations under a defined access pattern. [Work through the concept →](transformers.md)

## VLA {#vla}

A vision-language-action model connecting observations and language to an action representation. [Work through the concept →](physical-ai.md)

## VLM {#vlm}

A vision-language model whose exact encoding, fusion and generation interfaces depend on its architecture. [Work through the concept →](vision-language.md)

## World model {#world-model}

A learned representation or prediction mechanism used to model aspects of an environment for a stated purpose. [Work through the concept →](world-models.md)
