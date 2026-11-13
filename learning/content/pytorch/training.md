---
title: Train, validate and checkpoint
description: Build a complete optimization loop, aggregate losses correctly, separate evaluation mode, clip gradients and resume from a versioned checkpoint.
course: PyTorch
lesson: CHAPTER 10 OF 20
---

# Train, validate and checkpoint

## Define the components and data contract {#components}

A training workflow needs a model, loss, optimizer, train loader, validation procedure and model-selection rule. Decide what constitutes one observation before aggregating losses. A classification loop over images and a sentiment loop over token batches use the same optimization pattern, but their forward interfaces differ.

```python
import copy
from pathlib import Path
import random
import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

torch.manual_seed(20)
features = torch.tensor([[-2., -1.], [-1., -2.], [-2., -2.], [-1., -1.],
                         [1., 1.], [2., 1.], [1., 2.], [2., 2.]])
labels = torch.tensor([0, 0, 0, 0, 1, 1, 1, 1])
loader = DataLoader(TensorDataset(features, labels), batch_size=3, shuffle=True,
                    generator=torch.Generator().manual_seed(20))
model = nn.Linear(2, 2).to("cpu")
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.SGD(model.parameters(), lr=0.15)
```

This fixture is intentionally small and separable. Evaluating it demonstrates loop mechanics, not generalization. A real experiment uses a separate validation loader as explained in the previous chapters.

## Train one epoch {#train-loop}

Set training mode, clear previous gradients, calculate logits and loss, backpropagate, optionally clip gradients and update parameters. Clip **after** backward and **before** the optimizer step. Accumulate detached scalar losses weighted by batch size, so a short final batch does not count as much as a full one.

```python
def train_epoch(model, loader, optimizer, criterion):
    model.train()
    loss_sum, count = 0.0, 0
    for inputs, targets in loader:
        optimizer.zero_grad(set_to_none=True)
        logits = model(inputs)
        loss = criterion(logits, targets)
        if not torch.isfinite(loss):
            raise ValueError("Non-finite training loss")
        loss.backward()
        nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()
        loss_sum += loss.detach().item() * len(targets)
        count += len(targets)
    if count == 0:
        raise ValueError("Empty training loader")
    return loss_sum / count

first_loss = train_epoch(model, loader, optimizer, criterion)
for _ in range(15):
    last_loss = train_epoch(model, loader, optimizer, criterion)
assert last_loss < first_loss
```

Gradient clipping can limit exploding gradients, especially in recurrent networks. It does not fix a wrong target dtype, an invalid loss, a leaking split or an unsuitable learning rate. Training loss is not guaranteed to decrease every epoch, particularly with stochastic optimization.

## Validate without updating the model {#validation}

`eval()` selects evaluation behavior; `inference_mode()` avoids a gradient graph. Return the number of examples with aggregate metrics so another report can combine counts correctly. Accuracy is useful here, but the next evaluation chapter explains class-specific metrics.

```python
def evaluate(model, loader, criterion):
    model.eval()
    total_loss, correct, count = 0.0, 0, 0
    with torch.inference_mode():
        for inputs, targets in loader:
            logits = model(inputs)
            total_loss += criterion(logits, targets).item() * len(targets)
            correct += logits.argmax(dim=1).eq(targets).sum().item()
            count += len(targets)
    if count == 0:
        raise ValueError("Empty evaluation loader")
    return {"loss": total_loss / count, "accuracy": correct / count, "count": count}

result = evaluate(model, loader, criterion)
assert result["count"] == 8
assert result["accuracy"] == 1.0  # Training-fixture accuracy only.
```

For text, unpack `(tokens, lengths, targets)` and call `model(tokens, lengths)`. For images, use `(images, targets)`. Move every needed tensor to the chosen device, keeping recurrent packing lengths on the device expected by that API. A shared loop must not silently discard a model-specific argument.

## Early stopping and retaining the best state {#early-stopping}

Select the checkpoint using a validation metric chosen in advance. A patience counter tolerates a limited number of non-improving evaluations; a `min_delta` avoids treating tiny changes as meaningful. Copy a state dictionary if holding it in memory: an uncopied dictionary can retain references to weights that keep changing.

```python
best_loss, patience, remaining = float("inf"), 2, 2
best_state, best_epoch = None, None
for epoch, val_loss in enumerate([0.8, 0.6, 0.61, 0.62, 0.5]):
    if val_loss < best_loss - 1e-4:
        best_loss, best_epoch = val_loss, epoch
        best_state = copy.deepcopy(model.state_dict())
        remaining = patience
    else:
        remaining -= 1
        if remaining == 0:
            break
assert best_epoch == 1 and epoch == 3
assert best_state is not None
```

Do not inspect future epochs after the stopping decision and retroactively choose them. During hyperparameter tuning, record the stopping rule and effective compute budget, because early-stopped trials can use different amounts of training.

## Save enough state to resume {#checkpoint}

An inference artifact may need weights plus the model/preprocessing configuration. Resuming training additionally needs optimizer state, current epoch and any scheduler/scaler state you use. Exact mid-epoch replay can also require RNG state, sampler position and worker/data-pipeline state.

```python
checkpoint = {"schema_version": 1, "epoch": 16,
    "model": model.state_dict(), "optimizer": optimizer.state_dict(),
    "config": {"inputs": 2, "classes": 2, "torch_version": str(torch.__version__)}}
torch.save(checkpoint, "checkpoint.pt")
loaded = torch.load("checkpoint.pt", map_location="cpu", weights_only=True)
restored = nn.Linear(2, 2)
restored.load_state_dict(loaded["model"])
restored_optimizer = torch.optim.SGD(restored.parameters(), lr=0.15)
restored_optimizer.load_state_dict(loaded["optimizer"])
torch.testing.assert_close(restored(features), model(features))
assert loaded["epoch"] == 16
```

Load weights and constrained metadata from artifacts you trust, validate their schema and check the architecture. A saved Python object is not a portable substitute for a documented model contract. The export chapter compares formats and runtimes.

## Reproducibility and training logs {#reproducibility-logging}

Seed Python, NumPy and PyTorch, retain split IDs and package versions, and document device/precision settings. CUDA users can request deterministic algorithms and disable cuDNN benchmarking when appropriate; deterministic settings can reduce speed or reject unsupported operations. They do not guarantee identical results across every release and device.

```python
random.seed(20)
np.random.seed(20)
torch.manual_seed(20)
torch.backends.cudnn.benchmark = False
torch.backends.cudnn.deterministic = True
torch.use_deterministic_algorithms(True)
history = [{"epoch": 0, "train_loss": first_loss}, {"epoch": 15, "train_loss": last_loss}]
assert history[-1]["train_loss"] < history[0]["train_loss"]
```

Record train and validation metrics together, learning rate, checkpoint identity and elapsed time. Print statements help a small script; TensorBoard or W&B add persistent comparisons and plots. The [experiments chapter](experiments.md#logging) demonstrates both without a cloud account.

## Practice

Why should you not save `best_state = model.state_dict()` and assume it remains the best epoch after more training?

??? question "Check your reasoning"
    The dictionary can contain references to tensors that subsequent optimizer steps update. Deep-copy the state for an in-memory snapshot or serialize it when the validation criterion improves. Also retain the configuration and preprocessing needed to reproduce its predictions.
