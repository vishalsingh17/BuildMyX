---
title: "Tokens and language modeling"
description: "Follow text through token IDs, causal prediction and a language-model objective."
course: Generative AI
lesson: CHAPTER 03 OF 32
---

# Tokens and language modeling

<div class="genai-phase">FOUNDATIONS · STEP 03 OF 32</div>

**After this chapter:** Follow text through token IDs, causal prediction and a language-model objective.

**Before you start:** [02 · The math behind a prediction](math-and-learning.md). Keep the [glossary](glossary.md) nearby when a term is new.

## Text becomes a sequence of identifiers {#tokenization}

A tokenizer maps text to units and then to integer IDs. Tokens may be words, word pieces, bytes, punctuation or special markers. Byte-pair encoding and unigram approaches build reusable subword vocabularies. A byte-level fallback can represent unfamiliar text, but the resulting token count may be large.

“Token” and “word” are different units. Whitespace rules, language, Unicode normalization, numbers and source code all influence segmentation. The tokenizer must match the model and its chat-format conventions. Replacing a tokenizer changes what an input ID means.

Our small example deliberately uses whitespace so the counts are easy to inspect. It illustrates a language-model objective without pretending to be a modern subword tokenizer.

## Predict a token using the preceding tokens {#next-token}

An autoregressive language model factorizes a sequence into conditional next-token probabilities. For tokens `x1, x2, x3`, the joint probability is `P(x1) × P(x2|x1) × P(x3|x1,x2)`. The model receives an available prefix and produces scores over the vocabulary for the next position.

```python
from collections import Counter, defaultdict

sentences = ["learn python today", "learn python slowly", "learn data today"]
counts = defaultdict(Counter)
for sentence in sentences:
    words = ["<start>", *sentence.split(), "<end>"]
    for left, right in zip(words, words[1:]):
        counts[left][right] += 1

following = counts["learn"]
total = sum(following.values())
assert following["python"] / total == 2 / 3
assert following["data"] / total == 1 / 3
assert max(counts["python"], key=counts["python"].get) in {"today", "slowly"}
```

This bigram model only remembers one preceding token. Neural language models learn representations that can condition on much richer prefixes. The counting example still exposes an important limitation: a likely continuation reflects the examples used to learn it.

## Build the training input and target deliberately {#targets}

For a sequence `[A, B, C, END]`, one next-token training pair is input `[A, B, C]` and target `[B, C, END]`. A causal mask prevents a position from reading future target information. Padding fills a batch to a common length, and padding positions should be excluded from the appropriate loss or attention calculation.

```python
tokens = [10, 20, 30, 99]
inputs, targets = tokens[:-1], tokens[1:]
assert list(zip(inputs, targets)) == [(10, 20), (20, 30), (30, 99)]
```

During training, **teacher forcing** provides the recorded preceding tokens. During ordinary generation, the model consumes its own earlier outputs. An early mistake can therefore affect subsequent predictions. Stopping rules and later workflow evaluation matter even when the token loss looks good.

## Compare language-model objectives {#objectives}

| Objective | What information is available? | Useful intuition |
| --- | --- | --- |
| Causal next-token prediction | Earlier positions | Continue a sequence |
| Masked-token prediction | Surrounding visible positions | Recover a missing element |
| Encoder–decoder prediction | Encoded input plus earlier output positions | Transform one sequence into another |

A representation model can support retrieval or classification without offering a text-generation interface. A generative model can also return embeddings, but those embeddings need their own evaluation for the intended similarity task.

## Measure token prediction carefully {#perplexity}

Average negative log-likelihood summarizes how much probability a model assigns to held-out tokens. Perplexity is its exponential. Compare it under the same data treatment and tokenizer; changing segmentation changes the units being scored. Perplexity is not a complete measure of factual accuracy, instruction following or user usefulness.

Special tokens can mark the start of a message, speaker role, image patch sequence or end of a response. Use the model's documented serialization instead of guessing at delimiters. Tokenization also affects generation boundaries; chapter 9 returns to constrained prefixes and token healing.

## Try it yourself {#practice}

Add a fourth sentence to the counting example. Recompute the probability after “learn” by hand and verify it in Python. Then explain why this model cannot resolve a long-distance reference.

## Check your understanding {#self-check}

Why is revealing the next token inside the input representation a problem during evaluation?

??? question "Check your reasoning"
    It leaks the target. The model can exploit information that would not be available when generating. The input construction, causal mask and split procedure must reflect the real prediction setting.

## Continue in order {#continue}

**Previous:** [02 · The math behind a prediction](math-and-learning.md)<br>
**Next:** [04 · Represent meaning with embeddings](embeddings.md)

**Source reading:** [Language models](https://aman.ai/primers/LLM/) · [Transformers](https://aman.ai/primers/transformers/). The explanations and numerical examples on this page are original BuildMyX teaching material. Use the linked primers for further detail and their research bibliographies.
