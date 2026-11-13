---
title: PyTorch, from tensors to a complete model workflow
description: Twenty practical PyTorch chapters covering the supplied primer, with original examples, vision and text projects, exercises and a complete topic index.
course: PyTorch
---

<div class="lesson-eyebrow">BUILDMYX LEARN / PYTORCH</div>

# Make a prediction.<br>Understand every step.

<p class="lesson-lead">Move from a tensor on the page to a model you can train, evaluate and serve. Learn the shapes, decisions and checks that connect the whole workflow.</p>

<div class="lesson-meta"><span>20 free chapters</span><span>PyTorch 2.15</span><span>CPU examples</span><span>No sign-up</span></div>

[Start learning PyTorch →](getting-started.md){ .md-button .md-button--primary }
[Find a reference topic](coverage.md){ .md-button }

## Your PyTorch learning path

Start with the [Python path](../python/index.md) if functions, classes or imports are new. Basic vectors, matrices, derivatives and probability help with the explanations; the first chapters make the tensor operations concrete.

| Chapter | Learn to… |
| --- | --- |
| [01 · Get started](getting-started.md) | Set up a CPU environment and follow a model's data flow |
| [02 · Create and initialize tensors](tensors.md) | Choose shapes, dtypes, devices and initialization schemes |
| [03 · Reshape, move axes and broadcast](shapes.md) | Distinguish a view from an axis permutation and preserve reduction dimensions |
| [04 · Autograd and modules](autograd.md) | Track gradients, register parameters and define useful model interfaces |
| [05 · Datasets, batches and data quality](datasets.md) | Build Dataset/DataLoader pipelines and prevent split leakage |
| [06 · Vision preprocessing](vision-data.md) | Normalize, augment and inspect image tensors; adapt CIFAR-10 |
| [07 · Text preprocessing](text-data.md) | Build a vocabulary, load tags, pad batches and mask unknown or padded tokens |
| [08 · Audio preprocessing](audio-data.md) | Work with waveforms, sample rates, mel features and time/frequency masks |
| [09 · CNNs, LSTMs and custom losses](networks.md) | Build image, sentence and token classifiers with explicit shape contracts |
| [10 · Train, validate and checkpoint](training.md) | Write complete loops, clip gradients and retain the best model |
| [11 · Fine-tuning and LoRA](fine-tuning.md) | Freeze a base model and learn a small low-rank update |
| [12 · Run useful experiments](experiments.md) | Compare configurations with grid search, Optuna, Hydra and local logging |
| [13 · Evaluate and report](evaluation.md) | Choose metrics, inspect errors and compare models fairly |
| [14 · Save and export](exporting.md) | Load state dictionaries, use torch.export and check ONNX parity |
| [15 · Serve predictions](serving.md) | Validate an inference request and test a small FastAPI service locally |
| [16 · Optimize inference](optimization.md) | Benchmark batching, caching, pruning and quantization trade-offs |
| [17 · Monitor and improve](monitoring.md) | Detect distribution changes and connect feedback to controlled releases |
| [18 · A complete vision project](vision-project.md) | Connect image data, training, evaluation and an inference interface |
| [19 · A complete text project](text-project.md) | Keep a sentiment model and its vocabulary together from training to serving |
| [20 · Orchestrate the workflow](orchestration.md) | Organize versioned tasks and compare Prefect and Airflow recipes |

## Run small examples before scaling up

The **core Python blocks** run on a CPU using synthetic or explicitly supplied local data. Run blocks in order within a chapter, with a fresh script or notebook kernel for each chapter. An `assert` makes the expected result inspectable. Labelled `# file:` blocks in the project chapters belong in separate files before running the remaining example.

Blocks titled **Optional** are integration recipes. They are syntax-checked, but need the stated dataset, accelerator or orchestration runtime to execute. CIFAR-10 and IMDb are covered through adapters and small offline projects; the course's toy results are not benchmark results on those datasets. Prefect/Airflow examples do not deploy a service or create a schedule until you explicitly run them in that environment.

Download the [vision and text project source bundle](assets/pytorch-projects.zip) to work through the last chapters locally. The website displays lessons and code; it does not run reader-supplied training jobs, upload datasets or save exercise answers.

## Check the coverage

The [coverage index](coverage.md) maps all **252 rendered section/subsection headings** in the requested [Aman.ai PyTorch primer](https://aman.ai/primers/pytorch/), plus its unheaded dataset/vocabulary material, to this course. It records the source snapshot and explains older APIs in their current context, including TorchText, TorchScript and TorchServe.

## Bring a model question

Share a small example, the shape you expected and the behavior you observed. We can discuss guided learning or project feedback after an enquiry.

[Discuss PyTorch learning support ↗](/?interest=learning#enquire){ .md-button }
