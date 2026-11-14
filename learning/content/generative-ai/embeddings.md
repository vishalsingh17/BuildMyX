---
title: "Represent meaning with embeddings"
description: "Compare lexical and learned representations, compute similarity and choose a retrieval representation."
course: Generative AI
lesson: CHAPTER 04 OF 32
---

# Represent meaning with embeddings

<div class="genai-phase">FOUNDATIONS · STEP 04 OF 32</div>

**After this chapter:** Compare lexical and learned representations, compute similarity and choose a retrieval representation.

**Before you start:** [03 · Tokens and language modeling](tokens-and-language.md). Keep the [glossary](glossary.md) nearby when a term is new.

## Choose what “similar” should mean {#meaning}

An embedding maps an item to a vector. Nearby vectors should reflect the relationship useful for a task: same topic, same meaning, matching image and caption, or a relevant answer to a query. Those relationships are different. Two passages can use similar words while contradicting each other; “refunds are allowed” and “refunds are prohibited” require more than a high similarity score.

**Static word vectors** assign one vector to a vocabulary item. **Contextual representations** let surrounding tokens change a word's representation. A sentence or document embedding additionally needs a pooling or training strategy that makes whole-item comparisons useful. Averaging arbitrary hidden states is a baseline to evaluate, rather than a universal recipe.

## Compare lexical and learned representations {#families}

| Representation | What it captures | A limitation to test |
| --- | --- | --- |
| Bag of words | Token occurrence or counts | Word order and synonyms |
| TF-IDF | Terms weighted by their document frequency | Vocabulary mismatch |
| BM25 | Saturating term frequency with length normalization | Semantic paraphrases |
| Word2Vec / GloVe | Distributional word relationships | A single static vector can mix senses |
| fastText | Word and subword information | Task relevance still needs measurement |
| Contextual encoders | Token meaning conditioned on context | Pooling and training objective matter |
| Sentence / retrieval encoders | Query-document or sentence relationships | Domain and language shift |
| Multimodal embeddings | Relationships across modalities | Spatial or temporal details can be lost |

Lexical retrieval remains useful for identifiers, rare names and exact strings. Learned representations can recover paraphrases. A hybrid often gives a stronger starting point than treating either representation as a universal winner.

## Calculate cosine similarity {#cosine}

Cosine similarity divides the dot product by both vector lengths. For nonzero vectors, it measures angle rather than magnitude. It is undefined for a zero vector, which the example rejects explicitly.

```python
import math

def cosine(left, right):
    assert len(left) == len(right)
    lengths = math.sqrt(sum(x*x for x in left)) * math.sqrt(sum(x*x for x in right))
    if lengths == 0:
        raise ValueError("A zero vector has no cosine direction")
    return sum(x*y for x, y in zip(left, right)) / lengths

query = [1.0, 0.0, 1.0]
documents = {"python": [2.0, 0.0, 2.0], "gardening": [0.0, 1.0, 0.0]}
ranked = sorted(documents, key=lambda name: cosine(query, documents[name]), reverse=True)
assert ranked[0] == "python"
assert math.isclose(cosine(query, documents["python"]), 1.0)
```

These hand-selected vectors illustrate the geometry. Their coordinates do not establish how a trained language encoder represents a real topic.

## Learn useful geometry {#training}

Contrastive learning pulls compatible pairs together and distinguishes them from negative examples. Hard negatives resemble a query while remaining irrelevant; mislabeled negatives can teach the wrong distinction. The treatment of duplicates, languages and near-identical passages affects both training and evaluation.

A **bi-encoder** encodes a query and each document independently, making stored document vectors reusable. A **cross-encoder** jointly reads a query-document pair and can make a richer relevance judgment at a higher per-pair cost. Late-interaction systems retain multiple token representations to balance these designs. Chapter 14 places them into a retrieval pipeline.

## Store, search and version embeddings {#indexing}

An approximate nearest-neighbor index trades exactness for speed and memory. Its distance metric, normalization, search parameters and filter behavior must fit the encoder. Exact search on a small test corpus provides a useful baseline.

Record encoder version, preprocessing, chunk boundaries and dimension with every index. Re-embedding only new queries with a different model can make existing document vectors incompatible. Matryoshka-style training can support useful truncated dimensions; arbitrary truncation does not inherit that property. Quantization, multi-vector representations and reranking should be measured against retrieval quality and memory on your own examples.

For foundational background, see [Word2Vec](https://arxiv.org/abs/1301.3781) and [Sentence-BERT](https://arxiv.org/abs/1908.10084). Multimodal alignment returns in chapter 26.

## Try it yourself {#practice}

Add a contradictory passage and a rare workshop identifier to a tiny corpus. Describe cases where lexical search should help and cases where a semantic encoder should help.

## Check your understanding {#self-check}

Two vectors have equal cosine similarity to a query. Does that prove the passages are equally correct?

??? question "Check your reasoning"
    No. Similarity is a retrieval signal. It does not establish truth, entailment, freshness or access permission. Check relevance and support after retrieval, and retain the source evidence used in the answer.

## Continue in order {#continue}

**Previous:** [03 · Tokens and language modeling](tokens-and-language.md)<br>
**Next:** [05 · Understand attention, one weighted sum at a time](attention.md)

**Source reading:** [Embeddings](https://aman.ai/primers/embeddings/). The explanations and numerical examples on this page are original BuildMyX teaching material. Use the linked primers for further detail and their research bibliographies.
