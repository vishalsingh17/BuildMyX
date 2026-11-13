---
title: Orchestrate vision and text workflows
description: Structure versioned, retryable candidate pipelines, compare Prefect and Airflow, and keep evaluation and promotion separate in both vision and NLP examples.
course: PyTorch
lesson: CHAPTER 20 OF 20
---

# Orchestrate vision and text workflows

## Orchestration manages dependencies and state {#overview}

A workflow engine coordinates stages, retries, schedules and observability. It does not decide whether a model is correct. Keep data validation, training, evaluation and release policy as explicit tasks with immutable inputs and outputs. A drift signal can request investigation or candidate training without automatically replacing the current model.

<div class="architecture" role="img" aria-label="Versioned data flows into candidate training, then evaluation, then a separate release review.">
<div class="architecture__flow"><div class="architecture__node">Versioned data</div><span class="architecture__arrow" aria-hidden="true">→</span><div class="architecture__node">Train candidate</div><span class="architecture__arrow" aria-hidden="true">→</span><div class="architecture__node">Evaluate</div><span class="architecture__arrow" aria-hidden="true">→</span><div class="architecture__node">Review release</div></div>
</div>

| Decision | Prefect 3 | Airflow 3 |
| --- | --- | --- |
| Authoring | Python flows/tasks with ordinary control flow | DAGs and TaskFlow tasks, including dynamic task mapping |
| Runtime | A flow process plus the configured API/deployment infrastructure | Scheduler, metadata database, API/UI and executor/workers |
| Scheduling | Deployment schedules, served flows or workers | DAG schedules, asset/event triggers and executor configuration |
| Observability | Flow/task run state, retries, logs and UI | DAG/task instance state, retries, logs and UI |
| Useful fit | Python-centered workflows and flexible ML task composition | Teams already operating scheduled data DAG infrastructure |

Both can orchestrate conditional ML workflows. “Dynamic versus static” is too absolute a distinction: Airflow also supports dynamic mapping, branching and event-driven patterns. Choose based on your team's operating environment and task boundaries.

## Make the project tasks reusable and retryable {#tasks}

Extract the [project bundle](assets/pytorch-projects.zip) first; this chapter reuses its vision/text packages. A completed artifact gets a content hash and completion marker. Retrying the same run can reuse it after verifying the hash, rather than silently creating another model or overwriting the released version.

```python
# file: orchestration/__init__.py
"""Teaching workflows; framework integrations require separate installation."""
```

```python
# file: orchestration/common.py
import hashlib
import json
from pathlib import Path

def weight_hash(folder):
    return hashlib.sha256((Path(folder) / "weights.pt").read_bytes()).hexdigest()

def train_candidate(kind, run_folder):
    if kind not in ("vision", "text"):
        raise ValueError("Unknown project kind")
    folder = Path(run_folder) / kind
    complete = folder / "complete.json"
    if complete.is_file():
        marker = json.loads(complete.read_text(encoding="utf-8"))
        if marker["sha256"] != weight_hash(folder):
            raise ValueError("Completed artifact changed")
        return str(folder)
    if kind == "vision":
        from vision_project.train import run_training
    else:
        from text_project.train import run_training
    run_training(str(folder))
    complete.write_text(json.dumps({"kind": kind, "sha256": weight_hash(folder)}), encoding="utf-8")
    return str(folder)

def evaluate_candidate(folder):
    folder = Path(folder)
    history = json.loads((folder / "history.json").read_text(encoding="utf-8"))
    selected = min(history, key=lambda row: row["loss"])
    return {"artifact": str(folder), "sha256": weight_hash(folder),
            "validation_loss": selected["loss"], "validation_accuracy": selected["accuracy"]}

def stage_for_review(report):
    eligible = report["validation_loss"] < 2.0
    return {**report, "status": "awaiting-review" if eligible else "rejected"}
```

The loss threshold is a fixture policy, not a production acceptance rule. These tasks reuse saved validation history; a real candidate workflow also runs the independently defined evaluation/regression suite before review. Partial attempts need isolated run directories and a documented recovery policy. Never mark an artifact complete before its model and metadata are durably written.

## Exercise both paths without a workflow server {#local-run}

The core example runs ordinary Python functions. It trains local synthetic candidates, validates retry reuse and stages a report. It does not start Prefect, Airflow, a prediction service or a production deployment.

```python
from orchestration.common import train_candidate, evaluate_candidate, stage_for_review

for kind in ["vision", "text"]:
    artifact = train_candidate(kind, "candidate-run-1")
    assert train_candidate(kind, "candidate-run-1") == artifact
    report = stage_for_review(evaluate_candidate(artifact))
    assert report["status"] in ("awaiting-review", "rejected")
    assert len(report["sha256"]) == 64
```

## Prefect: installation, tasks and a flow {#prefect}

