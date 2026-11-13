---
title: A complete sentiment workflow
description: Build a vocabulary and LSTM classifier, preserve preprocessing with its weights, evaluate held-out phrases and test a local text API; adapt the workflow to IMDb.
course: PyTorch
lesson: CHAPTER 19 OF 20
---

# A complete sentiment workflow

## Keep text and its representation together {#structure}

This offline project uses six original phrases to demonstrate a sentence-classification workflow. It is not a realistic sentiment benchmark. The source's IMDb pipeline uses the same stages at a larger scale: prepare splits, build a training-only representation, train, evaluate, preserve artifacts and serve the same tokenizer/model pair.

Create the labelled files, or extract the [source bundle](assets/pytorch-projects.zip). Run `python -m text_project.train` from its parent directory to create `text-artifact/`. The examples retain the vocabulary, maximum token length, architecture and class order with the weights.

```python
# file: text_project/__init__.py
"""Original BuildMyX synthetic text teaching project."""
```

## Prepare local text and labels {#data}

Whitespace tokenization and case folding make the toy contract easy to inspect. A different language, punctuation policy or pretrained tokenizer requires a different versioned representation. CSV adapters should validate their actual schema and label convention instead of guessing whether labels are zero-based or one-based.

```python
# file: text_project/data.py
import csv
import torch
from torch.nn.utils.rnn import pad_sequence

TRAIN_ROWS = [("clear useful guide", 1), ("really helpful guide", 1),
    ("useful examples", 1), ("broken confusing guide", 0),
    ("really confusing examples", 0), ("unhelpful lesson", 0)]
VALIDATION_ROWS = [("helpful examples", 1), ("confusing guide", 0)]

def tokenize(text):
    tokens = text.casefold().split()
    if not tokens:
        raise ValueError("Text must contain a token")
    return tokens

def build_vocab(rows):
    vocabulary = {"<pad>": 0, "<unk>": 1}
    for token in sorted({token for text, _ in rows for token in tokenize(text)}):
        vocabulary[token] = len(vocabulary)
    return vocabulary

def encode(text, vocabulary, max_tokens=64):
    return torch.tensor([vocabulary.get(token, 1) for token in tokenize(text)[:max_tokens]], dtype=torch.long)

def collate(rows, vocabulary):
    texts, labels = zip(*rows)
    sequences = [encode(text, vocabulary) for text in texts]
    lengths = torch.tensor([len(x) for x in sequences])
    return pad_sequence(sequences, batch_first=True), lengths, torch.tensor(labels, dtype=torch.long)

def read_csv_rows(path):
    with open(path, encoding="utf-8", newline="") as file:
        reader = csv.DictReader(file)
        if reader.fieldnames != ["text", "label"]:
            raise ValueError("Expected text,label CSV columns")
        rows = [(row["text"], int(row["label"])) for row in reader]
    if not rows or any(label not in (0, 1) or not text.strip() for text, label in rows):
        raise ValueError("Expected non-empty text and binary class IDs")
    return rows
```

## Define a length-aware recurrent model {#model}

Packed sequences prevent trailing padding from becoming the sentence summary. The padding ID and embedding dimensions are part of the saved model configuration.

```python
# file: text_project/model.py
from torch import nn
from torch.nn.utils.rnn import pack_padded_sequence

class SentimentLSTM(nn.Module):
    def __init__(self, vocabulary_size, embedding_dim=8, hidden_dim=8):
        super().__init__()
        self.embedding = nn.Embedding(vocabulary_size, embedding_dim, padding_idx=0)
        self.lstm = nn.LSTM(embedding_dim, hidden_dim, batch_first=True)
        self.head = nn.Linear(hidden_dim, 2)

    def forward(self, tokens, lengths):
        packed = pack_padded_sequence(self.embedding(tokens), lengths.cpu(),
                                     batch_first=True, enforce_sorted=False)
        _, (hidden, _) = self.lstm(packed)
        return self.head(hidden[-1])
```

## Train and evaluate consistently {#train-evaluate}

The same collator and vocabulary prepare both partitions. Validation selects the stored state. Training uses Adam, cross-entropy and gradient clipping; evaluation uses the frozen model mode and no autograd graph.

