---
title: Datasets, batches and data quality
description: Implement Dataset and DataLoader, split data without leakage, seed loaders and establish preprocessing contracts for vision, text and audio.
course: PyTorch
lesson: CHAPTER 05 OF 20
---

# Datasets, batches and data quality

## Separate a record from a batch {#dataset-loader}

A map-style `Dataset` implements `__len__` and `__getitem__`. It explains how to obtain one example and target. `DataLoader` chooses records, shuffles when requested and collates them into batches. An `IterableDataset` is another abstraction for a stream where indexed access is unsuitable.

```python
import torch
from torch.utils.data import Dataset, DataLoader, TensorDataset, random_split

class Measurements(Dataset):
    def __init__(self):
        self.features = torch.tensor([[0., 1.], [1., 0.], [2., 1.], [1., 2.]])
        self.labels = torch.tensor([0, 0, 1, 1])

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, index):
        return self.features[index], self.labels[index]

dataset = Measurements()
loader = DataLoader(dataset, batch_size=3, shuffle=False, num_workers=0)
batches = list(loader)
assert batches[0][0].shape == (3, 2)
assert batches[1][0].shape == (1, 2)
assert len(dataset) == 4
```

The final batch can be smaller. Weight a mean loss by the actual batch size when accumulating an epoch metric. `drop_last=True` intentionally discards a short final batch; it should not silently discard validation examples. `TensorDataset` is convenient when tensors are already prepared.

## Split before fitting preprocessing {#splits}

Keep training, validation and test examples separate. Fit vocabularies, scalers and imputation rules on the training split, then apply the frozen rules elsewhere. A validation split selects models and hyperparameters; the final test split estimates the selected procedure's performance.

```python
all_data = TensorDataset(torch.arange(20).float().unsqueeze(1), torch.arange(20) % 2)
train, validation, test = random_split(all_data, [12, 4, 4], generator=torch.Generator().manual_seed(8))
assert set(train.indices).isdisjoint(validation.indices)
assert set(train.indices).isdisjoint(test.indices)
assert set(validation.indices).isdisjoint(test.indices)
assert len(train) + len(validation) + len(test) == 20
```

Random splits are inappropriate when the same user, patient, document or near-duplicate image can appear in several partitions. Split by entity for grouped data, or chronologically for a forecasting task. Check leakage with stable IDs, content hashes and domain knowledge, not only row positions. Small imbalanced datasets can need a stratified split to retain class representation.

## Make batching reproducible {#workers}

Use a DataLoader generator for repeatable shuffling. Worker processes can improve throughput, but introduce startup, memory and platform considerations. Start with `num_workers=0` while debugging; then measure whether more workers help. `pin_memory=True` and non-blocking transfers can help some CUDA pipelines, not every CPU workload.

```python
def shuffled_labels(seed):
    loader = DataLoader(dataset, batch_size=2, shuffle=True, num_workers=0,
                        generator=torch.Generator().manual_seed(seed))
    return torch.cat([labels for _, labels in loader])

assert shuffled_labels(9).equal(shuffled_labels(9))
```

When workers call NumPy or Python's random module, seed those libraries inside a top-level `worker_init_fn` using `torch.initial_seed()`. A top-level function and an `if __name__ == "__main__"` entry point are especially useful with process spawning. Avoid assuming notebook lambdas can be serialized to every worker runtime.

## Match preprocessing to the modality {#modalities}

| Modality | Useful abstractions | Typical sequence |
| --- | --- | --- |
| Images | `torchvision.transforms`, preferably its current v2 interfaces | Decode/clean → resize/crop → float tensor → training augmentation where appropriate → normalize |
| Text | Tokenizer, vocabulary, embedding, `collate_fn` | Split raw examples → tokenize → map IDs → dynamically pad → mask |
| Audio | `torchaudio.transforms` and a decoder | Decode → resample → crop/pad → features → normalize → batch |
| Shared | `Dataset`, `DataLoader`, split metadata | Validate targets, shapes, missing values, provenance and class counts |

There is no universal transform order. A PIL transform requires a PIL-compatible input; a tensor transform requires a tensor. Normalize only after converting values to the scale expected by the normalization parameters. Text synonym replacement, random word dropout and noise injection can change labels or semantics; apply only a justified training augmentation before token IDs are frozen.

TorchText's development stopped with 0.18. The reference's `torchtext.transforms` recipes are useful historical abstractions, but installing that old binary package into a current torch environment can fail. The text chapter implements the vocabulary/padding contract directly and discusses maintained tokenizer alternatives.

## Check data quality explicitly {#quality}

Check sample/label alignment, allowed label IDs, finite numeric values, class counts, shapes and split separation. Inspect representative images, decoded audio or text after preprocessing. A balanced loader cannot repair incorrect labels, and resampling changes the training distribution rather than the evaluation population.

```python
features, labels = dataset.features, dataset.labels
if not torch.isfinite(features).all():
    raise ValueError("Non-finite features")
if labels.dtype != torch.long or labels.min() < 0 or labels.max() >= 2:
    raise ValueError("Invalid class-index labels")
counts = torch.bincount(labels, minlength=2)
assert counts.tolist() == [2, 2]
mean = features.mean(dim=0, keepdim=True)
std = features.std(dim=0, keepdim=True).clamp_min(1e-6)
normalized = (features - mean) / std
assert normalized.shape == features.shape
```

For a real split, calculate `mean` and `std` using training records only and serialize them with the model. ImageNet statistics belong to a matching pretrained-model contract, not every new image dataset. Deterministic evaluation transforms measure a fixed procedure; intentional test-time augmentation needs a separately documented aggregation protocol.

## Practice

Why can fitting a vocabulary on all text before splitting inflate evaluation performance, even without using test labels?

??? question "Check your reasoning"
    Test inputs influenced the representation. The procedure now knows vocabulary information unavailable when training a model for truly unseen data. Split first, learn the vocabulary from training only and use an explicit unknown-token policy for validation and test inputs.
