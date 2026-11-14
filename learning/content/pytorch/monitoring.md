---
title: Monitor, version and improve a model
description: Separate system health from model quality, calculate distribution drift, join delayed feedback and design controlled retraining, shadow and A/B workflows.
course: PyTorch
lesson: CHAPTER 17 OF 20
---

# Monitor, version and improve a model

## Monitor two different systems {#metrics}

System metrics describe operation: request rate, errors, p50/p95 latency, queue depth, CPU/GPU utilization and memory. Model metrics describe behavior: class distribution, confidence, calibration and task quality when labels become available. An endpoint can be fast and wrong, or accurate but too slow for the intended task.

For an image model, monitor resolution/channel/source changes and class-specific errors. For sentiment, monitor language, length, unknown-token/truncation rates and class balance. Compare similar populations and time windows; a changed customer mix can move a distribution without implying a model defect.

```python
from dataclasses import dataclass, asdict
from datetime import datetime, timezone

@dataclass
class InferenceRecord:
    request_id: str
    model_version: str
    prediction: int
    confidence: float
    elapsed_ms: float
    input_schema: str

record = InferenceRecord("example-1", "sentiment-v1", 1, 0.8, 4.0, "text-vocab-v1")
event = {**asdict(record), "timestamp": datetime.now(timezone.utc).isoformat()}
assert event["model_version"] == "sentiment-v1"
```

This is an in-memory teaching record, not an installed website monitoring integration. Avoid recording raw sensitive inputs when aggregate metadata or controlled example IDs answer the operational question. Prometheus/Grafana can display system counters and histograms; Elasticsearch/Kibana can explore structured logs; experiment tools can connect model-quality reports to their run artifacts.

## Drift is a signal to investigate {#drift}

Input drift means the observed input distribution changed. Prediction/confidence drift describes changed outputs. Concept drift means the relationship between inputs and targets changed. Unlabelled input statistics cannot by themselves prove that accuracy deteriorated. A lower confidence mean is also not a substitute for task labels or calibration measurement.

Population Stability Index (PSI) compares binned proportions. KL divergence is another distribution comparison and is asymmetric. Freeze bin definitions and reference windows, smooth empty bins deliberately and consider sample size. There is no universal threshold that proves a retraining decision is correct.

```python
import numpy as np

def psi(reference, current, epsilon=1e-6):
    reference, current = np.asarray(reference, dtype=float), np.asarray(current, dtype=float)
    if reference.shape != current.shape or reference.ndim != 1:
        raise ValueError("PSI requires matching one-dimensional bins")
    if not (np.isfinite(reference).all() and np.isfinite(current).all()):
        raise ValueError("Non-finite proportions")
    if (reference < 0).any() or (current < 0).any() or reference.sum() <= 0 or current.sum() <= 0:
        raise ValueError("Invalid proportions")
    p, q = np.clip(reference, epsilon, None), np.clip(current, epsilon, None)
    p, q = p / p.sum(), q / q.sum()
    return float(((q - p) * np.log(q / p)).sum())

reference = [0.6, 0.3, 0.1]
current = [0.2, 0.3, 0.5]
assert psi(reference, reference) == 0
assert psi(reference, current) > 0
```

A drift alert can trigger schema checks, label sampling and candidate training. Check upstream decoding, feature order or tokenizer changes first; retraining on a broken pipeline can preserve the error. A small moving window is noisy, and many simultaneous drift tests create false alerts without an appropriate policy.

## Join delayed labels to the right prediction {#feedback}

Feedback can arrive long after inference. Join by a stable request/example ID and retain the model version. Measure only labelled eligible examples in the chosen window and track label coverage; people who volunteer feedback can differ from everyone who used the model.

```python
predictions = {"a": {"prediction": 1, "model": "v1"},
               "b": {"prediction": 0, "model": "v1"}}
feedback = {"a": 1}
matched = [(row["prediction"], feedback[key]) for key, row in predictions.items() if key in feedback]
assert len(matched) == 1
accuracy = sum(pred == target for pred, target in matched) / len(matched)
assert accuracy == 1.0
assert len(matched) / len(predictions) == 0.5
```

