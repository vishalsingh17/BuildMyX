---
title: "Condition image and video generation"
description: "Compare latent models, U-Nets, DiTs, guidance and sampling or adaptation choices."
course: Generative AI
lesson: CHAPTER 25 OF 32
---

# Condition image and video generation

<div class="genai-phase">OTHER GENERATIVE MODELS · STEP 25 OF 32</div>

**After this chapter:** Compare latent models, U-Nets, DiTs, guidance and sampling or adaptation choices.

**Before you start:** [24 · Learn to reverse a noising process](diffusion.md). Keep the [glossary](glossary.md) nearby when a term is new.

## Tell the denoiser what should stay consistent {#conditioning}

Conditioning can describe text, a class, an image, a mask, a pose, depth or earlier video frames. It changes the distribution the model is asked to sample. The conditioning representation, training pairs and architecture determine how that information influences denoising.

A **latent diffusion** design denoises a compressed representation produced by an autoencoder. The decoder maps the result back to an observation. Compression reduces a particular computation cost, but the autoencoder can also lose detail. Pixel and latent models therefore have different quality, memory and interface trade-offs.

## Compare U-Nets and diffusion transformers {#architectures}

U-Nets combine processing at multiple resolutions with skip connections. Diffusion transformers tokenize or patchify a representation and use transformer blocks conditioned on time and other inputs. Architecture, training data, compute and sampling choices jointly affect results; a model name alone does not explain a quality difference.

Cross-attention is one way to mix text features with a visual representation. Other conditioning mechanisms modulate activations or supply extra channels. Keep these mechanisms distinct from a retrieval system that simply adds text to a language-model prompt.

## Inspect classifier-free guidance {#guidance}

A common guidance construction combines conditional and unconditional predictions. For the convention `unconditional + scale × (conditional - unconditional)`, scale 1 returns the conditional prediction. Guidance strength changes the sampling behavior and can introduce artifacts or reduce diversity.

```python
unconditional = [0.0, 1.0]
conditional = [2.0, 3.0]

def guided(scale):
    return [u + scale * (c - u) for u, c in zip(unconditional, conditional)]

assert guided(0.0) == unconditional
assert guided(1.0) == conditional
assert guided(2.0) == [4.0, 5.0]
```

Libraries can expose different conventions or additional rescaling. Verify the documented definition before comparing numerical settings. A larger number is not a general quality guarantee.

## Choose the right control and adaptation layer {#control}

Text descriptions specify content and style, while spatial controls can supply stronger structure. Inpainting conditions on a mask and surrounding image. Image-to-image methods preserve some input information through a chosen corruption or encoding process. ControlNet-style mechanisms provide additional conditioning pathways. LoRA can adapt selected weights, including in diffusion systems.

Prompt wording and negative prompts interact with the model's training and guidance implementation. Record exact prompts and settings during comparisons. Check requested objects, relationships, text rendering and undesirable artifacts rather than selecting only a visually attractive sample.

## Extend from images to video {#video}

Video introduces temporal relationships and larger representations. Framewise quality can be high while object identity, motion or geometry changes inconsistently across time. Temporal attention, 3D operations and conditioned frame histories make different assumptions.

Use task-appropriate temporal evaluation and inspect complete clips. A frame similarity or image-quality metric cannot establish correct action dynamics. Chapter 30 returns to the difference between generating a plausible clip and modeling a world well enough for planning.

## Make an experiment reproducible {#experiment}

Version the model, conditioning encoders, autoencoder, scheduler, seed policy, precision and post-processing. Compare several prompts and repeated samples. Document any fine-tuning or alignment data and its held-out tests. When using a framework such as Diffusers, follow the installed release's model and scheduler interfaces rather than combining arbitrary checkpoints and configuration files.

## Try it yourself {#practice}

Use the guidance formula to compare scales 0, 1 and 3 for another pair of vectors. Then design an image evaluation that separately measures prompt adherence, diversity and a specific artifact.

## Check your understanding {#self-check}

If a generated video looks realistic, has the model established that the action in the video will work in the real world?

??? question "Check your reasoning"
    No. Visual plausibility and useful predictive dynamics are different properties. A planning or control application needs action-conditioned evaluation, state consistency, uncertainty handling and validation against observations.

## Continue in order {#continue}

**Previous:** [24 · Learn to reverse a noising process](diffusion.md)<br>
**Next:** [26 · Connect images and language](vision-language.md)

**Source reading:** [Diffusion models](https://aman.ai/primers/diffusion-models/). The explanations and numerical examples on this page are original BuildMyX teaching material. Use the linked primers for further detail and their research bibliographies.
