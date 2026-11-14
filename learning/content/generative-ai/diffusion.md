---
title: "Learn to reverse a noising process"
description: "Understand the forward process, learned denoising and what an inference sampler actually does."
course: Generative AI
lesson: CHAPTER 24 OF 32
---

# Learn to reverse a noising process

<div class="genai-phase">OTHER GENERATIVE MODELS · STEP 24 OF 32</div>

**After this chapter:** Understand the forward process, learned denoising and what an inference sampler actually does.

**Before you start:** [23 · Project: an assistant workflow you can replay](workflow-project.md). Keep the [glossary](glossary.md) nearby when a term is new.

## Learn generation through progressive denoising {#idea}

An autoregressive language model generates a sequence position by position. A diffusion model learns a way to reverse a defined corruption process, often starting from noise and applying many denoising steps. The model family, training objective and sampler are related but distinct choices.

In a common Gaussian forward process, a clean example `x0` becomes `xt = sqrt(alpha_bar_t) × x0 + sqrt(1 - alpha_bar_t) × epsilon`. Here `epsilon` is standard Gaussian noise, and `alpha_bar_t` summarizes the retained signal after a schedule of steps.

## Inspect one noisy observation {#forward}

```python
import math
import random

rng = random.Random(12)
x0, alpha_bar = 1.5, 0.36
noise = rng.gauss(0.0, 1.0)
xt = math.sqrt(alpha_bar) * x0 + math.sqrt(1 - alpha_bar) * noise
# An oracle knows the exact sampled noise; a learned denoiser must estimate it.
reconstructed = (xt - math.sqrt(1 - alpha_bar) * noise) / math.sqrt(alpha_bar)
assert math.isclose(reconstructed, x0)
wrong_estimate = noise + 0.2
wrong_x0 = (xt - math.sqrt(1 - alpha_bar) * wrong_estimate) / math.sqrt(alpha_bar)
assert not math.isclose(wrong_x0, x0)
```

The inversion works because the example supplies the actual sampled noise. At inference time, a learned model does not receive that oracle value. It estimates a useful denoising quantity from the noisy input, time step and any conditioning information.

## Connect training targets to the process {#targets}

Different parameterizations predict noise, a clean sample or a velocity-like combination. Score-based descriptions estimate gradients of a log-density. Their relationships depend on the defined process and parameterization. Keep notation consistent when translating an equation into code.

Training commonly samples a clean example, a time step and noise, constructs the noisy input and minimizes a denoising loss. The time distribution, schedule and weighting affect what is learned. Variational formulations connect the process to likelihood-related objectives; a simplified training loss is a deliberate modeling choice.

## Separate the learned model from the sampler {#samplers}

DDPM-style sampling uses a reverse stochastic process. DDIM and other solvers make different update choices; some use deterministic trajectories under stated conditions. Fewer steps can reduce latency while changing the fidelity/diversity trade-off. Changing a sampler does not mean that the denoiser was retrained.

A probability-flow ODE and a stochastic differential-equation view provide other connections. Flow matching trains vector fields under a chosen path construction; it should be explained through its own objective, rather than assumed to be identical to every diffusion loss.

## Evaluate a generative task {#evaluation}

Generated samples need both task-specific quality checks and diversity assessment. FID and related distribution metrics depend on feature extractors, sample counts and comparison protocols. A text-image similarity score is not a complete test of requested content, composition or factual detail. Human evaluation and task-specific checks can reveal different failures.

The [DDPM paper](https://arxiv.org/abs/2006.11239) is a primary starting point for the Gaussian denoising formulation. Next, we add conditions and examine how architectures operate in pixel or latent spaces.

## Try it yourself {#practice}

Vary alpha_bar between 0.9 and 0.1. Compare the same noise-estimation error in the reconstructed x0 and explain how signal strength changes its effect.

## Check your understanding {#self-check}

Does the successful oracle reconstruction in the example demonstrate that a trained diffusion model can perfectly recover every clean input?

??? question "Check your reasoning"
    No. The code supplies the actual noise used to construct the observation. A trained denoiser has to estimate its target from available information and can make errors. Generation also depends on the sampler and the learned distribution.

## Continue in order {#continue}

**Previous:** [23 · Project: an assistant workflow you can replay](workflow-project.md)<br>
**Next:** [25 · Condition image and video generation](conditional-diffusion.md)

**Source reading:** [Diffusion models](https://aman.ai/primers/diffusion-models/). The explanations and numerical examples on this page are original BuildMyX teaching material. Use the linked primers for further detail and their research bibliographies.
