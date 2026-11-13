---
title: Create and initialize tensors
description: Understand tensor shape, dtype and device, convert values deliberately and choose static, Xavier or Kaiming initialization.
course: PyTorch
lesson: CHAPTER 02 OF 20
---

# Create and initialize tensors

## Shape, size, element count and len {#shape-size}

`.shape` and `.size()` return a tensor's dimensions; `.size(dim)` returns one dimension. `.numel()` counts every element. This differs from NumPy's `.size` property, which counts elements. `len(tensor)` gives the first dimension and is undefined for a zero-dimensional scalar.

```python
import torch
from torch import nn
import numpy as np

x = torch.zeros(2, 3, 4)
assert x.shape == torch.Size([2, 3, 4])
assert x.size(1) == 3
assert x.numel() == 24
assert len(x) == 2
assert torch.tensor(7).ndim == 0
```

## Constructors and evenly spaced values {#constructors}

`torch.tensor` infers a dtype from supplied values unless you specify one. Prefer it to the older `torch.Tensor([...])` constructor, which commonly creates floating values even from integer-looking input. `zeros`, `ones` and `full` fill known values; `empty` allocates without initializing, so do not interpret its contents before filling them.

```python
ids = torch.tensor([2, 5, 7], dtype=torch.long)
known = torch.full((2, 3), 0.25)
assert ids.dtype == torch.int64
assert known.shape == (2, 3)
assert torch.arange(1, 8, 2).tolist() == [1, 3, 5, 7]
torch.testing.assert_close(torch.linspace(0, 1, steps=5), torch.tensor([0, .25, .5, .75, 1]))
generator = torch.Generator().manual_seed(4)
order = torch.randperm(6, generator=generator)
assert sorted(order.tolist()) == list(range(6))
```

`arange` excludes its stop; floating steps can accumulate rounding error. `linspace` includes both endpoints and requires an explicit number of `steps`. `randperm` returns a random ordering of integer positions, useful for shuffling without replacement.

## Static and standard-normal initialization {#static-normal}

Functions in `nn.init` with a trailing underscore modify their tensor in place. They handle initialization without building an autograd history. Initialize weights before training rather than changing a parameter's storage through `.data`.

```python
weight = torch.empty(3, 4)
nn.init.zeros_(weight)
assert weight.count_nonzero().item() == 0
nn.init.ones_(weight)
assert weight.sum().item() == 12
nn.init.constant_(weight, 0.5)
assert weight.sum().item() == 6
torch.manual_seed(5)
normal = torch.randn(3, 4)
assert normal.shape == (3, 4) and torch.isfinite(normal).all()
```

`randn` samples a standard normal distribution: theoretical mean zero and variance one. Twelve samples need not have a sample mean of exactly zero. Initializing every hidden unit with identical weights can preserve symmetry, preventing the units from learning different features.

## Xavier / Glorot initialization {#xavier}

Xavier balances the input and output fan sizes. For a Linear weight shaped `[out_features, in_features]`, `fan_in` is the input width and `fan_out` the output width. Xavier uniform uses a bound of `gain × sqrt(6 / (fan_in + fan_out))`; Xavier normal uses standard deviation `gain × sqrt(2 / (fan_in + fan_out))`.

```python
weight = torch.empty(6, 4)
gain = nn.init.calculate_gain("tanh")
nn.init.xavier_uniform_(weight, gain=gain)
bound = gain * (6 / (4 + 6)) ** 0.5
assert weight.abs().max() <= bound
nn.init.xavier_normal_(weight, gain=gain)
assert weight.shape == (6, 4) and torch.isfinite(weight).all()
```

Choose the gain for the actual nonlinearity. Initialization is one part of stable optimization, alongside architecture, normalization and learning rate. It does not guarantee successful training.

## Kaiming / He initialization {#kaiming}

Kaiming initialization accounts for rectifying activations such as ReLU. `mode="fan_in"` aims to preserve forward-pass scale; `fan_out` targets backward-pass scale. Both uniform and normal variants are available. The weight's orientation matters if you manually multiply by `weight` rather than the usual `weight.T` convention.

```python
weight = torch.empty(6, 4)
nn.init.kaiming_uniform_(weight, mode="fan_in", nonlinearity="relu")
assert weight.abs().max() <= (6 / 4) ** 0.5
nn.init.kaiming_normal_(weight, mode="fan_out", nonlinearity="relu")
assert torch.isfinite(weight).all()
bias = torch.empty(6)
nn.init.zeros_(bias)
assert bias.sum().item() == 0
```

## Device transfers and NumPy conversion {#devices-numpy}

Move both the model and its inputs to the same device. Tensor `.to(...)` returns the converted tensor; assigning the result is important. A CUDA tensor is still a `torch.Tensor`, not a NumPy array. Use a CPU fallback for portable learning code.

`.cuda()` is a CUDA-specific transfer shortcut and `.cpu()` selects host storage; `.to(...)` also supports explicit device and dtype choices. For modules, `model.to(device)` moves registered parameters and buffers in place and returns the module, while ordinary tensor attributes need separate handling or buffer registration.

```python
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
tensor = torch.tensor([1.0, 2.0], requires_grad=True).to(device)
array = tensor.detach().cpu().numpy()
assert isinstance(array, np.ndarray)
assert array.tolist() == [1.0, 2.0]
assert tensor.device.type == device.type
scalar = torch.tensor([3.5]).item()
assert scalar == 3.5 and isinstance(scalar, float)
assert torch.tensor([[1, 2], [3, 4]]).tolist() == [[1, 2], [3, 4]]
```

`.detach()` disconnects autograd history; `.cpu()` moves values to the host if necessary. NumPy conversion does not itself make arbitrary GPU memory CPU-accessible. On the CPU, compatible tensor/NumPy conversions can share storage: use `.copy()` for an independent NumPy array, or `.clone()` for an independent tensor. `.item()` requires exactly one element, and both `.item()` and `.tolist()` leave differentiable tensor computation.

```python
source = np.array([1.0, 2.0], dtype=np.float32)
shared = torch.from_numpy(source)
shared[0] = 9
assert source[0] == 9
independent = shared.detach().cpu().numpy().copy()
independent[0] = -1
assert shared[0].item() == 9
```

## Practice

Why does `torch.tensor([1, 2], requires_grad=True)` fail, while the floating-point version can track gradients?

??? question "Check your reasoning"
    Integer tensors are discrete values and do not support the usual autograd derivatives. Use floating or complex tensors for differentiable quantities. Keep token IDs and class-index labels as integers; the embedding weights and model parameters are the differentiable values.
