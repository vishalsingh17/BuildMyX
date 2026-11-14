---
title: Reshape, move axes and broadcast
description: Use view, reshape, transpose, permute and movedim correctly, then concatenate, squeeze and reduce tensors while preserving broadcasting semantics.
course: PyTorch
lesson: CHAPTER 03 OF 20
---

# Reshape, move axes and broadcast

## A view changes interpretation of storage {#views}

`view` changes shape without copying values, when the requested shape is compatible with the tensor's sizes and strides. One `-1` dimension can be inferred from the element count. A compatible view shares storage, so writing through it affects the original tensor.

```python
import torch

base = torch.arange(12)
matrix = base.view(3, 4)
assert matrix.shape == (3, 4)
assert matrix.view(-1).shape == (12,)
matrix[0, 0] = 99
assert base[0].item() == 99
assert matrix.untyped_storage().data_ptr() == base.untyped_storage().data_ptr()
```

Contiguity is a useful sufficient condition for many reshape views, but not a universal requirement for every `view`: some non-contiguous tensors still have compatible strides. A transpose often makes a flattening `view` invalid. `reshape` returns a view when possible and a copy otherwise; do not make correctness depend on which one it chose.

```python
x = torch.arange(12).reshape(3, 4)
transposed = x.transpose(0, 1)
assert not transposed.is_contiguous()
try:
    transposed.view(12)
except RuntimeError:
    pass
else:
    raise AssertionError("This transposed layout cannot flatten as a view")
flat = transposed.reshape(12)
assert flat.tolist() == [0, 4, 8, 1, 5, 9, 2, 6, 10, 3, 7, 11]
assert transposed.contiguous().view(12).equal(flat)
```

Use `clone()` when an independent copy is your requirement. `contiguous()` returns the tensor itself if it is already contiguous; it is not an unconditional copy operation.

## Transpose, swapaxes, permute and movedim {#axis-order}

`transpose(dim0, dim1)` swaps two axes. `swapaxes` and `swapdims` are aliases for this operation. `permute` specifies the entire axis order. `movedim` moves one or more axes while preserving the relative order of the others; `moveaxis` is an alias. Negative dimension numbers count from the end.

```python
image_batch = torch.arange(2 * 4 * 5 * 3).reshape(2, 4, 5, 3)
nchw = image_batch.permute(0, 3, 1, 2)
assert nchw.shape == (2, 3, 4, 5)
assert nchw[1, 2, 3, 4] == image_batch[1, 3, 4, 2]
assert image_batch.movedim(-1, 1).equal(nchw)
assert image_batch.moveaxis(-1, 1).equal(nchw)
assert nchw.transpose(2, 3).shape == (2, 3, 5, 4)
assert nchw.swapaxes(2, 3).equal(nchw.swapdims(2, 3))
assert not image_batch.reshape(2, 3, 4, 5).equal(nchw)
```

For strided tensors these operations generally create views, not physical rearrangements. NCHW describes the axis convention; a channels-last memory format is a separate storage choice. Benchmark an actual model and backend instead of assuming one universal performance ordering.

## Concatenate existing axes or create a new axis {#concatenate}

`torch.cat` joins along an existing dimension. Other dimensions must agree. `torch.concatenate` and `torch.concat` are aliases. `torch.stack` creates a new dimension and requires equal input shapes.

```python
a, b = torch.ones(2, 3), torch.zeros(1, 3)
joined = torch.cat([a, b], dim=0)
assert joined.shape == (3, 3)
assert torch.concatenate([a, b], dim=0).equal(joined)
assert torch.concat([a, b], dim=0).equal(joined)
stacked = torch.stack([a, a], dim=0)
assert stacked.shape == (2, 2, 3)
```

## Squeeze and unsqueeze deliberately {#squeeze}

`unsqueeze(dim)` inserts a length-one axis. `squeeze(dim)` removes that axis only when its length is one. An unconstrained `squeeze()` removes **all** singleton axes, which can accidentally remove a batch dimension when the last batch has one example.

```python
scores = torch.tensor([[0.2], [0.8]])
assert scores.squeeze(-1).shape == (2,)
assert scores.squeeze(-1).unsqueeze(-1).equal(scores)
one_example = torch.zeros(1, 1)
assert one_example.squeeze().shape == ()
assert one_example.squeeze(-1).shape == (1,)
```

## Where selects by a broadcastable condition {#where}

`torch.where(condition, a, b)` picks elementwise from two alternatives. The condition and operands must be broadcastable; it does not mean Python executes only the chosen expression. A dangerous division can still be computed before the selection. With only a condition, `where` returns index tensors identifying true positions.

```python
values = torch.tensor([-2.0, 0.0, 3.0])
positive = torch.where(values > 0, values, torch.zeros_like(values))
assert positive.tolist() == [0, 0, 3]
assert torch.where(values > 0)[0].tolist() == [2]
safe_denominator = torch.where(values == 0, torch.ones_like(values), values)
inverse = torch.where(values == 0, torch.zeros_like(values), 1 / safe_denominator)
assert torch.isfinite(inverse).all()
```

## Keep reduced dimensions for broadcasting {#keepdim}

A reduction normally removes its reduced axis. `keepdim=True` retains it with length one. Broadcasting aligns trailing dimensions, so preserving an axis often makes a later subtraction or division both possible and semantically correct.

```python
batch = torch.tensor([[1.0, 3.0, 5.0], [2.0, 4.0, 6.0]])
assert batch.sum(dim=1).shape == (2,)
assert batch.sum(dim=1, keepdim=True).shape == (2, 1)
centered = batch - batch.mean(dim=1, keepdim=True)
torch.testing.assert_close(centered.mean(dim=1), torch.zeros(2))
maxima, positions = batch.max(dim=1, keepdim=True)
assert maxima.shape == positions.shape == (2, 1)
assert positions.tolist() == [[2], [2]]
assert batch.sum(dim=1).unsqueeze(1).equal(batch.sum(dim=1, keepdim=True))
```

`max(dim=...)` returns both values and indices; `amax` returns only values. A dimension can coincidentally have the same width as the batch, allowing a wrong broadcast to run without an error. Label axes in your reasoning and test with unequal dimension sizes.

## Practice

You average each row of a `[5, 7]` tensor. What shape should its row means have when you subtract them from the original?

??? question "Check your reasoning"
    `[5, 1]`: use `mean(dim=1, keepdim=True)` or add the axis with `unsqueeze(1)`. A `[5]` vector aligns with the trailing width of 7 and cannot express one offset per row.
