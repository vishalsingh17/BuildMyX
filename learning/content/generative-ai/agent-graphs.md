---
title: "Connect work with a reliable graph"
description: "Choose graph topologies, handle parallel results and define recovery at every boundary."
course: Generative AI
lesson: CHAPTER 22 OF 32
---

# Connect work with a reliable graph

<div class="genai-phase">ADAPTATION AND AGENTS · STEP 22 OF 32</div>

**After this chapter:** Choose graph topologies, handle parallel results and define recovery at every boundary.

**Before you start:** [21 · Design a bounded agent loop](agent-loops.md). Keep the [glossary](glossary.md) nearby when a term is new.

## Draw dependencies before choosing a framework {#topologies}

A graph names units of work and the data or control edges between them. A linear pipeline is one graph. Fan-out/fan-in, routing, orchestrator-worker structures, review panels and hierarchical subgraphs support other dependency patterns. A graph that contains a retry or refinement loop is not necessarily a directed acyclic graph.

Define each node's input, output, access scope, failure types and completion condition. Separate deterministic transformations from model-based proposals. An extra agent or node needs a demonstrated role; multiplying components also multiplies interfaces to verify.

## Make a join condition explicit {#barriers}

A fan-in stage must know which results are required, how duplicates are handled and what partial failure means. Completion of one parallel task does not establish completion of the whole batch.

```python
required = {"retrieve", "policy_check"}
results = {}

def accept_result(task_id, value):
    if task_id in results and results[task_id] != value:
        raise ValueError("Conflicting replay requires reconciliation")
    results[task_id] = value

accept_result("retrieve", {"documents": ["python-1"]})
assert not required.issubset(results)
accept_result("policy_check", {"allowed": True})
accept_result("retrieve", {"documents": ["python-1"]})
assert required.issubset(results) and len(results) == 2
```

The dictionary makes this reducer deterministic for identical results and rejects a conflicting replay. In a durable system, the authoritative storage and update protocol must preserve the same property under concurrency.

## Choose the right coordination shape {#patterns}

| Shape | Useful when | A control question |
| --- | --- | --- |
| Pipeline | Dependencies are fixed | Can a failed stage be resumed safely? |
| Router | Different inputs need different capabilities | Is the route valid and permitted? |
| Fan-out/fan-in | Independent evidence can be collected concurrently | What constitutes a complete join? |
| Evaluator–optimizer | A proposal can be checked and improved | What stops stagnation or gaming? |
| Orchestrator–worker | Work can be decomposed into bounded tasks | Who owns shared state and the final decision? |
| Review panel | Diverse judgments add measured value | Are errors actually independent? |

Role-based conversation is one coordination interface, rather than an automatic guarantee of a sound graph. Discovery and convergence need explicit boundaries: first gather permitted candidates, then apply a defined reduction or selection rule.

## Keep state and cost coherent {#state}

Assign ownership for artifacts and authoritative state. Use versions or transactional updates to reject stale writes. An append-only event log plus snapshots can support replay and recovery; it also needs a policy for sensitive data and retention.

Limit concurrent tasks and use backpressure when a downstream resource cannot keep up. Track total cost across every branch. Parallel latency follows the critical path plus coordination overhead, while the bill includes work that may later be discarded.

## Design recovery at graph level {#recovery}

Distinguish failed, slow and semantically invalid nodes. Retry only eligible failures within the global budget. A partially completed graph needs an explicit choice: continue with an acceptable subset, compensate a reversible action, reconcile an uncertain effect or escalate for review.

Test deadlock, livelock, conflicting updates, correlated judge mistakes and unavailable dependencies. Observe node outcomes and the final trajectory. A graph is reliable when its contracts hold during those transitions, rather than merely when a diagram has many connected boxes.

## Try it yourself {#practice}

Draw a graph for comparing two retrieved sources and checking their dates. Mark which nodes can run concurrently, where they join and how an unavailable source changes the final status.

## Check your understanding {#self-check}

A summarizer receives one of three worker results and produces a polished answer. Why might that still violate the graph contract?

??? question "Check your reasoning"
    The join may require all three results or a defined acceptable subset. Fluency does not establish that required dependencies completed. The controller must verify the barrier condition and handle missing work explicitly.

## Continue in order {#continue}

**Previous:** [21 · Design a bounded agent loop](agent-loops.md)<br>
**Next:** [23 · Project: an assistant workflow you can replay](workflow-project.md)

**Source reading:** [Loop and graph engineering](https://aman.ai/primers/loop-and-graph-engineering/). The explanations and numerical examples on this page are original BuildMyX teaching material. Use the linked primers for further detail and their research bibliographies.
