---
title: "Project: an assistant workflow you can replay"
description: "Connect retrieval, verification and a checkpointed controller with explicit failure states."
course: Generative AI
lesson: CHAPTER 23 OF 32
---

# Project: an assistant workflow you can replay

<div class="genai-phase">ADAPTATION AND AGENTS · STEP 23 OF 32</div>

**After this chapter:** Connect retrieval, verification and a checkpointed controller with explicit failure states.

**Before you start:** [22 · Connect work with a reliable graph](agent-graphs.md). Keep the [glossary](glossary.md) nearby when a term is new.

## Turn an assistant into a replayable state machine {#project}

Connect the retrieval and response contract to a controller with explicit stages. Our example uses synthetic results and writes no external records. It makes a run's state and the conditions for accepting an answer visible.

A useful checkpoint includes run ID, input/configuration identity, stage, evidence IDs, candidate artifact, verification result and remaining budget. Persist only the information your application is authorized to retain. In a real service, the checkpoint update must be atomic with respect to the intended state transition.

## Accept a result through one authoritative path {#controller}

```python
import json
from dataclasses import dataclass, asdict

@dataclass
class Run:
    request_id: str
    stage: str = "retrieve"
    evidence: tuple = ()
    answer: str = ""
    verified: bool = False
    budget: int = 3

run = Run("teaching-request-1")
while run.stage not in {"completed", "needs_information", "budget_exhausted"}:
    if run.budget <= 0:
        run.stage = "budget_exhausted"
        break
    run.budget -= 1
    if run.stage == "retrieve":
        run.evidence = ("python-1",)
        run.stage = "respond" if run.evidence else "needs_information"
    elif run.stage == "respond":
        run.answer = "The fictional Python workshop covers functions."
        run.stage = "verify"
    elif run.stage == "verify":
        run.verified = bool(run.answer and "python-1" in run.evidence)
        run.stage = "completed" if run.verified else "needs_information"
    else:
        raise ValueError("Unsupported state")
checkpoint = json.loads(json.dumps(asdict(run)))
assert checkpoint["stage"] == "completed" and checkpoint["verified"] is True
assert checkpoint["budget"] == 0
```

The verifier here checks a minimal fixture condition. Replace it with the task's required deterministic and semantic checks before interpreting “verified” as more than this exercise's acceptance condition.

## Preserve request identity during recovery {#replay}

```python
accepted = {}

def record_acceptance(request_id, value):
    if request_id in accepted:
        return accepted[request_id]
    accepted[request_id] = value
    return value

first = record_acceptance(run.request_id, checkpoint)
second = record_acceptance(run.request_id, {"stage": "different"})
assert first == second and len(accepted) == 1
```

This in-memory example shows stable replay identity. A multi-process application needs durable deduplication and a policy for conflicting payloads, revisions and expiry. Do not treat a local dictionary as durable storage.

## Add failures before adding more tools {#faults}

Exercise missing evidence, invalid response shape, a failed verification, a retriever timeout, a duplicate response and a late response for an earlier input revision. Keep the original input/configuration identity so a stale completion cannot confirm a changed request.

A state machine should distinguish “saved,” “notified” and “delivered” when those stages exist. A downstream notification failure should not automatically roll back an already accepted authoritative record or invite duplicate submissions. The correct semantics come from the application contract.

## Prepare the next experiment {#extension}

The capstone download combines this controller idea with a complete inspectable assistant and evaluation cases. A model adapter is an extension behind the same response contract. Keep access filtering, deadlines, replay identity and evaluation outside a model's generated prose.

By this point you can explain an end-to-end text application. The next chapters expand the model families and evidence types; they reuse the same habit of checking each boundary.

## Try it yourself {#practice}

Add a `revision` field and a proposed result carrying its own revision. Reject a stale completion, then verify that the correct current result can still complete the run.

## Check your understanding {#self-check}

A late result from input revision 1 arrives after the user changed the question to revision 2. Can the request ID alone establish that it answers the current question?

??? question "Check your reasoning"
    No. The acceptance boundary also needs the input or revision identity. A stable request ID helps deduplicate one operation; a changed question may define a different operation. Preserve the earlier result without marking the new question complete.

## Continue in order {#continue}

**Previous:** [22 · Connect work with a reliable graph](agent-graphs.md)<br>
**Next:** [24 · Learn to reverse a noising process](diffusion.md)

**Source reading:** [Loop and graph engineering](https://aman.ai/primers/loop-and-graph-engineering/) · [Retrieval-augmented generation](https://aman.ai/primers/RAG/). The explanations and numerical examples on this page are original BuildMyX teaching material. Use the linked primers for further detail and their research bibliographies.
