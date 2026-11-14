---
title: "Improve retrieval and choose a RAG design"
description: "Use hybrid retrieval, reranking, query transformations and multi-hop designs when evidence supports them."
course: Generative AI
lesson: CHAPTER 14 OF 32
---

# Improve retrieval and choose a RAG design

<div class="genai-phase">GROUNDED APPLICATIONS · STEP 14 OF 32</div>

**After this chapter:** Use hybrid retrieval, reranking, query transformations and multi-hop designs when evidence supports them.

**Before you start:** [13 · Build a retrieval-augmented generation pipeline](rag.md). Keep the [glossary](glossary.md) nearby when a term is new.

## Establish a small exact-search baseline {#baseline}

Begin with inspectable queries, relevance labels and the simplest working retrieval method. Add complexity when a measured failure calls for it. Query latency alone cannot show that retrieved passages answer the question.

BM25 helps exact terms and identifiers. Dense retrieval helps semantic relationships when the encoder was trained appropriately. A cross-encoder can rerank a smaller candidate set by jointly reading each query-document pair. Late-interaction or multi-vector methods retain richer token-level matching at a different storage and computation cost.

## Fuse rankings without mixing incompatible scores {#hybrid}

Reciprocal rank fusion adds a contribution based on each document's rank in several lists. It does not require raw lexical and dense scores to share a scale. The offset controls how quickly rank contribution decays.

```python
lexical = ["python-1", "schedule-1", "data-1"]
semantic = ["data-1", "python-1", "support-1"]
scores = {}
for ranking in [lexical, semantic]:
    for rank, document_id in enumerate(ranking, 1):
        scores[document_id] = scores.get(document_id, 0.0) + 1 / (60 + rank)
fused = sorted(scores, key=scores.get, reverse=True)
assert fused[0] == "python-1"
assert set(fused) == set(lexical) | set(semantic)
```

Fusion combines candidate evidence; it does not prove the top item is relevant. Test both candidate recall and the final reranked order.

## Match the design to the failure {#variants}

| Observed need | Candidate design | New failure to test |
| --- | --- | --- |
| Ambiguous or conversational question | Rewrite using relevant prior turns | Introducing an unsupported interpretation |
| Vocabulary mismatch | Dense or hybrid retrieval | Confident semantic distractors |
| A question needs several facts | Decomposition and multi-hop retrieval | Losing a dependency or compounding an error |
| Evidence spans a document hierarchy | Parent-child or hierarchical retrieval | Returning an oversized or irrelevant parent |
| Relationships connect entities | Graph-assisted retrieval | Incorrect extracted edges or stale relationships |
| The next search depends on the first result | A bounded agentic retrieval loop | Cost, stagnation and premature stopping |
| Evidence contains figures, audio or video | Multimodal retrieval | Missing spatial or temporal support |

Multi-query retrieval and hypothetical-document approaches can broaden search. Keep the original question and treat generated query text as a search aid, rather than established evidence. Ensemble designs also need duplicate handling and consistent access filtering across every retriever.

## Handle conversation and context limits {#conversation}

A pronoun such as “that session” may require a prior turn to build the query. A complete conversation may contain irrelevant or private history. Select the minimum relevant state, preserve the user's current intent and measure rewrite quality independently.

Compare retrieved snippets, retrieved full documents and a long-context baseline for the same questions. Hierarchical summaries or iterative “RAG 2.0” designs vary in implementation; name the actual components and objectives rather than assuming a label defines one standard architecture.

## Choose storage using requirements {#storage}

Consider search/filter behavior, index update semantics, deletion, consistency, hybrid capabilities, dimensions, deployment constraints and recovery procedures. Benchmark the required workload at realistic corpus and concurrency sizes. Cache results only with a key that includes the meaningful corpus version, query treatment and access scope.

For deeper research, compare retrieval, reranking and generation ablations using held-out questions before adopting a more expensive architecture. Chapter 15 first builds the full boundary with a tiny corpus; it provides something concrete to improve.

## Try it yourself {#practice}

Construct one identifier query and one paraphrase query for the workshop corpus. Record the lexical and semantic candidates, then compare fusion with each method on its own.

## Check your understanding {#self-check}

Can a cache keyed only by question text safely reuse a result for every reader?

??? question "Check your reasoning"
    Only if all readers genuinely have the same permitted evidence and all other relevant settings match. A robust key also accounts for access scope, corpus/index version and query processing. A cached private result must not become a public answer.

## Continue in order {#continue}

**Previous:** [13 · Build a retrieval-augmented generation pipeline](rag.md)<br>
**Next:** [15 · Project: a grounded workshop assistant](grounded-assistant.md)

**Source reading:** [Retrieval-augmented generation](https://aman.ai/primers/RAG/) · [Embeddings](https://aman.ai/primers/embeddings/). The explanations and numerical examples on this page are original BuildMyX teaching material. Use the linked primers for further detail and their research bibliographies.