The optional recipe uses the Prefect 3 API. Install it in a separate workflow environment (`python -m pip install "prefect>=3,<4"`) alongside the project dependencies. Follow the [Prefect documentation](https://docs.prefect.io/v3/get-started) for the API/server or Cloud setup and selected infrastructure. The version range identifies the API generation; this course syntax-checks the recipe but does not start that runtime in its CPU example checks.

```python title="Optional: Prefect vision and text candidate flow"
# file: orchestration/prefect_pipeline.py
import argparse
from pathlib import Path
from prefect import flow, task
from prefect.runtime import flow_run
from prefect.schedules import Cron
from .common import train_candidate, evaluate_candidate, stage_for_review

@task(retries=2, retry_delay_seconds=5)
def train_task(kind, run_id):
    return train_candidate(kind, Path("candidate-runs") / run_id)

@task
def evaluate_task(folder):
    return evaluate_candidate(folder)

@task
def stage_task(report):
    return stage_for_review(report)

@flow(name="model-candidate-workflow", log_prints=True)
def candidate_workflow(kind="vision"):
    run_id = str(flow_run.id)
    artifact = train_task(kind, run_id)
    return stage_task(evaluate_task(artifact))

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("kind", choices=["vision", "text"])
    parser.add_argument("--schedule", action="store_true")
    args = parser.parse_args()
    if args.schedule:
        candidate_workflow.serve(name=f"{args.kind}-candidates", parameters={"kind": args.kind},
            schedule=Cron("0 3 * * *", timezone="UTC"))
    else:
        candidate_workflow(kind=args.kind)
```

## Run, schedule and extend Prefect {#prefect-scheduling}

From the extracted bundle's parent folder, run either candidate pipeline locally. Adding `--schedule` starts a served deployment and schedule in that configured Prefect environment; it is a separate operation from a one-off flow run.

```sh
python -m orchestration.prefect_pipeline vision
python -m orchestration.prefect_pipeline text
# In separate processes when you intend to create schedules:
python -m orchestration.prefect_pipeline vision --schedule
python -m orchestration.prefect_pipeline text --schedule
```

Use a new immutable run ID for a new dataset snapshot. A retry of the same task should reuse its original identity; a new training decision should not collide with yesterday's artifact. Configure task resources, concurrency, timeouts and retry policy for your workload. A persistent or remote worker also needs access to the referenced artifacts.

Optional integrations include W&B/MLflow tracking, S3/GCS artifact storage, owner-configured Slack/email alerts and Docker-based training/deployment tasks. Keep credentials in the runtime's credential mechanism. A notification can identify a candidate awaiting review; a notification or drift threshold is not an approval to promote it. No alerts are sent by this course.

## Airflow: setup and two TaskFlow DAGs {#airflow}

Use a separate Airflow 3 environment with the official constraints matching its version and Python interpreter; follow the [installation guide](https://airflow.apache.org/docs/apache-airflow/stable/installation/index.html). Configure its metadata database, executor, scheduler and UI/API. A local `airflow standalone` environment is useful for learning, while a production installation needs its own operational plan.

The current TaskFlow imports come from `airflow.sdk`. The DAG factory below creates one vision DAG and one sentiment DAG. Parsing the file constructs task dependencies; it does not train the models during DAG discovery. Put the file in the configured DAG folder or bundle with its project packages available to task workers.

```python title="Optional: Airflow vision and text DAGs"
# file: orchestration/airflow_dags.py
from datetime import timedelta
from pathlib import Path
import hashlib
import pendulum
from airflow.sdk import dag, task, get_current_context
from orchestration.common import train_candidate, evaluate_candidate, stage_for_review

@task(retries=2, retry_delay=timedelta(seconds=30))
def train_task(kind):
    context = get_current_context()
    run_key = hashlib.sha256(context["run_id"].encode()).hexdigest()[:20]
    return train_candidate(kind, Path("candidate-runs") / run_key)

@task
def evaluate_task(folder):
    return evaluate_candidate(folder)

@task
def stage_task(report):
    return stage_for_review(report)

def make_dag(kind, schedule):
    @dag(dag_id=f"buildmyx_{kind}_candidates", schedule=schedule,
         start_date=pendulum.datetime(2026, 1, 1, tz="UTC"),
         catchup=False, max_active_runs=1)
    def candidate_dag():
        artifact = train_task(kind)
        stage_task(evaluate_task(artifact))
    return candidate_dag()

vision_candidates = make_dag("vision", "0 3 * * *")
text_candidates = make_dag("text", "0 4 * * *")
```

## How the DAG and artifact boundaries work {#airflow-operation}

The return values establish train → evaluate → stage dependencies. Keep only small metadata/URIs in XCom; large tensor checkpoints belong in shared, versioned artifact storage. The local paths in this recipe require a shared filesystem. Distributed workers need an accessible object-store URI or mounted volume and a corresponding artifact loader.

Use branching for an evaluation or drift decision, sensors/assets when waiting for data and a container/external job for training that requires different dependencies or hardware. Do not train a GPU model inside the scheduler's parsing process. Retry task failures using the same run identity, and let a separate release task require a reviewed acceptance record before any serving alias changes.

Inspect task logs, failure reasons, durations, lineage and artifact hashes in the UI. Scheduling a DAG does not guarantee a dataset arrived on time, and retries do not make a non-idempotent side effect safe. Prefer explicit time-window inputs and immutable output paths for both vision and text.

## Practice

An orchestration retry runs after training finished but the task's acknowledgement was lost. Why is a fresh random artifact name on every retry a problem?

??? question "Check your reasoning"
    One logical training decision can create multiple different candidates and ambiguous downstream reports. Derive a stable task/run identity, verify an existing completed artifact and reuse it when appropriate. A new dataset snapshot or intentional new experiment should get a new identity, while production promotion remains a separate reviewed operation.
