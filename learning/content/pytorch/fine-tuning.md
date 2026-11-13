---
title: Fine-tuning and low-rank adaptation
description: Choose what to freeze, construct a small LoRA update, verify trainable parameters and compare adapter tuning with full fine-tuning.
course: PyTorch
lesson: CHAPTER 11 OF 20
---

# Fine-tuning and low-rank adaptation

## Transfer a representation deliberately {#transfer}

Fine-tuning starts from previously learned parameters. A frozen feature extractor trains only a new head; partial fine-tuning unfreezes selected layers; full fine-tuning updates the entire base model. Keep the pretrained model's input normalization, tokenizer and architecture contract unless your experiment deliberately changes them.

Frozen parameters and evaluation mode are different decisions. A frozen backbone with BatchNorm can still update running statistics in training mode. Decide whether that state should adapt, and apply the intended mode when the training loop calls `train()`.

```python
import torch
from torch import nn

torch.manual_seed(24)
backbone = nn.Sequential(nn.Linear(4, 8), nn.ReLU())
backbone.requires_grad_(False)
head = nn.Linear(8, 2)
model = nn.Sequential(backbone, head)
optimizer = torch.optim.AdamW([p for p in model.parameters() if p.requires_grad], lr=0.01)
assert sum(p.numel() for p in backbone.parameters() if p.requires_grad) == 0
assert sum(p.numel() for p in head.parameters() if p.requires_grad) == 18
```

The small backbone here is randomly initialized to demonstrate freezing mechanics. It is not a pretrained model and cannot establish a transfer-learning benefit. A real comparison needs an actual pretrained artifact and a suitable evaluation split.

## LoRA adds a low-rank update {#lora}

For a frozen Linear weight `W` with shape `[out, in]`, learn `ΔW = (alpha / rank) × B @ A`, where `A` is `[rank, in]` and `B` is `[out, rank]`. The adapter has `rank × (in + out)` weight parameters rather than `in × out`. A useful implementation initializes one factor to zero so its initial output equals the base model's output.

```python
class LoRALinear(nn.Module):
    def __init__(self, base, rank=2, alpha=2.0):
        super().__init__()
        if rank <= 0:
            raise ValueError("LoRA rank must be positive")
        self.base = base
        self.base.requires_grad_(False)
        self.a = nn.Parameter(torch.empty(rank, base.in_features))
        self.b = nn.Parameter(torch.zeros(base.out_features, rank))
        nn.init.kaiming_uniform_(self.a, a=5 ** 0.5)
        self.scale = alpha / rank

    def forward(self, x):
        return self.base(x) + ((x @ self.a.T) @ self.b.T) * self.scale

base = nn.Linear(6, 4)
adapter = LoRALinear(base, rank=2, alpha=4.0)
inputs = torch.randn(3, 6)
torch.testing.assert_close(adapter(inputs), base(inputs))
assert sum(p.numel() for p in adapter.parameters() if p.requires_grad) == 20
assert not adapter.base.weight.requires_grad
```

Rank, scaling and which layers receive adapters are hyperparameters. LoRA can reduce trainable parameters and optimizer-state memory; it does not eliminate the base model's inference memory or guarantee better accuracy than full fine-tuning.

## Verify what actually changes {#adapter-training}

Build the optimizer from trainable parameters and verify the frozen base stays unchanged. A zero-initialized factor can give the other factor a zero gradient on the first step; that is expected for this factorization, not necessarily a broken graph.

```python
before = {name: value.detach().clone() for name, value in adapter.base.state_dict().items()}
optimizer = torch.optim.AdamW([p for p in adapter.parameters() if p.requires_grad], lr=0.03)
target = torch.zeros(3, 4)
for _ in range(8):
    optimizer.zero_grad(set_to_none=True)
    loss = nn.MSELoss()(adapter(inputs), target)
    loss.backward()
    optimizer.step()
for name, value in adapter.base.state_dict().items():
    torch.testing.assert_close(value, before[name])
assert adapter.b.detach().abs().sum() > 0
```

## Save, merge and compare adapters {#merging}

An adapter-only artifact needs the exact base model identity and its configuration. To merge this simple Linear adapter for inference, copy the base weights and add `B @ A × scale`. More complex libraries may handle dropout, quantization and target-module names differently; use their supported merge path and test parity.

```python
merged = nn.Linear(6, 4)
with torch.no_grad():
    merged.weight.copy_(adapter.base.weight + adapter.b @ adapter.a * adapter.scale)
    merged.bias.copy_(adapter.base.bias)
torch.testing.assert_close(merged(inputs), adapter(inputs), rtol=1e-5, atol=1e-6)
torch.save({"a": adapter.a.detach(), "b": adapter.b.detach(),
            "scale": adapter.scale, "base_id": "teaching-linear-v1"}, "adapter.pt")
```

Compare frozen-head, adapter and full tuning on the same validation examples and report parameter count, runtime, memory and quality. Choose an approach that fits the data and compute budget; a parameter-saving mechanism is not an evaluation result.

## Practice

Why is saving only `A` and `B` insufficient to reproduce a LoRA model's predictions?

??? question "Check your reasoning"
    The adapter modifies a specific base model using a specific scaling and target-layer configuration. Preserve the base artifact/revision, architecture, rank, alpha, preprocessing and adapter weights together as an identifiable inference procedure.
