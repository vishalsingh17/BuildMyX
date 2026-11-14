---
title: "Build a retrieval-augmented generation pipeline"
description: "Follow ingestion, retrieval, context assembly and cited generation end to end."
course: Generative AI
lesson: CHAPTER 13 OF 32
---

# Build a retrieval-augmented generation pipeline

<div class="genai-phase">GROUNDED APPLICATIONS · STEP 13 OF 32</div>

**After this chapter:** Follow ingestion, retrieval, context assembly and cited generation end to end.

**Before you start:** [12 · Engineer the context](context-engineering.md). Keep the [glossary](glossary.md) nearby when a term is new.

## Add a source of evidence to generation {#pipeline}

A retrieval-augmented generation system finds information outside a model's parameters and supplies selected material for an answer. The core flow is **ingest → represent → retrieve → assemble context → generate → verify**. Each boundary can fail independently.

The original [RAG research](https://arxiv.org/abs/2005.11401) combines learned retrieval with a generative model. Application pipelines also use the term for a wider range of designs. Be explicit about your retriever, corpus, generator and verification procedure.

## Prepare documents for the questions you expect {#ingestion}

Extract text while preserving useful structure: section titles, tables, page numbers, timestamps and document IDs. Store source location, version, language and access metadata. Remove duplicated or obsolete material under a defined policy. A corrupted extraction can become a confident-looking answer later.

Chunking should retain enough context for a question while keeping retrieval and generation costs manageable. Fixed windows are a baseline; sentence-, section- or structure-aware chunks may fit an artifact better. Overlap can preserve a boundary-spanning fact, but excessive overlap duplicates search results and evaluation examples.

```python
words = "Python functions take inputs and return values while classes group behavior".split()
size, overlap = 5, 1
assert size > overlap >= 0
chunks = [words[start:start + size] for start in range(0, len(words), size - overlap)]
assert chunks[0][-1] == chunks[1][0]
assert all(len(chunk) <= size for chunk in chunks)
```

## Retrieve within the permitted collection {#retrieval}

The lab’s role argument simulates an authenticated caller. A real application derives access scope from authoritative authentication and authorization; text in a prompt or an untrusted request cannot grant staff permission.

Encode queries and documents compatibly, choose a search metric and retain a reproducible index version. Apply the intended access restrictions before exposing candidates to a model or user. A later answer filter does not undo disclosure of a private passage in an earlier tool result.

```python
records = [
    {"id": "public-1", "role": "public", "text": "Python functions"},
    {"id": "staff-1", "role": "staff", "text": "Private staff arrangements"},
]
reader_role = "public"
permitted = [record for record in records if record["role"] == "public" or reader_role == "staff"]
assert [record["id"] for record in permitted] == ["public-1"]
```

Exact nearest-neighbor search on a small corpus provides a baseline for an approximate index. Measure filter correctness and retrieval quality, not just query speed. A database feature matrix is useful only after you identify required operations, update patterns, scale, operational needs and acceptable trade-offs.

## Generate with inspectable support {#answers}

Supply the question, bounded evidence and source identifiers under a clear task contract. Ask for the supported answer or a missing-information state. Verify citation membership and evaluate support. Retrieved text is evidence data, including when it contains instructions that conflict with the system's own policy.

Separate an empty result from a retriever outage and from relevant but insufficient evidence. These situations require different responses. Preserve enough provenance to reconstruct which source version produced a claim.

## Locate the first broken boundary {#diagnosis}

If the correct document never enters the candidate set, inspect ingestion, representation, query construction or filters. If it is retrieved but omitted from the final context, inspect ranking and packing. If adequate evidence reaches the generator but the answer adds an unsupported date, inspect instructions, generation and verification. Chapter 16 assigns metrics to these different boundaries.

## Try it yourself {#practice}

Take a short document with a heading and a two-row table. Propose chunk boundaries, metadata and one question that would be damaged by splitting the table incorrectly.

## Check your understanding {#self-check}

Why is evaluating only final answer accuracy insufficient for improving a RAG system?

??? question "Check your reasoning"
    It hides where failures occur. Retrieval can miss evidence while a model happens to guess correctly, or retrieval can succeed while generation fails. Measure relevant-document retrieval, context selection, answer support and task completion separately.

## Continue in order {#continue}

**Previous:** [12 · Engineer the context](context-engineering.md)<br>
**Next:** [14 · Improve retrieval and choose a RAG design](retrieval-strategies.md)

**Source reading:** [Retrieval-augmented generation](https://aman.ai/primers/RAG/) · [Embeddings](https://aman.ai/primers/embeddings/). The explanations and numerical examples on this page are original BuildMyX teaching material. Use the linked primers for further detail and their research bibliographies.
