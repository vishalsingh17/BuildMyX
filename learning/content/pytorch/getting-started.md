---
title: Get started with PyTorch
description: Set up a CPU learning environment, understand the data-to-model workflow and make your first prediction with explicit shapes.
course: PyTorch
lesson: CHAPTER 01 OF 20
---

# Get started with PyTorch

## Follow the complete workflow {#workflow}

PyTorch provides tensors, automatic differentiation and building blocks for neural networks. A useful workflow goes further than defining a model: prepare data, split it, train, evaluate, preserve the result and check predictions under the same preprocessing contract.

For an image classifier, a row of output scores might describe ten possible classes. For a sentence classifier, it might describe two sentiments. A token tagger makes a separate prediction at every word position. Keep the **unit of prediction** explicit before deciding what a batch or loss should look like.

## Set up a CPU environment {#setup}

The core examples target **Python 3.12+ and PyTorch 2.15.0**. A GPU is useful for larger workloads but unnecessary for these small exercises. Create a virtual environment in a new practice folder.

```sh
python -m venv .venv
# macOS/Linux:
source .venv/bin/activate
# Windows PowerShell instead:
# .venv\Scripts\Activate.ps1
```

This is the tested **Linux x86-64 CPU** package combination:

```sh
python -m pip install --extra-index-url https://download.pytorch.org/whl/cpu torch==2.15.0+cpu torchvision==0.29.2+cpu torchaudio==2.11.1+cpu
python -m pip install numpy==2.5.4 matplotlib==3.11.2 torchinfo==1.8.0 scikit-learn==1.9.1
```

For another operating system or a CUDA accelerator, use the [official installation selector](https://pytorch.org/get-started/locally/) and a compatible torch/vision/audio combination for that platform. Installing a CUDA wheel does not create a GPU or install a compatible system driver. Later chapters name their additional packages for serving, experiment tools and ONNX export.

```python
import torch

assert torch.__version__.split("+")[0] == "2.15.0"
device = torch.device("cpu")
features = torch.tensor([[1.0, 2.0], [3.0, 4.0]], device=device)
weights = torch.tensor([[0.5], [1.0]], device=device)
predictions = features @ weights
assert features.shape == (2, 2)
torch.testing.assert_close(predictions, torch.tensor([[2.5], [5.5]]))
```

The first dimension is the batch: two examples, each with two features. Matrix multiplication combines those features into one score per example. That is a prediction calculation, not evidence that the weights are good; learning adjusts weights against a defined target.

## Keep the shape contract visible {#contracts}

A tensor's dtype describes its values, its device describes where they live and its shape describes the axes. A model can accept the wrong semantic input even when a matrix multiplication happens to fit. Name the dimensions in your notes: `[batch, channels, height, width]` for conventional image tensors, or `[batch, tokens]` for token IDs.

```python
images = torch.zeros(2, 3, 8, 8)
token_ids = torch.tensor([[2, 3, 0], [4, 0, 0]], dtype=torch.long)
assert images.dtype == torch.float32
assert token_ids.dtype == torch.int64
assert images.device.type == "cpu"
assert images.shape[0] == token_ids.shape[0] == 2
```

Integer token IDs are lookup keys, not continuous numeric measurements. They become learned vectors through an embedding layer. Class-index targets also normally use `torch.long`; floating regression targets and binary probabilities use floating types.

## How to use the course {#practice-method}

Predict an example's result, run it, then change one input. Treat an unexpected shape as information about your assumptions. The core examples use fixed seeds where useful and small local fixtures; a seed is not a universal guarantee across devices or future releases.

Each chapter ends with a self-check. Core examples are executed during development and CI. Normal website builds check topic coverage, anchors and Python syntax without installing the training runtime into the web host. Blocks titled **Optional** explain their additional requirements and are not counted as CPU execution coverage.

## Practice

An image model expects `[batch, 3, 32, 32]`. A tensor has shape `[batch, 32, 32, 3]` and the same number of elements. Is changing its shape with `reshape` enough?

??? question "Check your reasoning"
    No. The channel axis is in a different position. Use an axis permutation such as `permute(0, 3, 1, 2)`; a reshape changes grouping in the existing element order. The shape chapter explains why equal element counts do not establish semantic equivalence.