```python
# file: text_project/train.py
import copy
import json
from pathlib import Path
from functools import partial
import torch
from torch import nn
from torch.utils.data import DataLoader
from .data import TRAIN_ROWS, VALIDATION_ROWS, build_vocab, collate
from .model import SentimentLSTM

def evaluate(model, loader):
    model.eval()
    total, correct, count = 0.0, 0, 0
    with torch.inference_mode():
        for tokens, lengths, targets in loader:
            logits = model(tokens, lengths)
            total += nn.functional.cross_entropy(logits, targets).item() * len(targets)
            correct += logits.argmax(1).eq(targets).sum().item()
            count += len(targets)
    if not count:
        raise ValueError("Empty evaluation loader")
    return {"loss": total / count, "accuracy": correct / count, "count": count}

def fit(model, training, validation, epochs=25, lr=0.03):
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    best, state, history = float("inf"), None, []
    for epoch in range(epochs):
        model.train()
        for tokens, lengths, targets in training:
            optimizer.zero_grad(set_to_none=True)
            loss = nn.functional.cross_entropy(model(tokens, lengths), targets)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
        metrics = evaluate(model, validation)
        history.append({"epoch": epoch, **metrics})
        if metrics["loss"] < best:
            best, state = metrics["loss"], copy.deepcopy(model.state_dict())
    if state is None:
        raise ValueError("Training needs a valid epoch")
    model.load_state_dict(state)
    return history

def run_training(destination="text-artifact"):
    torch.manual_seed(83)
    vocabulary = build_vocab(TRAIN_ROWS)
    collator = partial(collate, vocabulary=vocabulary)
    training = DataLoader(TRAIN_ROWS, batch_size=3, shuffle=True,
        generator=torch.Generator().manual_seed(83), collate_fn=collator)
    validation = DataLoader(VALIDATION_ROWS, batch_size=2, collate_fn=collator)
    model = SentimentLSTM(len(vocabulary))
    history = fit(model, training, validation)
    folder = Path(destination)
    folder.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), folder / "weights.pt")
    metadata = {"schema_version": 1, "model_version": "toy-sentiment-v1", "vocabulary": vocabulary,
        "embedding_dim": 8, "hidden_dim": 8, "max_tokens": 64,
        "tokenizer": "casefold-whitespace-v1", "classes": ["negative", "positive"]}
    (folder / "metadata.json").write_text(json.dumps(metadata), encoding="utf-8")
    (folder / "history.json").write_text(json.dumps(history), encoding="utf-8")
    return model, vocabulary, history

if __name__ == "__main__":
    run_training()
```

## Load and serve the same vocabulary {#serve}

Model weights and vocabulary IDs must agree. Rebuilding the mapping from a request or another file can produce valid tensor shapes with entirely different word meanings. The loader checks basic schema invariants and instantiates the saved architecture.

```python
# file: text_project/serve.py
import json
from pathlib import Path
import torch
from fastapi import FastAPI
from pydantic import BaseModel, Field, field_validator
from torch.nn.utils.rnn import pad_sequence
from .data import encode
from .model import SentimentLSTM

def load_artifact(folder):
    folder = Path(folder)
    metadata = json.loads((folder / "metadata.json").read_text(encoding="utf-8"))
    vocabulary = metadata["vocabulary"]
    if metadata.get("schema_version") != 1 or metadata.get("tokenizer") != "casefold-whitespace-v1":
        raise ValueError("Unsupported text artifact")
    if vocabulary.get("<pad>") != 0 or vocabulary.get("<unk>") != 1:
        raise ValueError("Incorrect special token IDs")
    if sorted(vocabulary.values()) != list(range(len(vocabulary))):
        raise ValueError("Vocabulary IDs must be unique and contiguous")
    model = SentimentLSTM(len(vocabulary), metadata["embedding_dim"], metadata["hidden_dim"])
    model.load_state_dict(torch.load(folder / "weights.pt", map_location="cpu", weights_only=True))
    return model.eval(), metadata

def predict_texts(model, metadata, texts):
    if not 1 <= len(texts) <= 16 or any(not t.strip() or len(t) > 2000 for t in texts):
        raise ValueError("Expected 1–16 non-empty texts of at most 2000 characters")
    sequences = [encode(text, metadata["vocabulary"], metadata["max_tokens"]) for text in texts]
    lengths = torch.tensor([len(x) for x in sequences])
    tokens = pad_sequence(sequences, batch_first=True)
    with torch.inference_mode():
        return model(tokens, lengths).argmax(1).tolist()

class TextRequest(BaseModel):
    texts: list[str] = Field(min_length=1, max_length=16)

    @field_validator("texts")
    @classmethod
    def validate_texts(cls, texts):
        if any(not text.strip() or len(text) > 2000 for text in texts):
            raise ValueError("Text is empty or too long")
        return texts

def create_app(folder):
    model, metadata = load_artifact(folder)
    app = FastAPI(title="Local toy sentiment classifier")
    @app.post("/predict")
    def predict(request: TextRequest):
        return {"model_version": metadata["model_version"],
                "classes": predict_texts(model, metadata, request.texts)}
    return app
```