Treat submitted labels as data requiring quality checks, not instructions to overwrite model behavior immediately. Preserve annotation guidelines, provenance, review status and the period covered by the labels.

## Version the whole procedure {#versioning}

Use source control for code/configuration, immutable dataset identifiers or DVC-style data references, and an artifact registry such as MLflow or a manifest in object storage. Preserve model, tokenizer/vocabulary, transforms, class order, environment, evaluation report and parent version. S3/GCS can hold artifacts, but a storage path alone is not a versioning protocol.

```python
manifest = {"candidate": "model-v2", "parent": "model-v1", "dataset": "reviews-snapshot-2",
            "code": "training-recipe-2", "preprocessing": "vocab-v1", "evaluation": "report-v2"}
assert {"candidate", "dataset", "preprocessing", "evaluation"}.issubset(manifest)
```

Immutable references make a rollback reproducible. Keep a stable prior version and check that clients can handle the response schema of either version before a rollout.

## Retrain a candidate, then evaluate release gates {#retraining}

A controlled workflow is validate data → train a candidate → evaluate against fixed acceptance criteria → review → promote an identified artifact. A scheduled or drift-triggered training job should not silently make its output the production model. Promotion is a separate decision from successfully completing an optimization loop.

```python
def candidate_can_be_released(metrics, *, owner_approved):
    return (owner_approved and metrics["schema_valid"] and metrics["macro_f1"] >= 0.8
            and metrics["p95_ms"] <= 100 and metrics["regression_checks_passed"])

candidate = {"schema_valid": True, "macro_f1": 0.85, "p95_ms": 40,
             "regression_checks_passed": True}
assert not candidate_can_be_released(candidate, owner_approved=False)
assert candidate_can_be_released(candidate, owner_approved=True)
```

These thresholds are illustrative policy values, not recommended defaults for every task. Record the real acceptance policy before looking at a candidate's results, including important class/subgroup regressions and resource constraints.

## Shadow, A/B and continuous evaluation {#rollouts}

**Shadow mode** evaluates a candidate on live-like traffic without using its outputs for user decisions. It measures compatibility and system behavior but cannot alone establish the candidate's causal business impact. **A/B testing** randomly assigns eligible units to procedures and compares predefined outcomes and guardrails. Choose the randomization unit carefully so the same user is not inconsistently exposed.

Continuous evaluation repeats quality checks as new labels and data arrive. Keep slice definitions and metric versions stable, examine delayed feedback and account for repeated looks at an experiment. A canary rollout limits exposure to a candidate; retain an atomic way to route back to the prior version if a release guardrail fails.

## Deployment responsibility and limits {#responsibility}

The reference also covers fairness, explainability, privacy and security. Audit relevant groups with suitable labels, denominators and uncertainty; aggregate accuracy can hide uneven errors. SHAP/LIME and saliency methods can investigate attribution, but do not automatically establish causality or fairness. Validate inputs, control artifact provenance/access and bound inference resources to reduce extraction, adversarial-input and operational risks.

Differential privacy provides a quantified bound on the effect of one training record under a specified mechanism and privacy accounting. DP-SGD uses per-example clipping and calibrated noise, with an epsilon/delta budget. It does not promise that reconstruction or membership inference is absolutely impossible. Libraries such as Opacus can help implement an appropriate training procedure, but useful privacy claims require the full assumptions and accountant.

## Practice

Why should a sudden confidence-distribution change trigger investigation rather than an automatic declaration that accuracy has fallen?

??? question "Check your reasoning"
    Confidence is an output distribution, not ground truth. The population, preprocessing, calibration or input difficulty may have changed. Check the data contract, collect representative labels, compare the appropriate metrics and preserve the model version before deciding whether to retrain or roll back.
