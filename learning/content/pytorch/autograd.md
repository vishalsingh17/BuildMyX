---
title: Autograd, parameters and modules
description: Trace a derivative, distinguish backward from optimizer updates and define registered neural-network components with the correct training and inference modes.
course: PyTorch
lesson: CHAPTER 04 OF 20
---

# Autograd, parameters and modules

## Track a calculation and inspect its derivative {#gradients}

Autograd records differentiable operations when gradient tracking is enabled. `requires_grad=True` marks a floating or complex tensor whose derivatives are needed. Calling `backward()` on a scalar result accumulates derivatives in leaf tensors' `.grad` fields; it does not update the tensor values.

```python
import torch
from torch import nn

x = torch.tensor([2.0, -3.0], requires_grad=True)
loss = x.square().sum()
loss.backward()
torch.testing.assert_close(x.grad, torch.tensor([4.0, -6.0]))
assert x.tolist() == [2.0, -3.0]
x.grad = None
```

A fresh forward pass builds a fresh graph. Gradients accumulate across backward calls unless cleared; graph intermediates are normally released after a backward pass. Reusing a freed graph requires a deliberate reason, not an automatic `retain_graph=True` added to hide a loop mistake.

## Register a model's components {#modules}

Subclass `nn.Module`, call `super().__init__()`, assign layers in `__init__`, and describe the calculation in `forward`. `nn.Parameter` is a tensor subclass registered as a trainable parameter when assigned to a module. Ordinary tensors are not registered parameters. Use `register_buffer` for persistent non-parameter state, and `ModuleList`/`ModuleDict` for collections of layers.

```python
class SmallModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.layers = nn.Sequential(nn.Linear(2, 4), nn.ReLU(), nn.Linear(4, 2))
        self.temperature = nn.Parameter(torch.ones(()))
        self.register_buffer("offset", torch.zeros(2))

    def forward(self, features):
        return self.layers(features - self.offset) / self.temperature.clamp_min(0.1)

model = SmallModel()
assert model(torch.zeros(3, 2)).shape == (3, 2)
assert "temperature" in dict(model.named_parameters())
assert "offset" in dict(model.named_buffers())
assert "offset" in model.state_dict()
assert sum(p.numel() for p in model.parameters()) == 23
```

A plain Python list of layers does not provide the registration behavior of `ModuleList`. Registration controls discovery by `.parameters()`, serialization and device transfers. `model(inputs)` also runs registered module hooks; prefer it to calling `model.forward(inputs)` directly.

## Match the loss to the model output {#losses}

For multiclass classification, pass **raw logits** shaped `[batch, classes]` and integer class targets to `CrossEntropyLoss`. It includes the numerically stable log-softmax calculation. `NLLLoss` instead expects log probabilities. For binary classification, `BCEWithLogitsLoss` expects logits and floating targets; do not apply sigmoid before that loss.

```python
logits = torch.tensor([[2.0, -1.0], [-1.0, 2.0]], requires_grad=True)
targets = torch.tensor([0, 1], dtype=torch.long)
ce = nn.CrossEntropyLoss()(logits, targets)
nll = nn.NLLLoss()(logits.log_softmax(dim=1), targets)
torch.testing.assert_close(ce, nll)
assert ce.item() < 0.1
binary = nn.BCEWithLogitsLoss()(torch.tensor([2.0, -2.0]), torch.tensor([1.0, 0.0]))
assert binary.item() < 0.2
```

Softmax scores are convenient for reporting probabilities, but a high score is not proof of calibrated confidence or correctness on unfamiliar inputs. The evaluation chapter separates those questions.

## Clear, backpropagate and update {#optimizer}

`optimizer.zero_grad` clears old gradients. `loss.backward` computes new ones. `optimizer.step` applies an update using the optimizer's state and hyperparameters. Changing their order changes the algorithm.

```python
parameter = nn.Parameter(torch.tensor([0.0]))
optimizer = torch.optim.SGD([parameter], lr=0.1)
optimizer.zero_grad(set_to_none=True)
objective = (parameter - 3).square().sum()
objective.backward()
assert parameter.grad.item() == -6
optimizer.step()
torch.testing.assert_close(parameter.detach(), torch.tensor([0.6]))
```

SGD uses the gradient directly in this example. Adam maintains moment estimates; AdamW also implements decoupled weight decay. The optimizer receives parameter objects, so move a model to its training device before creating the optimizer.

## Training mode and gradient mode are different {#modes}

`model.train()` enables training-specific behavior such as dropout and BatchNorm running-statistic updates. `model.eval()` switches that behavior for evaluation. Neither call disables gradient tracking. Use `torch.no_grad()` or `torch.inference_mode()` when gradients are unnecessary. Inference mode is more restrictive and well suited to a pure prediction endpoint.

```python
dropout = nn.Dropout(p=0.5)
dropout.eval()
assert dropout(torch.ones(4)).equal(torch.ones(4))
model.eval()
assert model(torch.ones(1, 2)).requires_grad
with torch.inference_mode():
    predicted = model(torch.ones(1, 2))
assert not predicted.requires_grad
model.train()
assert model.training
```

Freeze a parameter using `requires_grad_(False)` when fine-tuning selected parts of a model. Avoid `.data` as a shortcut around autograd: an unchecked mutation can invalidate the derivatives you thought you were computing. The historical `Variable` wrapper is no longer needed; tensors already support autograd.

## Inspect a model summary {#summary}

Printing a module shows its structure. Counting `numel()` over parameters answers a different question: how many scalar weights are registered? `torchinfo` can additionally exercise a representative input and show layer shapes. It is a separate package, so pass an input shape that matches the actual forward interface.

```python
from torchinfo import summary

model.eval()
report = summary(model, input_size=(2, 2), verbose=0)
assert report.total_params == 23
assert sum(p.numel() for p in model.parameters() if p.requires_grad) == 23
assert isinstance(model.layers[0], nn.Linear)
print(model)
```

## Practice

You call `model.eval()` and still see tensors with `requires_grad=True`. Is evaluation mode broken?

??? question "Check your reasoning"
    No. Module training mode and autograd mode are separate controls. `eval()` changes layers such as dropout and BatchNorm. Use a no-grad or inference-mode context to avoid building a prediction graph when derivatives are unnecessary.
