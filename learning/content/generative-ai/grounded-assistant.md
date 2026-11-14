---
title: "Project: a grounded workshop assistant"
description: "Build a small inspectable retrieval-and-answer prototype with citations and an abstention path."
course: Generative AI
lesson: CHAPTER 15 OF 32
---

# Project: a grounded workshop assistant

<div class="genai-phase">GROUNDED APPLICATIONS · STEP 15 OF 32</div>

**After this chapter:** Build a small inspectable retrieval-and-answer prototype with citations and an abstention path.

**Before you start:** [14 · Improve retrieval and choose a RAG design](retrieval-strategies.md). Keep the [glossary](glossary.md) nearby when a term is new.

## Build the boundary before connecting a model {#project}

This project uses fictional workshop documents and an extractive responder. It lets you inspect access filtering, retrieval, provenance and abstention with ordinary Python. An LLM can later implement the response contract while the retrieval and verification checks remain in place.

The first baseline uses token overlap. It is deliberately simple: a semantic encoder or a reranker can be compared against it using the evaluation cases you build next. Do not interpret its scores as calibrated answer confidence.

## Make retrieval and answer states explicit {#implementation}

The lab’s role argument simulates an authenticated caller. A real application derives access scope from authoritative authentication and authorization; text in a prompt or an untrusted request cannot grant staff permission.

```python
from dataclasses import dataclass
import re

@dataclass(frozen=True)
class Document:
    id: str
    text: str
    access: str = "public"

corpus = [
    Document("python-1", "The fictional Python workshop covers functions and dictionaries."),
    Document("data-1", "The fictional data workshop uses tables and joins."),
    Document("staff-1", "Private discount arrangements are for staff only.", "staff"),
]

def terms(text):
    return set(re.findall(r"[a-z0-9]+", text.lower()))

def answer(question, role="public"):
    permitted = [doc for doc in corpus if doc.access == "public" or role == "staff"]
    scored = [(len(terms(question) & terms(doc.text)), doc) for doc in permitted]
    scored.sort(key=lambda pair: (-pair[0], pair[1].id))
    if not scored or scored[0][0] == 0:
        return {"status": "needs_information", "answer": "No matching evidence in this collection.", "citations": []}
    selected = scored[0][1]
    return {"status": "answered", "answer": selected.text, "citations": [selected.id]}

result = answer("Python functions")
assert result["status"] == "answered" and result["citations"] == ["python-1"]
assert answer("gardening")["status"] == "needs_information"
assert answer("private discount")["citations"] == []
assert answer("private discount", role="staff")["citations"] == ["staff-1"]
```

The responder returns the source sentence, so its answer remains directly inspectable. A generative implementation would need further checks for added, omitted or contradictory claims. The fictional records are teaching fixtures, rather than advertised BuildMyX workshop policies.

## Inspect the whole result {#inspect}

Look at the query terms, permitted document set, candidate scores, chosen source and response. Try “functions and tables”: the top-one design may omit a relevant second passage. Try a negated or contradictory question: overlap alone cannot establish that a passage answers it.

A threshold on this overlap score is a heuristic. Calibrate any threshold using held-out questions and inspect abstention behavior. A system that answers everything and a system that abstains from everything can both fail the task in different ways.

## Introduce a generator through an adapter {#adapter}

Keep a narrow interface: input question plus approved evidence, output answer plus citation IDs and status. Supply the generator with the source text and provenance, then validate the response shape and evaluate support. Record the generator and prompt versions with the retrieval/index versions.

Treat temporary service failure separately from unsupported content. A retry should preserve the same request contract, respect a deadline and avoid repeating side effects. Chapter 23 applies those rules to a replayable workflow.

## Add a small evaluation set now {#cases}

Include supported questions, irrelevant questions, private-record requests, mixed-topic questions and ambiguous inputs. Write the expected evidence IDs or the expected abstention state before changing the retriever. These examples become a durable reference for the next chapters.

Download the [chapter labs and capstone files](assets/generative-ai-labs.zip) to keep the implementation, fictional fixtures and assertions together.

## Try it yourself {#practice}

Add a second public Python document and a mixed-topic question. Compare top-one with top-two retrieval and specify how the response should cite multiple supporting records.

## Check your understanding {#self-check}

The public answer does not contain the private document. Does that alone prove private evidence never reached the model?

??? question "Check your reasoning"
    No. Inspect the retrieval and context boundaries as well as the output. This example filters the permitted collection before ranking and response construction. A generator adapter must preserve that boundary.

## Continue in order {#continue}

**Previous:** [14 · Improve retrieval and choose a RAG design](retrieval-strategies.md)<br>
**Next:** [16 · Measure quality before changing the system](evaluation.md)

**Source reading:** [Retrieval-augmented generation](https://aman.ai/primers/RAG/) · [Context engineering](https://aman.ai/primers/context-engineering/). The explanations and numerical examples on this page are original BuildMyX teaching material. Use the linked primers for further detail and their research bibliographies.
