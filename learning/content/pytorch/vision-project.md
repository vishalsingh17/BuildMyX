---
title: A complete vision workflow
description: Connect a synthetic RGB dataset, CNN, train/validation loops, checkpoint, evaluation script and a locally tested inference API; adapt the stages to CIFAR-10.
course: PyTorch
lesson: CHAPTER 18 OF 20
---

# A complete vision workflow

## Keep the stages independently inspectable {#structure}

This project classifies synthetic red, green and blue image patterns. It is intentionally tiny and offline. It demonstrates the same data → model → training → evaluation → artifact → API boundaries used for CIFAR-10, without presenting toy-fixture results as benchmark performance.

Create the labelled files below, or download the [project bundle](assets/pytorch-projects.zip). From its parent folder, `python -m vision_project.train` trains and saves a local artifact. The package separates `data.py`, `model.py`, `train.py`, `evaluate.py` and `serve.py`; `__init__.py` marks it as a package.

```python
# file: vision_project/__init__.py
"""Original BuildMyX synthetic vision teaching project."""
```

## Data preparation {#data}

Each example is a 3×8×8 float image on `[0, 1]`. Split fixtures use different seeds. A real dataset adapter would decode/clean images and apply separately configured training/evaluation transforms before returning this same kind of batch contract.

```python
# file: vision_project/data.py
import torch
from torch.utils.data import Dataset

class ColorSamples(Dataset):
    def __init__(self, repeats=8, seed=70):
        generator = torch.Generator().manual_seed(seed)
        self.labels = torch.arange(3).repeat(repeats)
        self.images = torch.rand(len(self.labels), 3, 8, 8, generator=generator) * 0.05
        for index, label in enumerate(self.labels):
            self.images[index, label] += 0.8

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, index):
        return self.images[index], self.labels[index]
```

## Model definition {#model}

The CNN transforms channels with a learned 1×1 convolution, applies ReLU, averages spatial features and returns class logits. No softmax is applied before cross-entropy.

```python
# file: vision_project/model.py
from torch import nn

class ColorCNN(nn.Module):
    def __init__(self, classes=3):
        super().__init__()
        self.layers = nn.Sequential(nn.Conv2d(3, 6, 1), nn.ReLU(),
            nn.AdaptiveAvgPool2d(1), nn.Flatten(), nn.Linear(6, classes))

    def forward(self, images):
        return self.layers(images)
```

## Evaluation script {#evaluate}

Keep this function reusable for each epoch and for a later held-out report. Weight losses by example counts and reject an empty evaluation loader. A real report would also collect predictions for the class-specific metrics in [chapter 13](evaluation.md).

```python
# file: vision_project/evaluate.py
import torch
from torch.nn import functional as F

def evaluate(model, loader):
    model.eval()
    loss_sum, correct, count = 0.0, 0, 0
    with torch.inference_mode():
        for images, targets in loader:
            logits = model(images)
            loss_sum += F.cross_entropy(logits, targets).item() * len(targets)
            correct += logits.argmax(1).eq(targets).sum().item()
            count += len(targets)
    if count == 0:
        raise ValueError("Empty evaluation dataset")
    return {"loss": loss_sum / count, "accuracy": correct / count, "count": count}
```

## Training and checkpoint selection {#train}

`fit` can accept another compatible pair of loaders. `run_training` supplies the small course fixture, writes the selected weights and saves the inference metadata. Validation loss chooses the best epoch; the final test fixture is created separately below.

```python
# file: vision_project/train.py
import copy
import json
from pathlib import Path
import torch
from torch.nn import functional as F
from torch.utils.data import DataLoader
from .data import ColorSamples
from .model import ColorCNN
from .evaluate import evaluate

def fit(model, training, validation, epochs=18, lr=0.15):
    optimizer = torch.optim.SGD(model.parameters(), lr=lr)
    best, state, history = float("inf"), None, []
    for epoch in range(epochs):
        model.train()
        for images, targets in training:
            optimizer.zero_grad(set_to_none=True)
            loss = F.cross_entropy(model(images), targets)
            loss.backward()
            optimizer.step()
        metrics = evaluate(model, validation)
        history.append({"epoch": epoch, **metrics})
        if metrics["loss"] < best:
            best, state = metrics["loss"], copy.deepcopy(model.state_dict())
    if state is None:
        raise ValueError("Training needs at least one valid epoch")
    model.load_state_dict(state)
    return history

def run_training(destination="vision-artifact"):
    torch.manual_seed(71)
    training = DataLoader(ColorSamples(seed=70), batch_size=8, shuffle=True,
        generator=torch.Generator().manual_seed(71))
    validation = DataLoader(ColorSamples(repeats=2, seed=72), batch_size=6)
    model = ColorCNN()
    history = fit(model, training, validation)
    folder = Path(destination)
    folder.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), folder / "weights.pt")
    metadata = {"schema_version": 1, "model_version": "colors-v1",
        "classes": ["red", "green", "blue"], "input": "float32-NCHW-RGB-8x8-[0,1]"}
    (folder / "metadata.json").write_text(json.dumps(metadata), encoding="utf-8")
    (folder / "history.json").write_text(json.dumps(history), encoding="utf-8")
    return model, history

if __name__ == "__main__":
    run_training()
```

