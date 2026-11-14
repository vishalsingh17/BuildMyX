---
title: Optimize inference with evidence
description: Measure latency and throughput, compare batch inference and caching, understand quantization and pruning, and verify output quality after optimization.
course: PyTorch
lesson: CHAPTER 16 OF 20
---

# Optimize inference with evidence

## Measure the workload you intend to serve {#benchmarking}

Define batch size, input shape, precision, device, warm-up policy and latency boundary before comparing implementations. Report a distribution such as median and p95, not only one convenient timing. Throughput is examples per time unit; increasing batch size can improve throughput while making an individual request wait longer.

```python
import time
import statistics
import torch
from torch import nn

torch.manual_seed(50)
model = nn.Sequential(nn.Linear(8, 16), nn.ReLU(), nn.Linear(16, 2)).eval()
inputs = torch.randn(8, 8)
with torch.inference_mode():
    for _ in range(5):
        model(inputs)
    timings = []
    for _ in range(20):
        started = time.perf_counter()
        model(inputs)
        timings.append(time.perf_counter() - started)
assert statistics.median(timings) > 0
```

This is a CPU timing demonstration, not a representative service benchmark. For CUDA, synchronize at appropriate boundaries or use CUDA events; include host-device transfer and queueing when those belong to the request budget. Compilers such as `torch.compile` can add first-use compilation cost; report warm and cold behavior separately and test the actual shape distribution.

## Batch inference and version-aware caching {#batch-cache}

Running a batch can share overhead across examples. Cache only computations whose result is reusable under the full model/preprocessing version. A stale cached prediction after a vocabulary or model change is incorrect even if the input bytes are identical.

```python
from functools import lru_cache

with torch.inference_mode():
    together = model(inputs)
    separately = torch.cat([model(row.unsqueeze(0)) for row in inputs])
torch.testing.assert_close(together, separately, rtol=1e-5, atol=1e-6)

@lru_cache(maxsize=32)
def cached_prediction(model_version, feature_tuple):
    if model_version != "tiny-v1":
        raise ValueError("Unknown model version")
    with torch.inference_mode():
        return tuple(model(torch.tensor([feature_tuple], dtype=torch.float32)).squeeze(0).tolist())

key = tuple([0.0] * 8)
assert cached_prediction("tiny-v1", key) == cached_prediction("tiny-v1", key)
assert cached_prediction.cache_info().hits == 1
```

Caching has memory, invalidation and data-retention costs. Use a bounded policy and a suitable key; do not cache a mutable tensor that another caller can change. Batch schedulers also need a maximum wait and queue size rather than collecting requests indefinitely.

## Quantization changes the numeric representation {#quantization}

Quantization maps values to a smaller integer or low-precision representation with a scale and sometimes a zero point. Dynamic, static/calibrated and quantization-aware training approaches differ in when activation ranges are determined and how training accounts for rounding. A backend needs kernels for the chosen scheme; smaller weights alone do not guarantee faster inference.

This core example illustrates symmetric integer quantization mathematically. It reconstructs floats and is **not** an optimized integer matrix-multiplication implementation.

```python
weight = torch.tensor([-1.0, -0.3, 0.2, 1.0])
scale = weight.abs().max().clamp_min(1e-8) / 127
quantized = torch.round(weight / scale).clamp(-127, 127).to(torch.int8)
reconstructed = quantized.float() * scale
assert quantized.element_size() == 1
assert (weight - reconstructed).abs().max() <= scale / 2 + 1e-6
```

The reference's `torch.quantization.quantize_dynamic` is a legacy eager API. Current PyTorch quantization development has moved toward TorchAO. The optional recipe below needs a TorchAO release compatible with your torch version and target backend; benchmark and test its supported operators before choosing it.

```python title="Optional: TorchAO quantization"
import copy
from torchao.quantization import quantize_, Int8DynamicActivationInt8WeightConfig

quantized_model = copy.deepcopy(model).eval()
quantize_(quantized_model, Int8DynamicActivationInt8WeightConfig())
with torch.inference_mode():
    quantized_output = quantized_model(inputs)
assert quantized_output.shape == (8, 2)
```

The old spelling `torch.quantization.quantize_dynamic(model, {nn.Linear}, dtype=torch.qint8)` remains useful when maintaining a compatible older runtime. Do not assume a LoRA/quantized combination has the same serialization or merging behavior as an ordinary float Linear layer. Measure quality loss, memory and latency on the intended backend and data.

## Pruning does not automatically create a faster dense model {#pruning}

Unstructured pruning masks individual weights; structured pruning removes groups such as channels. A dense tensor containing zeros still occupies its dense shape and may use the same kernel. Real acceleration depends on a sparse representation/kernel or a correctly rebuilt smaller network.

```python
from torch.nn.utils import prune

layer = nn.Linear(4, 3)
prune.l1_unstructured(layer, name="weight", amount=0.5)
assert layer.weight_mask.eq(0).sum().item() == 6
assert "weight_orig" in layer.state_dict()
prune.remove(layer, "weight")
assert "weight_orig" not in layer.state_dict()
assert layer.weight.eq(0).sum().item() == 6
assert layer(torch.zeros(2, 4)).shape == (2, 3)
```

`prune.remove` materializes the masked parameter; it does not remove input/output channels or compress the tensor's shape. For structured channel removal, update dependent layers and biases consistently, then fine-tune and evaluate the changed model.

## Validate after every optimization {#quality}

Compare numerical outputs under a stated tolerance, downstream decisions at important thresholds and task metrics on representative held-out data. Check errors by relevant subgroup and input shape. A smaller artifact with worse latency on your hardware is not a successful speed optimization; a faster model that fails the task may be unusable.

## Practice

Half a dense Linear layer's weights are zero after pruning. Why might its latency and file size barely change?

??? question "Check your reasoning"
    It can still use the same dense tensor shape, storage and matrix-multiplication kernel. Zero values are not automatically sparse execution. A compatible sparse backend or a genuinely smaller reconstructed architecture is needed for the intended resource savings.
