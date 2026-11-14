---
title: "Engineer the context"
description: "Select and budget instructions, evidence, state and memory while retaining provenance."
course: Generative AI
lesson: CHAPTER 12 OF 32
---

# Engineer the context

<div class="genai-phase">GROUNDED APPLICATIONS · STEP 12 OF 32</div>

**After this chapter:** Select and budget instructions, evidence, state and memory while retaining provenance.

**Before you start:** [11 · Write instructions and validate outputs](prompting.md). Keep the [glossary](glossary.md) nearby when a term is new.

## Assemble what this request needs {#assembly}

Prompt engineering focuses on how a task is expressed. Context engineering also decides what information is supplied, when it is retrieved, how it is represented and what is retained across steps. Instructions, user input, examples, tool definitions, evidence, current state and memory compete for a finite budget.

Think of context assembly as a selection policy. Prefer relevant, current, permitted evidence with enough provenance to verify it. A large amount of available text is not automatically a useful working context.

## Keep state, memory and history distinct {#memory}

| Information | Example | Lifetime and control |
| --- | --- | --- |
| Current state | The workflow is waiting for a search result | Authoritative data for this run |
| Conversation history | Earlier turns in this session | Relevant portions selected for the next turn |
| Working notes | A checked plan and unresolved questions | Updated with provenance and revision rules |
| Persistent memory | An explicitly retained user preference | Requires a deliberate write/read policy |
| Retrieved evidence | A current workshop description | Bound to source, version and access permission |

Memory can become stale or contradictory. Record when a fact was observed, which source established it and how it can be updated or removed. Treating every generated sentence as a permanent fact creates a feedback loop of accumulating mistakes.

## Pack a bounded evidence set {#packing}

```python
candidates = [
    {"id": "python-1", "tokens": 90, "score": 0.95},
    {"id": "schedule-1", "tokens": 80, "score": 0.90},
    {"id": "history-1", "tokens": 200, "score": 0.20},
]
budget, selected, used = 200, [], 0
for record in sorted(candidates, key=lambda record: record["score"], reverse=True):
    if used + record["tokens"] <= budget:
        selected.append(record["id"])
        used += record["tokens"]
assert selected == ["python-1", "schedule-1"]
assert used <= budget
```

This greedy policy is a transparent baseline. Real packing can account for duplicate passages, diversity, document relationships and the cost of leaving out essential context. Preserve source IDs alongside content so later compression does not detach a claim from its evidence.

## Retrieve just enough, then disclose more {#progressive-disclosure}

Preloading is useful for short, stable instructions or a known small artifact. Just-in-time retrieval is useful when the needed detail depends on the question. Progressive disclosure can start with a compact index and fetch a relevant section when the next step needs it.

Tools and schemas also consume context. Give each node the interfaces it can actually use. Specialized workers can return a compact result plus evidence references, while an authoritative controller retains the shared run state. Additional workers introduce coordination and verification costs, which chapters 21–23 address.

## Compress without erasing the decision boundary {#compression}

Clearing an obsolete tool result, extracting structured notes and summarizing a conversation are different operations. Record decisions, open questions, source IDs and temporal qualifiers before replacing detail. Evaluate whether the compressed representation still answers the held-out questions that matter.

Common failures include poisoned context, distracting material, contradictory instructions, confused source roles and outdated memory. Diagnose which input boundary allowed the problem. An evaluation should inspect the selected context as well as the final answer; otherwise a generation change may conceal a retrieval or memory defect.

## Try it yourself {#practice}

Add two overlapping snippets and one expired snippet to the packing example. Define a policy that preserves current evidence and avoids paying twice for the same fact.

## Check your understanding {#self-check}

A summary says “the workshop is next Friday” but drops the date and source timestamp. What was lost?

??? question "Check your reasoning"
    The temporal reference frame and evidence provenance. A later run cannot reliably interpret “next Friday” or determine whether the statement is still current. Retain an absolute date, observation time and source reference where the task requires them.

## Continue in order {#continue}

**Previous:** [11 · Write instructions and validate outputs](prompting.md)<br>
**Next:** [13 · Build a retrieval-augmented generation pipeline](rag.md)

**Source reading:** [Context engineering](https://aman.ai/primers/context-engineering/). The explanations and numerical examples on this page are original BuildMyX teaching material. Use the linked primers for further detail and their research bibliographies.
