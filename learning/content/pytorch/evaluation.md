---
title: Evaluate, benchmark and report
description: Choose classification, regression and generation metrics, protect the test protocol, inspect errors and quantify uncertainty in model comparisons.
course: PyTorch
lesson: CHAPTER 13 OF 20
---

# Evaluate, benchmark and report

## Establish the evaluation protocol {#protocol}

Use training data to fit parameters, validation data to select the procedure and a held-out test set for its final assessment. Stratification can preserve class proportions; group or temporal splits preserve the independence structure required by the task. Near-duplicate text or images across splits can leak information even when row IDs differ.

Cross-validation repeats train/validation fitting across folds. Fit preprocessing separately inside each fold; otherwise the held-out fold influenced the representation. Nested cross-validation can separate hyperparameter selection from performance estimation. Keep the evaluation metric definitions and class order fixed across all runs.

```python
import numpy as np
import torch
from sklearn.model_selection import train_test_split, StratifiedKFold

ids = np.arange(40)
labels = np.array([0, 1] * 20)
train_ids, test_ids = train_test_split(ids, test_size=0.25, random_state=40, stratify=labels)
assert set(train_ids).isdisjoint(test_ids)
assert np.bincount(labels[test_ids]).tolist() == [5, 5]
folds = list(StratifiedKFold(n_splits=4, shuffle=True, random_state=40).split(ids, labels))
assert len(folds) == 4
```

## Classification metrics and their denominators {#classification}

Accuracy is correct predictions divided by all examples. Precision is `TP / (TP + FP)`; recall is `TP / (TP + FN)`; F1 is their harmonic mean. A confusion matrix exposes which true classes are confused with which predictions. Specify whether F1 is binary, macro, micro or weighted; those averages answer different questions for imbalanced data.

```python
from sklearn.metrics import (accuracy_score, precision_recall_fscore_support,
    confusion_matrix, roc_auc_score, classification_report)

truth = np.array([0, 0, 0, 1, 1, 1, 1, 0])
scores = np.array([0.1, 0.2, 0.7, 0.8, 0.9, 0.4, 0.6, 0.3])
prediction = (scores >= 0.5).astype(int)
matrix = confusion_matrix(truth, prediction, labels=[0, 1])
assert matrix.tolist() == [[3, 1], [1, 3]]
assert accuracy_score(truth, prediction) == 0.75
precision, recall, f1, _ = precision_recall_fscore_support(truth, prediction, average="binary", zero_division=0)
assert precision == recall == f1 == 0.75
assert 0 <= roc_auc_score(truth, scores) <= 1
report = classification_report(truth, prediction, output_dict=True, zero_division=0)
assert report["1"]["support"] == 4
```

ROC-AUC compares discrimination across thresholds and requires scores rather than only hard decisions. AUC is undefined when the evaluation set contains only one class; precision/recall denominators can also be zero. State the policy instead of silently treating an undefined metric as a normal observation. Calibration measures whether confidence agrees with observed correctness; it is not the same as accuracy or AUC.

## Generate predictions without a training graph {#prediction-loop}

Collect predictions and targets in a fixed class order with `eval()` and `inference_mode()`. Move batches to the correct device and move retained outputs to CPU. For a sentiment LSTM, also pass its lengths and retain text IDs for later error analysis; for a CNN, retain image IDs and labels.

```python
from torch import nn
from torch.utils.data import TensorDataset, DataLoader

model = nn.Linear(2, 2)
loader = DataLoader(TensorDataset(torch.zeros(5, 2), torch.tensor([0, 1, 0, 1, 0])), batch_size=2)
model.eval()
all_predictions, all_targets = [], []
with torch.inference_mode():
    for features, targets in loader:
        all_predictions.append(model(features).argmax(dim=1).cpu())
        all_targets.append(targets.cpu())
all_predictions = torch.cat(all_predictions)
all_targets = torch.cat(all_targets)
assert all_predictions.shape == all_targets.shape == (5,)
```

Loading a checkpoint does not automatically choose evaluation mode. The [vision](vision-project.md) and [text](text-project.md) projects connect saved weights to the same prediction interfaces used here.

TorchMetrics provides stateful/streaming metric implementations, including distributed aggregation. Update with the appropriate batches, compute after the phase and reset before another phase or split. Averaging independent per-batch F1 scores is generally different from computing F1 from the full confusion counts.

## Regression and generation need other metrics {#regression-generation}

For continuous targets, MSE averages squared errors and emphasizes large errors; MAE averages absolute errors in the target's unit. R² compares squared error with a mean-target baseline and can be negative. Constant targets or tiny samples require a documented undefined-value policy.

