---
title: Prepare and inspect vision data
description: Decode image data, distinguish tensor conversion from normalization, apply train-only augmentation and adapt the workflow to CIFAR-10.
course: PyTorch
lesson: CHAPTER 06 OF 20
---

# Prepare and inspect vision data

## Decode and establish an image contract {#loading}

Conventional PyTorch image models expect `[batch, channels, height, width]`. A decoded image may instead be an HWC array of byte values. Confirm channel order, color space, orientation, resolution and target labels before training. RGB, grayscale and images with an alpha channel are different inputs.

The offline fixture below creates an RGB image locally. Real pipelines also need policies for corrupt files, duplicate images, inconsistent labels and unexpected color modes. Keep a rejected-record count rather than silently dropping failures from only one split.

```python
import torch
import numpy as np
from PIL import Image
from torchvision.transforms import v2

pixels = np.zeros((12, 16, 3), dtype=np.uint8)
pixels[:, :8, 0] = 255
image = Image.fromarray(pixels)
assert image.mode == "RGB"
assert image.size == (16, 12)  # PIL uses width, height.
```

## Convert and normalize in the right order {#normalization}

`v2.ToImage` converts to an image tensor without scaling its values. `v2.ToDtype(torch.float32, scale=True)` converts byte data to floating values on the appropriate scale. Then `Normalize` applies `(value - mean) / std` per channel. These are distinct operations; normalizing byte values with means intended for `[0, 1]` is incorrect.

```python
mean = [0.5, 0.5, 0.5]
std = [0.5, 0.5, 0.5]
evaluation_transform = v2.Compose([
    v2.ToImage(),
    v2.Resize((8, 8), antialias=True),
    v2.ToDtype(torch.float32, scale=True),
    v2.Normalize(mean=mean, std=std),
])
converted = evaluation_transform(image)
assert converted.shape == (3, 8, 8)
assert converted.dtype == torch.float32
assert converted.min() >= -1 and converted.max() <= 1
```

The older `torchvision.transforms.ToTensor()` combines conversion and scaling for common PIL/uint8 inputs. It is still useful to recognize, but do not assume it rescales every arbitrary float array. Use normalization statistics estimated from training data, or the exact transforms documented with a pretrained weight set. ImageNet statistics are common because many pretrained models were trained with them; they are not universal defaults.

## Separate training augmentation from evaluation {#augmentation}

Training augmentation changes examples to encode justified invariances. A horizontal flip can be appropriate for some object classes and wrong for text or directional signs. Use deterministic validation/test preprocessing when comparing ordinary evaluation results. If using test-time augmentation, document its additional computation and aggregation separately.

```python
training_transform = v2.Compose([
    v2.ToImage(),
    v2.RandomCrop((8, 8)),
    v2.RandomHorizontalFlip(p=0.5),
    v2.ToDtype(torch.float32, scale=True),
    v2.Normalize(mean=mean, std=std),
])
torch.manual_seed(12)
augmented = training_transform(image)
assert augmented.shape == (3, 8, 8)
assert torch.isfinite(augmented).all()
assert evaluation_transform(image).equal(evaluation_transform(image))
```

Resize, crop, rotation, color jitter, blur, affine transforms and contrast changes each express a different assumption about label preservation. Pillow/OpenCV can support custom decoding; Albumentations and custom tensor transforms provide other augmentation options. Check boxes, masks and labels are transformed together for detection or segmentation tasks.

## Inspect a preprocessed batch {#visualization}

Undo normalization for display, clamp only the display copy and move channels to the end for matplotlib. A model input with negative normalized values is valid; showing it as if it were already an RGB image can be misleading.

```python
import matplotlib.pyplot as plt
from torchvision.utils import make_grid

batch = torch.stack([converted, augmented])
display = batch * torch.tensor(std).view(1, 3, 1, 1) + torch.tensor(mean).view(1, 3, 1, 1)
grid = make_grid(display.clamp(0, 1), nrow=2)
fig, ax = plt.subplots(figsize=(5, 2))
ax.imshow(grid.permute(1, 2, 0).numpy())
ax.set_title("Original preprocessing and one training crop")
ax.axis("off")
fig.savefig("image-preprocessing.png", dpi=120, bbox_inches="tight")
plt.close(fig)
assert batch.shape == (2, 3, 8, 8)
```

Look at class labels with the images. A perfectly shaped tensor with a shifted label list is still a broken dataset.

## Use the same contract with CIFAR-10 {#cifar10}

CIFAR-10 has 32×32 RGB images and ten classes. The following optional adapter downloads the benchmark when run locally. Split the training partition into training and validation indices; apply different transforms using two dataset instances so validation does not inherit random training augmentation. Keep the official test partition for final evaluation.

```python title="Optional: download CIFAR-10"
from torchvision.datasets import CIFAR10
from torch.utils.data import DataLoader, Subset

train_transform = v2.Compose([v2.ToImage(), v2.RandomCrop(32, padding=4),
    v2.RandomHorizontalFlip(), v2.ToDtype(torch.float32, scale=True),
    v2.Normalize([0.5] * 3, [0.5] * 3)])
test_transform = v2.Compose([v2.ToImage(), v2.ToDtype(torch.float32, scale=True),
    v2.Normalize([0.5] * 3, [0.5] * 3)])
train_source = CIFAR10("data", train=True, download=True, transform=train_transform)
validation_source = CIFAR10("data", train=True, download=False, transform=test_transform)
indices = torch.randperm(len(train_source), generator=torch.Generator().manual_seed(12))
training = Subset(train_source, indices[:45000].tolist())
validation = Subset(validation_source, indices[45000:].tolist())
training_loader = DataLoader(training, batch_size=64, shuffle=True, num_workers=0)
validation_loader = DataLoader(validation, batch_size=64, shuffle=False, num_workers=0)
test_data = CIFAR10("data", train=False, download=True, transform=test_transform)
assert len(test_data) == 10000
```

The normalization above is an explicit teaching choice, not the measured CIFAR-10 statistics. For a pretrained model, use its weight-specific preprocessing. The [complete vision project](vision-project.md) runs the same stages on a tiny synthetic fixture without downloading the benchmark or claiming CIFAR-10 accuracy.

## Practice

Why is it wrong to inspect a normalized `[3, H, W]` tensor with `imshow(tensor.numpy())`?

??? question "Check your reasoning"
    The axes are CHW rather than the HWC layout expected for an RGB image, and normalized values are not necessarily display values between zero and one. Undo the normalization on a display copy and permute the channel axis before plotting.