## Execute the local contract tests {#run}

```python
from pathlib import Path
from functools import partial
import torch
from torch.utils.data import DataLoader
from fastapi.testclient import TestClient
from text_project.data import VALIDATION_ROWS, collate, read_csv_rows
from text_project.train import run_training, evaluate
from text_project.serve import load_artifact, predict_texts, create_app

model, vocabulary, history = run_training()
assert history[-1]["loss"] < history[0]["loss"]
validation = DataLoader(VALIDATION_ROWS, batch_size=2, collate_fn=partial(collate, vocabulary=vocabulary))
assert evaluate(model, validation)["count"] == 2
restored, metadata = load_artifact("text-artifact")
tokens, lengths, _ = next(iter(validation))
torch.testing.assert_close(restored(tokens, lengths), model(tokens, lengths))
assert len(predict_texts(restored, metadata, ["helpful examples", "confusing guide"])) == 2
Path("reviews.csv").write_text("text,label\nuseful examples,1\nconfusing guide,0\n", encoding="utf-8")
assert len(read_csv_rows("reviews.csv")) == 2
with TestClient(create_app("text-artifact")) as client:
    response = client.post("/predict", json={"texts": ["helpful examples", "confusing guide"]})
    assert response.status_code == 200 and len(response.json()["classes"]) == 2
    assert client.post("/predict", json={"texts": ["   "]}).status_code == 422
```

## Adapt the dataset to IMDb {#imdb}

The optional adapter below uses the maintained Hugging Face Datasets interface instead of old TorchText IMDb loaders. Downloading the corpus is a separate local step. Preserve the official test set and split the training set for validation before vocabulary building.

```python title="Optional: download IMDb and prepare loaders"
from datasets import load_dataset
from torch.utils.data import DataLoader
from functools import partial
from text_project.data import build_vocab, collate
from text_project.model import SentimentLSTM
from text_project.train import fit

corpus = load_dataset("stanfordnlp/imdb")
split = corpus["train"].train_test_split(test_size=0.2, seed=83, stratify_by_column="label")
training_rows = [(row["text"], row["label"]) for row in split["train"]]
validation_rows = [(row["text"], row["label"]) for row in split["test"]]
vocabulary = build_vocab(training_rows)
collator = partial(collate, vocabulary=vocabulary)
training_loader = DataLoader(training_rows, batch_size=32, shuffle=True, collate_fn=collator)
validation_loader = DataLoader(validation_rows, batch_size=32, collate_fn=collator)
candidate = SentimentLSTM(len(vocabulary))
history = fit(candidate, training_loader, validation_loader, epochs=3)
```

For a real review corpus, bound vocabulary size, choose a justified sequence-length policy, measure truncation/OOV rates and record the dataset revision. Tune embedding/hidden dimensions or learning rate on validation, freeze the choice, then report accuracy, macro F1, confusion matrix and error buckets on the untouched test partition. A 64-token teaching limit is a limitation to examine, not an established best choice for IMDb.

Save the selected weights with that exact vocabulary/configuration and update the API's input limits accordingly. Monitor language, length and confidence distributions, and join delayed labels to the correct version before using feedback in a candidate retraining run.

## Practice

Two vocabularies contain the same words but assign them different integer IDs. Can the saved embedding weights be reused unchanged with either one?

??? question "Check your reasoning"
    No. Each embedding row belongs to the token assigned that ID during training. Changing the mapping changes meanings without changing tensor shapes. Preserve the mapping with the artifact or explicitly remap embedding rows and validate equivalent predictions.