## Load the artifact and expose a local API {#serve}

Validate the model's expected tensor contract before inference. The example accepts a JSON array for clarity; an image-upload service would also decode and validate an image format, using the same saved preprocessing policy. `create_app` loads one artifact and serves its identity with every prediction.

```python
# file: vision_project/serve.py
import json
from pathlib import Path
import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from .model import ColorCNN

def load_artifact(folder):
    folder = Path(folder)
    metadata = json.loads((folder / "metadata.json").read_text(encoding="utf-8"))
    if metadata.get("schema_version") != 1 or metadata.get("classes") != ["red", "green", "blue"]:
        raise ValueError("Unsupported vision artifact")
    model = ColorCNN()
    model.load_state_dict(torch.load(folder / "weights.pt", map_location="cpu", weights_only=True))
    return model.eval(), metadata

def predict_images(model, images):
    images = torch.as_tensor(images, dtype=torch.float32)
    if images.ndim != 4 or tuple(images.shape[1:]) != (3, 8, 8) or not 1 <= len(images) <= 16:
        raise ValueError("Expected 1–16 NCHW RGB 8x8 images")
    if not torch.isfinite(images).all() or images.min() < 0 or images.max() > 1:
        raise ValueError("Expected finite image values in [0,1]")
    with torch.inference_mode():
        return model(images).argmax(1).tolist()

class ImagesRequest(BaseModel):
    images: list = Field(min_length=1, max_length=16)

def create_app(folder):
    model, metadata = load_artifact(folder)
    app = FastAPI(title="Local color-pattern classifier")
    @app.post("/predict")
    def predict(request: ImagesRequest):
        try:
            classes = predict_images(model, request.images)
        except (ValueError, TypeError) as error:
            raise HTTPException(status_code=422, detail=str(error)) from error
        return {"model_version": metadata["model_version"], "classes": classes}
    return app
```

## Run the complete local flow {#run}

The API test uses an in-process client; no server is exposed. Keep this type of contract test when replacing the fixture with a real dataset, and add the task's evaluation report before any actual rollout.

```python
from torch.utils.data import DataLoader
from fastapi.testclient import TestClient
from vision_project.data import ColorSamples
from vision_project.train import run_training
from vision_project.evaluate import evaluate
from vision_project.serve import load_artifact, predict_images, create_app
import torch

model, history = run_training()
assert history[-1]["loss"] < history[0]["loss"]
test_data = ColorSamples(repeats=2, seed=73)
metrics = evaluate(model, DataLoader(test_data, batch_size=4))
assert metrics["count"] == 6
restored, metadata = load_artifact("vision-artifact")
torch.testing.assert_close(restored(test_data.images), model(test_data.images))
assert len(predict_images(restored, test_data.images)) == 6
with TestClient(create_app("vision-artifact")) as client:
    response = client.post("/predict", json={"images": test_data.images[:2].tolist()})
    assert response.status_code == 200 and len(response.json()["classes"]) == 2
    assert client.post("/predict", json={"images": [[1, 2]]}).status_code == 422
```

## Adapt and operate the CIFAR-10 workflow {#cifar-workflow}

Use [the CIFAR-10 data adapter](vision-data.md#cifar10), construct `ColorCNN(classes=10)` or a suitable larger CNN, and pass its train/validation loaders to `fit`. Update metadata, class order and image-shape validation together for 32×32 inputs. Preserve the official test partition for the final accuracy/F1/confusion-matrix report. The fixture's simple color features are not a suitable claim about ten-class object recognition.

For experimentation, create a new model/optimizer per configuration, log validation results and compare under a fixed budget. After selecting a candidate, use the export, optimization and monitoring chapters to check runtime parity, latency, input drift and delayed labels. A changed mean image value is an alert for investigation, not an automatic instruction to promote a new model.

## Practice

Why must you change the saved input schema and API validation when replacing the toy 8×8 dataset with CIFAR-10?

??? question "Check your reasoning"
    The actual input resolution, class count, class names and preprocessing now differ. A model that accepts a tensor shape internally does not make the old artifact metadata or public input contract correct. Version and validate the whole procedure together.
