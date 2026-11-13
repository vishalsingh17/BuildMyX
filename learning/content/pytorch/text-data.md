---
title: Load text, build a vocabulary and pad batches
description: Prepare sentiment and token-tagging inputs, build a training-only vocabulary, handle unknown words and align padded targets with masks.
course: PyTorch
lesson: CHAPTER 07 OF 20
---

# Load text, build a vocabulary and pad batches

## Preserve the dataset's unit and split {#loading-text}

A sentence classifier has one label per sentence. Named-entity recognition has one tag per token, often using a BIO scheme such as `B-PER` for a person entity's beginning, `I-PER` for its continuation and `O` for outside. Keep sentence and tag lengths equal before batching.

The reference describes `sentences.txt`, `labels.txt`, `words.txt` and `tags.txt`, plus a Kaggle entity corpus. An original, minimal local fixture makes the same file contract explicit. For the external corpus, use its `ner_dataset.csv` schema rather than assuming the differently structured `ner.csv` works with the same parser. Inspect encoding and column names in current Python; switching an entire project to Python 2.7 is not a suitable modern encoding fix.

```python
from pathlib import Path
import json
import torch
from torch import nn
from torch.nn.utils.rnn import pad_sequence

folder = Path("ner/train")
folder.mkdir(parents=True, exist_ok=True)
(folder / "sentences.txt").write_text("Mira visits Pune\nRavi walks\n", encoding="utf-8")
(folder / "labels.txt").write_text("B-PER O B-LOC\nB-PER O\n", encoding="utf-8")
sentences = [line.split() for line in (folder / "sentences.txt").read_text(encoding="utf-8").splitlines()]
tags = [line.split() for line in (folder / "labels.txt").read_text(encoding="utf-8").splitlines()]
if len(sentences) != len(tags) or any(len(s) != len(t) for s, t in zip(sentences, tags)):
    raise ValueError("Token/tag alignment failed")
assert [len(s) for s in sentences] == [3, 2]
```

Keep `train/`, `validation/` (or `dev/`) and `test/` records distinct. A dataset-building script should save split membership and schema alongside the files, not merely randomize them on every training run.

## Tokenization and a training-only vocabulary {#vocabulary}

Whitespace tokenization is transparent for a toy corpus, but punctuation, languages without word boundaries and word morphology need more care. Subword tokenizers such as BPE or WordPiece reduce unknown-word frequency. SentencePiece can learn subword units from raw text; Hugging Face `AutoTokenizer` selects the tokenizer associated with a particular model. Preserve its vocabulary, normalization, special tokens and revision with the model.

```python
PAD, UNK = 0, 1
vocab = {"<pad>": PAD, "<unk>": UNK}
for token in sorted({token for sentence in sentences for token in sentence}):
    vocab[token] = len(vocab)
tag_map = {"O": 0, "B-PER": 1, "B-LOC": 2}
encoded = [torch.tensor([vocab.get(token, UNK) for token in sentence], dtype=torch.long) for sentence in sentences]
encoded_tags = [torch.tensor([tag_map[tag] for tag in sequence], dtype=torch.long) for sequence in tags]
assert vocab.get("unseen", UNK) == UNK
Path("words.txt").write_text("\n".join(vocab) + "\n", encoding="utf-8")
Path("tags.txt").write_text("\n".join(tag_map) + "\n", encoding="utf-8")
Path("vocab.json").write_text(json.dumps(vocab, ensure_ascii=False), encoding="utf-8")
```

An unknown **input word** can map to `<unk>`; an unknown **target class** is usually a schema error, not another input token. Never rebuild vocabulary IDs independently at inference. TorchText examples using `VocabTransform`, `Truncate`, `PadTransform` and `.set_default_index(unk_id)` express similar steps. TorchText 0.18 is its last stable release; this course uses explicit mappings instead of depending on that discontinued binary integration.

## Prepare a dynamically padded batch {#batching}

Pad only to the longest sequence in a batch rather than the longest sequence in the entire corpus. Token padding uses `PAD`; tag padding uses a separate sentinel such as `-100`, outside the valid class-ID range. A Boolean mask identifies genuine tokens; lengths are useful for recurrent models.

```python
def collate_tagged(batch):
    tokens, labels = zip(*batch)
    lengths = torch.tensor([len(x) for x in tokens], dtype=torch.long)
    if lengths.min() <= 0:
        raise ValueError("Empty sentences need a defined policy")
    token_batch = pad_sequence(tokens, batch_first=True, padding_value=PAD)
    label_batch = pad_sequence(labels, batch_first=True, padding_value=-100)
    mask = token_batch.ne(PAD)
    return token_batch, label_batch, lengths, mask

token_batch, label_batch, lengths, mask = collate_tagged(list(zip(encoded, encoded_tags)))
assert token_batch.shape == label_batch.shape == (2, 3)
assert lengths.tolist() == [3, 2]
assert label_batch[1, 2].item() == -100
assert mask.sum().item() == 5
```

Use this function as a DataLoader's `collate_fn`. Inputs must be integer tensors for embedding lookup. Replacing old `Variable(LongTensor(...))` code with `torch.tensor(..., dtype=torch.long)` is sufficient; current tensors already support autograd.

## Embedding lookup and masks {#embedding-masking}

`nn.Embedding` maps an integer ID to a learned feature vector. `padding_idx=PAD` prevents the padding row from receiving the ordinary embedding gradient. It does not make every later layer ignore padded positions. A recurrent model may need packed sequences; attention needs an appropriate key-padding mask; a token loss needs an ignored target sentinel.

```python
embedding = nn.Embedding(len(vocab), 4, padding_idx=PAD)
vectors = embedding(token_batch)
assert vectors.shape == (2, 3, 4)
assert vectors[1, 2].eq(0).all()
pooled = (vectors * mask.unsqueeze(-1)).sum(dim=1) / lengths.unsqueeze(1)
assert pooled.shape == (2, 4)
```

Truncation also needs a documented policy: maximum length, which end is retained and whether the label remains meaningful after content is removed. An IMDb review's sentiment may be expressed at the end rather than the first few tokens. For multilingual text, use a tokenizer and corpus suited to the languages rather than assuming whitespace or English casing rules are universal.

## Practice

Does setting `padding_idx=0` on an embedding remove the need to mask padded targets from a token-tagging loss?

??? question "Check your reasoning"
    No. The embedding's padding row and the target-loss mask are separate contracts. Later layers can still produce logits at padded positions. Mark their target IDs with the loss's configured `ignore_index`, and validate that each batch has at least one supervised token.
