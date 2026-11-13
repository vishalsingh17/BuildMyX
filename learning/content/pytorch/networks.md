---
title: CNNs, LSTMs and a masked token loss
description: Define image, sentence and token classifiers, track tensor shapes through embeddings and recurrent layers, and compute a padding-aware custom loss.
course: PyTorch
lesson: CHAPTER 09 OF 20
---

# CNNs, LSTMs and a masked token loss

## Define an image classifier {#cnn}

A convolution shares a small kernel across an image. Its output channels are learned feature maps. Pooling reduces spatial detail; a final Linear layer maps features to class logits. Adaptive pooling makes the feature width independent of the exact input resolution within the model's supported domain.

```python
import torch
from torch import nn
from torch.nn import functional as F
from torch.nn.utils.rnn import pack_padded_sequence

class ImageClassifier(nn.Module):
    def __init__(self, classes=3):
        super().__init__()
        self.features = nn.Sequential(nn.Conv2d(3, 8, kernel_size=3, padding=1),
            nn.ReLU(), nn.AdaptiveAvgPool2d(1))
        self.classifier = nn.Linear(8, classes)

    def forward(self, images):
        return self.classifier(self.features(images).flatten(start_dim=1))

image_model = ImageClassifier()
assert image_model(torch.zeros(2, 3, 16, 16)).shape == (2, 3)
assert image_model(torch.zeros(1, 3, 8, 8)).shape == (1, 3)
```

For CIFAR-10, set `classes=10` and use its RGB preprocessing contract. This tiny architecture demonstrates the interface; its structure is not a promise of benchmark accuracy. A deeper architecture or pretrained backbone still needs the same input, output and loss contracts.

## A recurrent sentence classifier {#lstm-classifier}

An embedding maps token IDs `[B, L]` to vectors `[B, L, E]`. An LSTM produces hidden states over time. With right-padded variable-length sentences, use packed sequences or another justified masking strategy; blindly taking the last padded timestep does not mean taking the last real token.

```python
class SentenceClassifier(nn.Module):
    def __init__(self, vocabulary_size, embedding_dim=4, hidden_dim=6, classes=2):
        super().__init__()
        self.embedding = nn.Embedding(vocabulary_size, embedding_dim, padding_idx=0)
        self.lstm = nn.LSTM(embedding_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, classes)

    def forward(self, tokens, lengths):
        embedded = self.embedding(tokens)
        packed = pack_padded_sequence(embedded, lengths.cpu(), batch_first=True, enforce_sorted=False)
        _, (hidden, _) = self.lstm(packed)
        return self.fc(hidden[-1])

sentence_model = SentenceClassifier(vocabulary_size=10)
tokens = torch.tensor([[2, 3, 4], [5, 6, 0]])
lengths = torch.tensor([3, 2])
assert sentence_model(tokens, lengths).shape == (2, 2)
```

`batch_first=True` changes input/output sequence layout, not the hidden state's layer/direction layout. A bidirectional LSTM needs a deliberate combination of both directions. The model above uses one direction and one recurrent layer to keep that contract clear.

## Predict a tag at every token {#token-tagger}

For token classification, keep the sequence axis. The output is `[batch, length, classes]`, rather than one logit vector for the whole sentence. `nn.Linear` supports leading dimensions and transforms the **last feature dimension**; it does not require every input to be flattened into a two-dimensional tensor.

```python
class TokenTagger(nn.Module):
    def __init__(self, vocabulary_size, classes):
        super().__init__()
        self.embedding = nn.Embedding(vocabulary_size, 4, padding_idx=0)
        self.lstm = nn.LSTM(4, 6, batch_first=True)
        self.fc = nn.Linear(6, classes)

    def forward(self, tokens):
        states, _ = self.lstm(self.embedding(tokens))
        return self.fc(states)

tagger = TokenTagger(10, 3)
tag_logits = tagger(tokens)
assert tag_logits.shape == (2, 3, 3)
```

This unidirectional toy tagger's real-token outputs do not depend on trailing padding. With bidirectional layers, pack sequences so the backward direction does not incorporate artificial trailing steps. The mask used for the loss is still necessary even when the recurrent computation handles lengths correctly.

## Write a custom padding-aware loss {#masked-loss}

Targets use `-100` at padded positions. Flatten logits and labels for a token-level calculation, remove ignored positions and average over **supervised tokens**, not padded batch area. Reject a batch containing no supervised targets instead of dividing by zero or accepting a NaN loss.

```python
def masked_token_loss(logits, targets):
    classes = logits.shape[-1]
    flat_targets = targets.reshape(-1)
    valid = flat_targets.ne(-100)
    if not valid.any():
        raise ValueError("A token batch needs at least one supervised target")
    flat_logits = logits.reshape(-1, classes)[valid]
    selected_targets = flat_targets[valid]
    log_probabilities = F.log_softmax(flat_logits, dim=-1)
    chosen = log_probabilities.gather(1, selected_targets.unsqueeze(1)).squeeze(1)
    return -chosen.mean()

targets = torch.tensor([[1, 0, 2], [1, 0, -100]])
custom = masked_token_loss(tag_logits, targets)
built_in = F.cross_entropy(tag_logits.reshape(-1, 3), targets.reshape(-1), ignore_index=-100)
torch.testing.assert_close(custom, built_in)
custom.backward()
assert tagger.fc.weight.grad is not None
```

The built-in `ignore_index` already handles ordinary padding exclusion; a custom function is valuable here to show the calculation and add the empty-target check. Older references use `-1`, `.data[0]` and separate `Variable` wrappers. A negative sentinel is configurable, but indexing with it before filtering can select the last class accidentally. Use a deliberate mask and current tensor APIs.

## Inspect predictions and debug dimensions {#debugging}

Use `argmax(dim=-1)` to turn logits into the class decision for this rule. Compare only genuine tokens. For BIO tagging, entity/span-level precision and recall answer a different question from per-token accuracy; a model can obtain high token accuracy by predicting `O` frequently.

```python
with torch.inference_mode():
    predictions = tagger(tokens).argmax(dim=-1)
valid = targets.ne(-100)
token_accuracy = predictions[valid].eq(targets[valid]).float().mean().item()
assert 0 <= token_accuracy <= 1
try:
    masked_token_loss(torch.zeros(1, 2, 3), torch.full((1, 2), -100))
except ValueError:
    pass
else:
    raise AssertionError("All-padding targets must be rejected")
```

Print or assert shapes at the embedding, recurrent output and classifier boundaries. `breakpoint()` can inspect intermediate values while debugging locally. A shape annotation is most useful when its axis meanings accompany its numeric dimensions.

## Practice

Why does dividing token loss by `batch_size × maximum_length` change its scale when sentence lengths differ?

??? question "Check your reasoning"
    Padding increases that denominator without adding supervised observations. Average over the valid target positions instead. Otherwise the loss magnitude depends on how much padding the batch contains, even for the same collection of genuine tokens.
