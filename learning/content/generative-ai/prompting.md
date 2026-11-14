---
title: "Write instructions and validate outputs"
description: "Build a clear task contract, useful examples and a checked structured response."
course: Generative AI
lesson: CHAPTER 11 OF 32
---

# Write instructions and validate outputs

<div class="genai-phase">GROUNDED APPLICATIONS · STEP 11 OF 32</div>

**After this chapter:** Build a clear task contract, useful examples and a checked structured response.

**Before you start:** [10 · Serve a model and manage long context](serving-and-context.md). Keep the [glossary](glossary.md) nearby when a term is new.

## Write a task another person could verify {#instructions}

A useful instruction names the task, the relevant evidence, the desired output and the response when evidence is insufficient. For our workshop assistant: answer the question using the supplied workshop records, cite the supporting record IDs, and return an explicit missing-information state when those records do not establish an answer.

A system-level policy, a user request and a retrieved document have different roles. Keep untrusted document text inside a data boundary. A passage that says “ignore the rules” is still passage content. Delimiters help organize the input; enforced tool and access boundaries carry responsibilities that prompt wording alone cannot provide.

## Make examples earn their space {#examples}

A few-shot example demonstrates the intended relationship between input and output. Include a supported answer, an unsupported request and a formatting edge case. Examples should match your evaluation task without leaking the final test set into the prompt.

Instruction specificity is a design choice. An overly broad request leaves important behavior ambiguous. An overly detailed template can overfit incidental phrasing and consume the evidence budget. Change one part at a time and compare held-out results.

## Validate the response contract {#structured-output}

A parseable object can still contain an unknown status, an invalid citation or an unsupported answer. Validate structure, allowed values and references before treating the result as accepted.

```python
import json

allowed_ids = {"schedule-1", "python-1"}
raw = '{"answer":"The Python session includes functions.","citations":["python-1"],"status":"answered"}'
response = json.loads(raw)
assert set(response) == {"answer", "citations", "status"}
assert isinstance(response["answer"], str)
assert response["status"] in {"answered", "needs_information"}
assert isinstance(response["citations"], list)
assert all(isinstance(value, str) and value in allowed_ids for value in response["citations"])
assert response["status"] != "answered" or bool(response["citations"])
```

These checks confirm the shape and reference membership. They do not prove that the cited text entails the answer. Chapter 16 adds evaluation of support, and chapter 17 adds calibrated semantic judgments where they are useful.

## Treat tool calls as typed proposals {#tools}

A tool interface should specify a clear name, parameter types, allowed values and an explicit result shape. The application validates a proposed call and decides whether it is allowed. A model-generated tool name is not itself authorization.

For a workshop search tool, a narrow interface might accept a query and reader role, return approved document IDs and excerpts, and report a typed error when the index is unavailable. An operation that changes a registration needs a separate contract and control boundary. Retrieval failures should not be disguised as “no relevant information.”

## Use a debugging ladder {#debugging}

1. Check whether the task and expected response are clear.
2. Check whether the needed evidence reached the model.
3. Check examples, ordering, role boundaries and output budget.
4. Check structured parsing and downstream verification.
5. Compare a measured change against the same baseline.

Reasoning prompts, decomposition, self-consistency and critique can support some tasks. Their extra calls and generated text also cost time and tokens. Use checkable results to decide whether that additional computation helped.

## Try it yourself {#practice}

Write a supported and an unsupported few-shot example for one workshop question. Keep their output schema identical and explain which status and citation differences communicate the boundary.

## Check your understanding {#self-check}

The output passes JSON validation and cites an existing record. Is the answer now verified?

??? question "Check your reasoning"
    Only part of the contract is verified. The citation may be unrelated or contradictory, and the answer may add unsupported details. Check evidence support and the application-specific requirements separately from syntax.

## Continue in order {#continue}

**Previous:** [10 · Serve a model and manage long context](serving-and-context.md)<br>
**Next:** [12 · Engineer the context](context-engineering.md)

**Source reading:** [Language models](https://aman.ai/primers/LLM/) · [Context engineering](https://aman.ai/primers/context-engineering/). The explanations and numerical examples on this page are original BuildMyX teaching material. Use the linked primers for further detail and their research bibliographies.
