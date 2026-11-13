---
title: Serve and validate predictions
description: Define a small FastAPI inference contract, test requests locally, record model identity and compare serving approaches without deploying a public endpoint.
course: PyTorch
lesson: CHAPTER 15 OF 20
---

# Serve and validate predictions

## Choose an inference interface {#infrastructure}

A batch script, local library call and network service expose different interfaces. FastAPI or Flask can wrap a Python model; a specialized runtime can execute an exported graph; managed cloud endpoints can handle packaging and scaling. Define input/output schemas and resource limits independently of the hosting choice.

The reference mentions TorchServe. Its repository is archived, so it is useful context for existing installations rather than a default recommendation for a new service. Evaluate the maintenance status and operator support of any serving framework you choose.

## Define a bounded request and response {#fastapi}

This example uses FastAPI 0.162.7 and HTTPX 0.28.1. It constructs an app in memory and tests it with `TestClient`; it does not start a public server. The fixed weights make the example inspectable. In a real service, load a validated, versioned artifact once during application startup.

```python
import math
import time
import torch
from torch import nn
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import BaseModel, Field, field_validator

MODEL_VERSION = "two-feature-teaching-v1"
model = nn.Linear(2, 2)
with torch.no_grad():
    model.weight.copy_(torch.tensor([[-1., -1.], [1., 1.]]))
    model.bias.zero_()
model.eval()

class PredictionRequest(BaseModel):
    features: list[list[float]] = Field(min_length=1, max_length=64)

    @field_validator("features")
    @classmethod
    def check_rows(cls, rows):
        if any(len(row) != 2 for row in rows):
            raise ValueError("Every row needs exactly two features")
        if any(not math.isfinite(value) or abs(value) > 1_000_000 for row in rows for value in row):
            raise ValueError("Features must be finite and within the documented range")
        return rows

class PredictionResponse(BaseModel):
    model_version: str
    classes: list[int]
    probabilities: list[list[float]]

app = FastAPI(title="Local teaching classifier")
```

An image API additionally validates decoded format, channel count, dimensions and the preprocessing version. A text API validates type, length, empty inputs and tokenizer identity. Do not accept a caller's arbitrary model path or Python pickle as an inference request.

## Predict in evaluation and inference modes {#endpoint}

The synchronous endpoint validates the payload, constructs a float tensor, runs the model without autograd and returns ordinary JSON-compatible values. Return a model version with predictions so clients can identify which procedure produced them.

```python
@app.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest):
    features = torch.tensor(request.features, dtype=torch.float32)
    with torch.inference_mode():
        probabilities = model(features).softmax(dim=1)
    return {"model_version": MODEL_VERSION,
            "classes": probabilities.argmax(dim=1).tolist(),
            "probabilities": probabilities.tolist()}

@app.get("/health")
def health():
    return {"status": "ready", "model_version": MODEL_VERSION}

with TestClient(app) as client:
    response = client.post("/predict", json={"features": [[1, 2], [-1, -2]]})
    assert response.status_code == 200
    body = response.json()
    assert body["classes"] == [1, 0]
    assert body["model_version"] == MODEL_VERSION
    assert len(body["probabilities"]) == 2
    assert client.get("/health").json()["status"] == "ready"
```

`eval()` does not disable gradients by itself. Loading the model once also avoids paying initialization and file I/O costs for every request. If the model is large, define readiness after artifacts load successfully and run a small warm-up before routing traffic.

## Test errors as part of the contract {#validation-tests}

```python
with TestClient(app) as client:
    assert client.post("/predict", json={"features": []}).status_code == 422
    assert client.post("/predict", json={"features": [[1, 2, 3]]}).status_code == 422
    assert client.post("/predict", json={"features": [[1e20, 2]]}).status_code == 422
    assert client.post("/predict", json={"features": [[1, 2]] * 65}).status_code == 422
```

Tests should cover the expected output class order, batch limits, malformed input, unsupported data and artifact incompatibility. Avoid returning implementation traces to ordinary callers; retain a structured internal error record with its model version.

## Latency, concurrency and hosting {#operations}

Record request count, errors, batch sizes, latency percentiles and saturation. An elapsed time around one model call excludes decoding, queueing and network transit. GPU work is asynchronous; synchronize or use supported timing events when benchmarking the device calculation.

```python
with TestClient(app) as client:
    started = time.perf_counter()
    result = client.post("/predict", json={"features": [[0.5, 0.5]]})
    elapsed_ms = (time.perf_counter() - started) * 1000
    log_record = {"model_version": MODEL_VERSION, "status": result.status_code,
                  "batch_size": 1, "elapsed_ms": elapsed_ms}
assert log_record["status"] == 200 and elapsed_ms >= 0
```

Flask is another Python HTTP option; asynchronous routes alone do not make a CPU/GPU-bound model non-blocking. Separate workers, bounded queues and batching may be needed for throughput. Containers can package a runtime for cloud CPU/GPU endpoints, Kubernetes or a managed service. Check artifact size, startup, resource availability and rollout behavior for the chosen host rather than assuming every function platform fits a large model.

The [vision](vision-project.md) and [text](text-project.md) projects provide complete local prediction functions. Wrap those same functions in this contract instead of rewriting preprocessing in the endpoint. The monitoring chapter adds feedback and release decisions; no website backend is changed by these teaching examples.

## Practice

Why is a `/health` response saying “process is running” insufficient to prove a model endpoint is ready?

??? question "Check your reasoning"
    The model or vocabulary may not have loaded, the device may be unavailable or a warm-up inference may fail. Distinguish process liveness from model readiness and expose the validated artifact's identity with the readiness result.
