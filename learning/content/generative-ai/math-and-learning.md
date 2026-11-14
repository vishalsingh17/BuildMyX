---
title: "The math behind a prediction"
description: "Use vectors, probability, loss and a small gradient update without skipping the notation."
course: Generative AI
lesson: CHAPTER 02 OF 32
---

# The math behind a prediction

<div class="genai-phase">FOUNDATIONS · STEP 02 OF 32</div>

**After this chapter:** Use vectors, probability, loss and a small gradient update without skipping the notation.

**Before you start:** [01 · Start learning Generative AI](getting-started.md). Keep the [glossary](glossary.md) nearby when a term is new.

## A vector is an ordered set of measurements {#vectors}

A vector such as `[2, 1]` might represent two features of an example. Its dimensions need a consistent meaning across inputs. A matrix arranges vectors into rows or columns. Before multiplying matrices, write down their shapes: a `[batch, input]` matrix can multiply an `[input, output]` weight matrix to produce `[batch, output]`.

The **dot product** multiplies corresponding values and adds them. For `[2, 1]` and `[3, -1]`, the result is `2×3 + 1×(-1) = 5`. It can score alignment, but the magnitude of the vectors also affects it. Chapter 4 adds normalization when we want cosine similarity.

## Turn scores into probabilities {#probability}

A model often produces unnormalized scores called **logits**. Softmax turns a vector of logits into positive values that sum to one. Subtracting the largest score before exponentiation preserves the result and avoids numerical overflow.

```python
import math

def softmax(scores):
    maximum = max(scores)
    values = [math.exp(score - maximum) for score in scores]
    total = sum(values)
    return [value / total for value in values]

probabilities = softmax([2.0, 1.0, 0.0])
assert math.isclose(sum(probabilities), 1.0)
assert probabilities[0] > probabilities[1] > probabilities[2]
assert softmax([1002.0, 1001.0, 1000.0]) == probabilities
```

A high probability means “favored under this model and these inputs.” It does not independently establish that a statement is true. A model can assign a high score to an answer learned from a misleading pattern.

## A loss tells learning what to improve {#loss}

For a correct class with predicted probability `p`, cross-entropy contributes `-log(p)`. Assigning the correct class probability 0.9 gives a smaller loss than assigning it 0.1. For language modeling, the correct class is usually the next token at each position. Training averages losses across selected positions and examples.

A **gradient** tells us how a small parameter change affects the loss locally. A learning rate controls the size of the update. One update does not establish generalization; repeatedly changing parameters to fit examples can also overfit them.

```python
# One logistic-model update on one positive synthetic example.
w, x, target, learning_rate = 0.0, 2.0, 1.0, 0.1
sigmoid = lambda value: 1 / (1 + math.exp(-value))
before = sigmoid(w * x)
gradient = (before - target) * x
w -= learning_rate * gradient
after = sigmoid(w * x)
assert -math.log(after) < -math.log(before)
```

Here `gradient = -1`, so the update increases `w` and makes the positive class more likely. Real networks apply the chain rule through many operations; automatic differentiation records those dependencies. Review [autograd](../pytorch/autograd.md) after the scalar example feels concrete.

## Keep learning and measurement separate {#splits}

Use training examples to fit parameters, validation examples to select configurations and a held-out test set for the final assessment. Keep related records together when an ordinary random split would leak their shared information. Two chunks from the same document, two frames from the same video or near-duplicate conversations can make a test deceptively easy.

Batch size, number of steps, optimizer state, numerical precision and the learning-rate schedule affect both training behavior and memory use. A comparison should record those choices. A lower training loss alone is insufficient evidence that a model will serve your users better.

## Read an equation as a data flow {#notation}

When you meet `y = W x + b`, identify the input `x`, learned parameters `W` and `b`, and output `y`. A superscript `T` means transpose; a subscript usually names a position or time step. `Σ` means add a set of terms. These conventions will reappear in attention, distillation and state-space models.

## Try it yourself {#practice}

Change the scalar example to a negative target. Predict the sign of the gradient, then verify that the correct-class loss decreases for a small update.

## Check your understanding {#self-check}

Could you choose the learning rate by repeatedly checking the final test set?

??? question "Check your reasoning"
    That would make the test set part of model selection and bias the final estimate. Select configurations using validation data, retain an untouched test set and document any later decision that uses its results.

## Continue in order {#continue}

**Previous:** [01 · Start learning Generative AI](getting-started.md)<br>
**Next:** [03 · Tokens and language modeling](tokens-and-language.md)

**Source reading:** [Language models](https://aman.ai/primers/LLM/) · [Transformers](https://aman.ai/primers/transformers/). The explanations and numerical examples on this page are original BuildMyX teaching material. Use the linked primers for further detail and their research bibliographies.
