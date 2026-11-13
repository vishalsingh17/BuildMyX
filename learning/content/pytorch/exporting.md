---
title: Save, load and export a model
description: Preserve weights and preprocessing together, compare TorchScript with torch.export and verify ONNX Runtime predictions against PyTorch.
course: PyTorch
lesson: CHAPTER 14 OF 20
---

# Save, load and export a model

## An artifact is more than weights {#state-dictionary}

An inference procedure includes architecture, weights, preprocessing, vocabulary/class order and a version. A state dictionary stores parameters and persistent buffers; instantiate the matching architecture before loading it. Move to the intended device and call `eval()` after loading.

```python
import hashlib
import json
from pathlib import Path
import torch
from torch import nn

torch.manual_seed(45)
model = nn.Sequential(nn.Linear(3, 4), nn.ReLU(), nn.Linear(4, 2)).eval()
example = torch.randn(2, 3)
torch.save(model.state_dict(), "classifier-weights.pt")
metadata = {"schema_version": 1, "model_version": "tiny-classifier-v1",
            "features": 3, "classes": ["negative", "positive"],
            "preprocessing": "float32-three-features-v1"}
Path("metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
restored = nn.Sequential(nn.Linear(3, 4), nn.ReLU(), nn.Linear(4, 2))
restored.load_state_dict(torch.load("classifier-weights.pt", map_location="cpu", weights_only=True))
restored.eval()
torch.testing.assert_close(restored(example), model(example))
digest = hashlib.sha256(Path("classifier-weights.pt").read_bytes()).hexdigest()
assert len(digest) == 64
```

Use a versioned manifest tying these files together, and verify the expected schema/hash before serving. `weights_only=True` limits what the loader accepts; it does not establish the provenance or semantic correctness of an arbitrary artifact. A full training checkpoint also includes optimizer and training state, as shown in [chapter 10](training.md#checkpoint).

## TorchScript is a legacy export path {#torchscript}

The source primer uses TorchScript. `torch.jit.trace` records operations performed by an example input, and `torch.jit.script` attempts to compile supported source control flow. Tracing can miss Python branches that the example did not exercise. TorchScript is deprecated in current PyTorch documentation; understand it for existing systems and consider `torch.export` for a new export workflow.

```python
with torch.no_grad():
    traced = torch.jit.trace(model, example)
traced.save("legacy-classifier.pt")
loaded_trace = torch.jit.load("legacy-classifier.pt", map_location="cpu").eval()
torch.testing.assert_close(loaded_trace(example), model(example))
```

TorchScript historically supported runtimes such as C++/LibTorch. Saving a trace does not guarantee faster inference, remove all runtime dependencies or make unsupported Python behavior portable. Test a representative input matrix, including boundary shapes and relevant control-flow paths.

## Export with explicit shape constraints {#torch-export}

`torch.export` captures a graph with constraints describing the supported inputs. `Dim` can mark a dimension as dynamic within a range. Save/load an ExportedProgram and check its executable module before choosing a downstream runtime or compiler.

```python
batch = torch.export.Dim("batch", min=1, max=8)
exported = torch.export.export(model, (example,), dynamic_shapes=({0: batch},))
torch.export.save(exported, "classifier.pt2")
loaded_export = torch.export.load("classifier.pt2")
with torch.inference_mode():
    torch.testing.assert_close(loaded_export.module()(example), model(example))
    another = torch.zeros(3, 3)
    torch.testing.assert_close(loaded_export.module()(another), model(another))
```

A graph file is an intermediate artifact, not an automatically deployed endpoint. Verify the target runtime supports its operators, precision, dynamic dimensions and device requirements. Distinguish export-time compilation failures from inference-time input validation failures.

## ONNX export and a parity test {#onnx}

ONNX describes a model graph for runtimes such as ONNX Runtime or compatible TensorRT/OpenVINO integrations. Backend support is operator- and version-specific. This CPU example uses ONNX 1.23.2, ONNX Script 0.7.2 and ONNX Runtime 1.32.0, in addition to PyTorch.

```python
import numpy as np
import onnx
import onnxruntime as ort

torch.onnx.export(model, (example,), "classifier.onnx", dynamo=True,
    input_names=["features"], output_names=["logits"],
    dynamic_shapes=({0: batch},))
onnx.checker.check_model(onnx.load("classifier.onnx"))
options = ort.SessionOptions()
options.intra_op_num_threads = 1
options.inter_op_num_threads = 1
session = ort.InferenceSession("classifier.onnx", sess_options=options, providers=["CPUExecutionProvider"])
actual = session.run(["logits"], {"features": example.numpy()})[0]
expected = model(example).detach().numpy()
np.testing.assert_allclose(actual, expected, rtol=1e-4, atol=1e-5)
assert actual.shape == (2, 2)
```

Test the complete preprocessing → exported model → postprocessing path on representative inputs, not only random tensors. A small numerical tolerance can be appropriate across runtimes; decide whether any numerical difference changes class decisions or an important downstream threshold.

## Choose the deployment mode {#deployment-modes}

Batch inference processes queued or scheduled data; an online API responds to individual requests; edge inference runs near a device. Each has different latency, memory, update and availability requirements. Package the chosen model/runtime in a reproducible container or environment, retain the previous validated artifact and use the [serving chapter](serving.md) to define an input/output contract.

## Practice

Why can a successful ONNX file export still fail to establish that the model is ready for a different inference backend?

??? question "Check your reasoning"
    The backend may support different operators, shapes, precisions or device kernels. Load the exported graph in that actual runtime, test representative inputs and compare outputs under documented tolerances. Preserve preprocessing and class/vocabulary versions as part of the test.