```python
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

actual = [1., 2., 3.]
estimated = [1., 2., 4.]
assert mean_absolute_error(actual, estimated) == 1 / 3
assert mean_squared_error(actual, estimated) == 1 / 3
assert r2_score(actual, estimated) == 0.5
```

| Generation metric | What it measures | A useful limitation |
| --- | --- | --- |
| Perplexity | `exp(mean token negative log-likelihood)` | Compare only compatible tokenization, masking and data protocols |
| BLEU | Modified n-gram precision with a brevity penalty, often for translation | Lexical overlap can miss valid paraphrases |
| ROUGE | A family of overlap scores, often recall-oriented; ROUGE-L uses subsequences | High overlap does not establish factual correctness |
| BERTScore | Contextual embedding similarity | Depends on the scoring model and does not prove truthfulness |
| Human evaluation | Task-specific judgments of quality, fluency and factuality | Needs clear rubrics, sampling and rater agreement |

```python
import math

token_negative_log_likelihoods = torch.tensor([0.2, 0.4, 0.3])
perplexity = math.exp(token_negative_log_likelihoods.mean().item())
assert perplexity >= 1
```

Do not report sentence-classification cross-entropy as a language model's token perplexity. For NER, add entity/span metrics to token scores; abundant `O` labels can hide weak entity recognition.

## Inspect errors and communicate them {#error-analysis}

Bucket errors by class, input length, source, lighting, language or another justified property. For vision, inspect misclassified images and a confusion matrix; for text, inspect negation, rare words, truncation and unknown-token rates. Retain example IDs so an error remains traceable without logging unnecessary raw content.

```python
import matplotlib.pyplot as plt

errors = np.flatnonzero(prediction != truth)
assert errors.tolist() == [2, 5]
fig, ax = plt.subplots(figsize=(4, 3))
ax.imshow(matrix, cmap="Greens")
for row in range(2):
    for column in range(2):
        ax.text(column, row, str(matrix[row, column]), ha="center", va="center")
ax.set(xlabel="Predicted class", ylabel="True class", xticks=[0, 1], yticks=[0, 1])
fig.savefig("confusion-matrix.png", dpi=120, bbox_inches="tight")
plt.close(fig)
```

A qualitative example suggests a hypothesis, not proof of a model's internal reasoning. Attribution tools such as SHAP, LIME or visual saliency can help investigate behavior, but their assumptions and stability need separate evaluation.

Seaborn's heatmap is another way to display a confusion matrix. The rendering library does not change the metric: retain the class order, axis labels, counts and any normalization rule in either display.

## Compare models with paired evidence {#uncertainty}

Benchmark the same test examples, preprocessing, batch size and precision. Record model/data versions, device, environment, warm-up policy, latency distribution, throughput and memory. Repeat training across seeds and report the mean, spread and sample count; distinguish variation across training seeds from uncertainty across future examples.

This paired bootstrap resamples example positions, preserving the fact that both models were evaluated on the same records. Eight toy examples do not justify a production significance claim.

```python
prediction_b = np.array([0, 0, 0, 1, 1, 0, 1, 0])
difference = (prediction_b == truth).astype(float) - (prediction == truth).astype(float)
rng = np.random.default_rng(41)
samples = rng.integers(0, len(truth), size=(1000, len(truth)))
bootstrap_difference = difference[samples].mean(axis=1)
low, high = np.quantile(bootstrap_difference, [0.025, 0.975])
assert low <= difference.mean() <= high
assert low <= high
```

McNemar's test examines paired classification disagreements, particularly cases only one model gets right. A paired t-test over run-level scores requires suitable assumptions and pairing; correlated runs and repeated testing complicate interpretation. Cluster the resampling unit when examples share a user or document. A p-value does not establish practical importance, and a wide interval does not prove two models are equivalent.

## Report the procedure, not just its winning score {#reporting}

Include the task, dataset provenance/split, class distribution, training recipe, all compared variants, model-selection rule, metrics with denominators, uncertainty, resources, failure buckets and limitations. A model card can also describe intended uses and unsupported populations. For a CNN versus a sentiment LSTM, compare each within its task; their raw accuracy numbers are not a cross-task ranking.

## Practice

A model has 99% accuracy on data where 99% of examples are negative. What evidence is missing?

??? question "Check your reasoning"
    A classifier that always predicts negative already reaches 99%. Inspect positive-class precision/recall, the confusion matrix, class counts, threshold behavior and the cost of errors. Compare against an appropriate baseline under the same split and preprocessing protocol.
