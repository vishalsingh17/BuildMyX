---
title: PyTorch topic coverage and sources
description: Every rendered heading in the supplied PyTorch primer mapped to an original BuildMyX lesson, including full workflows, nested recipes and modern API notes.
course: PyTorch
---

# Every PyTorch topic, easy to find

This index maps all **252 rendered section/subsection headings** in the requested [Aman.ai PyTorch primer](https://aman.ai/primers/pytorch/) to original lessons. It includes repeated headings, deeply nested workflow steps and the bibliography sections. The snapshot was reviewed on **14 November 2026**. Its initial unheaded dataset/vocabulary material is covered in [loading text files](text-data.md#loading-text) and [building the vocabulary](text-data.md#vocabulary).

The explanations, examples, synthetic datasets, project files and chart are original. This course uses the reference outline as a coverage checklist; it does not reproduce its article or datasets. The captured heading inventory and source checksum are retained with the course, and every mapped local anchor is checked during builds.

[Start the PyTorch path →](index.md){ .md-button .md-button--primary }

## Version and execution notes

Core chapter programs are tested on **PyTorch 2.15.0, CPU, Python 3.12+**. Run blocks in order within a chapter; labelled project files belong in separate files. The download bundle supplies the modules reused by the orchestration chapter. Examples use small synthetic/local inputs and do not claim CIFAR-10 or IMDb benchmark performance.

Blocks titled **Optional** are syntax-checked integration recipes. Downloading real datasets, installing TorchAO or starting Prefect/Airflow needs the stated additional setup. Those integrations and GPU execution are not represented as tested CPU execution coverage.

| Reference wording or older approach | This course's treatment |
| --- | --- |
| `Variable` and `.data[0]` | Current tensors, autograd and `.item()`; no unchecked `.data` mutation |
| Gradients on integer token IDs | Integer IDs index embeddings; floating model parameters carry gradients |
| A CUDA transfer returns a NumPy array | It remains a tensor; use explicit detach/CPU/NumPy conversion and consider shared storage |
| Every non-contiguous tensor rejects `view` | Explain the size/stride constraint; `reshape` may copy and `clone` guarantees independence |
| A Linear layer requires two dimensions | It transforms the last feature axis and supports leading batch/sequence axes |
| Padding requires a custom loss | Explain `ignore_index`, show the equivalent custom calculation and handle all-padding batches |
| TorchText transforms / old IMDb loaders | Explain its discontinued status; use explicit mappings and a maintained optional corpus adapter |
| TorchScript as the new export default | Teach its legacy role, plus current `torch.export` and ONNX parity checks |
| TorchServe as a new service default | Identify its archived repository and compare maintained HTTP/runtime options |
| `torch.quantization.quantize_dynamic` | Historical context, quantization math and an explicitly optional TorchAO recipe |
| Seeds guarantee identical results everywhere | Retain seeds, splits, environment and device details; state reproducibility limits |
| Drift triggers immediate production replacement | Stage and evaluate a candidate, then require the separate release policy |
| Differential privacy makes reconstruction impossible | Explain the mechanism, epsilon/delta accounting and bounded guarantee |

## Reference heading → local lesson {#all-topics}

| Reference section | Read it here |
| --- | --- |
| [Loading text data](https://aman.ai/primers/pytorch/#loading-text-data) | [Text data](text-data.md#loading-text) |
| [Preparing a Batch](https://aman.ai/primers/pytorch/#preparing-a-batch) | [Text data](text-data.md#batching) |
| [Recurrent network model](https://aman.ai/primers/pytorch/#recurrent-network-model) | [Networks](networks.md#token-tagger) |
| [Writing a custom loss function](https://aman.ai/primers/pytorch/#writing-a-custom-loss-function) | [Networks](networks.md#masked-loss) |
| [Selected methods](https://aman.ai/primers/pytorch/#selected-methods) | [Coverage](coverage.md#recipes) |
| [Tensor shape/size](https://aman.ai/primers/pytorch/#tensor-shapesize) | [Tensors](tensors.md#shape-size) |
| [Initialization](https://aman.ai/primers/pytorch/#initialization) | [Tensors](tensors.md#static-normal) |
| [Static](https://aman.ai/primers/pytorch/#static) | [Tensors](tensors.md#static-normal) |
| [Standard normal](https://aman.ai/primers/pytorch/#standard-normal) | [Tensors](tensors.md#static-normal) |
| [Xavier/Glorot](https://aman.ai/primers/pytorch/#xavierglorot) | [Tensors](tensors.md#xavier) |
| [Uniform](https://aman.ai/primers/pytorch/#uniform) | [Tensors](tensors.md#xavier) |
| [Normal](https://aman.ai/primers/pytorch/#normal) | [Tensors](tensors.md#xavier) |
| [Kaiming/He](https://aman.ai/primers/pytorch/#kaiminghe) | [Tensors](tensors.md#kaiming) |
| [Uniform](https://aman.ai/primers/pytorch/#uniform-1) | [Tensors](tensors.md#kaiming) |
| [Normal](https://aman.ai/primers/pytorch/#normal-1) | [Tensors](tensors.md#kaiming) |
| [Send Tensor to GPU](https://aman.ai/primers/pytorch/#send-tensor-to-gpu) | [Tensors](tensors.md#devices-numpy) |
| [Convert to NumPy](https://aman.ai/primers/pytorch/#convert-to-numpy) | [Tensors](tensors.md#devices-numpy) |
| [tensor.item(): Convert Single Value Tensor to Scalar](https://aman.ai/primers/pytorch/#tensoritem-convert-single-value-tensor-to-scalar) | [Tensors](tensors.md#devices-numpy) |
| [tensor.tolist(): Convert Multi Value Tensor to Scalar](https://aman.ai/primers/pytorch/#tensortolist-convert-multi-value-tensor-to-scalar) | [Tensors](tensors.md#devices-numpy) |
| [Len](https://aman.ai/primers/pytorch/#len) | [Tensors](tensors.md#shape-size) |
| [Arange](https://aman.ai/primers/pytorch/#arange) | [Tensors](tensors.md#constructors) |
| [Linspace](https://aman.ai/primers/pytorch/#linspace) | [Tensors](tensors.md#constructors) |
| [View](https://aman.ai/primers/pytorch/#view) | [Shapes](shapes.md#views) |
| [Transpose](https://aman.ai/primers/pytorch/#transpose) | [Shapes](shapes.md#axis-order) |
| [Swapaxes](https://aman.ai/primers/pytorch/#swapaxes) | [Shapes](shapes.md#axis-order) |
| [Permute](https://aman.ai/primers/pytorch/#permute) | [Shapes](shapes.md#axis-order) |
| [Movedim](https://aman.ai/primers/pytorch/#movedim) | [Shapes](shapes.md#axis-order) |
| [Randperm](https://aman.ai/primers/pytorch/#randperm) | [Tensors](tensors.md#constructors) |
| [Where](https://aman.ai/primers/pytorch/#where) | [Shapes](shapes.md#where) |
| [Reshape](https://aman.ai/primers/pytorch/#reshape) | [Shapes](shapes.md#views) |
| [Concatenate](https://aman.ai/primers/pytorch/#concatenate) | [Shapes](shapes.md#concatenate) |
| [Squeeze](https://aman.ai/primers/pytorch/#squeeze) | [Shapes](shapes.md#squeeze) |
| [Unsqueeze](https://aman.ai/primers/pytorch/#unsqueeze) | [Shapes](shapes.md#squeeze) |
| [Print Model Summary](https://aman.ai/primers/pytorch/#print-model-summary) | [Autograd](autograd.md#summary) |
| [Keepdim (Keeping Reduced Dimensions)](https://aman.ai/primers/pytorch/#keepdim-keeping-reduced-dimensions) | [Shapes](shapes.md#keepdim) |
| [Basic Syntax](https://aman.ai/primers/pytorch/#basic-syntax) | [Shapes](shapes.md#keepdim) |
| [Example 1: Sum With and Without keepdim](https://aman.ai/primers/pytorch/#example-1-sum-with-and-without-keepdim) | [Shapes](shapes.md#keepdim) |
| [Example 2: Mean and Broadcasting](https://aman.ai/primers/pytorch/#example-2-mean-and-broadcasting) | [Shapes](shapes.md#keepdim) |
| [Example 3: Max Values and Indices](https://aman.ai/primers/pytorch/#example-3-max-values-and-indices) | [Shapes](shapes.md#keepdim) |
| [Example 4: keepdim vs. unsqueeze](https://aman.ai/primers/pytorch/#example-4-keepdim-vs-unsqueeze) | [Shapes](shapes.md#keepdim) |
| [End-to-End Data to Model Pipeline](https://aman.ai/primers/pytorch/#end-to-end-data-to-model-pipeline) | [Getting started](getting-started.md#workflow) |
| [Data Pre-processing](https://aman.ai/primers/pytorch/#data-pre-processing) | [Datasets](datasets.md#modalities) |
| [Overview](https://aman.ai/primers/pytorch/#overview) | [Datasets](datasets.md#modalities) |
| [Key Abstractions for Pre-processing](https://aman.ai/primers/pytorch/#key-abstractions-for-pre-processing) | [Datasets](datasets.md#modalities) |
| [torch.utils.data.Dataset](https://aman.ai/primers/pytorch/#torchutilsdatadataset) | [Datasets](datasets.md#dataset-loader) |
| [torchtext.transforms](https://aman.ai/primers/pytorch/#torchtexttransforms) | [Datasets](datasets.md#modalities) |
| [torchvision.transforms](https://aman.ai/primers/pytorch/#torchvisiontransforms) | [Vision data](vision-data.md#loading) |
| [torchaudio.transforms](https://aman.ai/primers/pytorch/#torchaudiotransforms) | [Audio data](audio-data.md#loading) |
| [torch.utils.data.DataLoader](https://aman.ai/primers/pytorch/#torchutilsdatadataloader) | [Datasets](datasets.md#dataset-loader) |
| [Pre-processing for Vision Data](https://aman.ai/primers/pytorch/#pre-processing-for-vision-data) | [Vision data](vision-data.md#loading) |
| [Loading and Cleaning](https://aman.ai/primers/pytorch/#loading-and-cleaning) | [Vision data](vision-data.md#loading) |
| [Normalization](https://aman.ai/primers/pytorch/#normalization) | [Vision data](vision-data.md#normalization) |
| [Data Augmentation](https://aman.ai/primers/pytorch/#data-augmentation) | [Vision data](vision-data.md#augmentation) |
| [Conversion to Tensor](https://aman.ai/primers/pytorch/#conversion-to-tensor) | [Vision data](vision-data.md#normalization) |
| [Pre-processing for Text Data](https://aman.ai/primers/pytorch/#pre-processing-for-text-data) | [Text data](text-data.md#vocabulary) |
| [Tokenization](https://aman.ai/primers/pytorch/#tokenization) | [Text data](text-data.md#vocabulary) |
| [Vocabulary Building](https://aman.ai/primers/pytorch/#vocabulary-building) | [Text data](text-data.md#vocabulary) |
| [Handling Variable-Length Sequences](https://aman.ai/primers/pytorch/#handling-variable-length-sequences) | [Text data](text-data.md#batching) |
| [Embedding Lookup](https://aman.ai/primers/pytorch/#embedding-lookup) | [Text data](text-data.md#embedding-masking) |
| [Masking](https://aman.ai/primers/pytorch/#masking) | [Text data](text-data.md#embedding-masking) |
| [Pre-processing for Audio Data](https://aman.ai/primers/pytorch/#pre-processing-for-audio-data) | [Audio data](audio-data.md#loading) |
| [Loading and Cleaning](https://aman.ai/primers/pytorch/#loading-and-cleaning-1) | [Audio data](audio-data.md#loading) |
| [Normalization (Standardization)](https://aman.ai/primers/pytorch/#normalization-standardization) | [Audio data](audio-data.md#normalization) |
| [Feature Extraction](https://aman.ai/primers/pytorch/#feature-extraction) | [Audio data](audio-data.md#features) |
| [Data Augmentation](https://aman.ai/primers/pytorch/#data-augmentation-1) | [Audio data](audio-data.md#augmentation) |
| [Conversion to Tensor and Batching](https://aman.ai/primers/pytorch/#conversion-to-tensor-and-batching) | [Audio data](audio-data.md#batching-models) |
| [Integration with Models](https://aman.ai/primers/pytorch/#integration-with-models) | [Audio data](audio-data.md#batching-models) |
| [Data Quality Checks](https://aman.ai/primers/pytorch/#data-quality-checks) | [Datasets](datasets.md#quality) |
| [Tabular Summary](https://aman.ai/primers/pytorch/#tabular-summary) | [Datasets](datasets.md#modalities) |
| [FAQs](https://aman.ai/primers/pytorch/#faqs) | [Datasets](datasets.md#quality) |
| [References and Further Reading](https://aman.ai/primers/pytorch/#references-and-further-reading) | [Coverage](coverage.md#sources) |
| [Practical Implementation – Data Pre-processing](https://aman.ai/primers/pytorch/#practical-implementation--data-pre-processing) | [Datasets](datasets.md#modalities) |
| [NLP Data Pre-processing – Text Classification Example](https://aman.ai/primers/pytorch/#nlp-data-pre-processing--text-classification-example) | [Text data](text-data.md#batching) |
| [Vision Data Pre-processing – CIFAR-10 Example](https://aman.ai/primers/pytorch/#vision-data-pre-processing--cifar-10-example) | [Vision data](vision-data.md#cifar10) |
| [FAQs](https://aman.ai/primers/pytorch/#faqs-1) | [Datasets](datasets.md#quality) |
| [Model Training/Fine-tuning and Evaluation Workflow](https://aman.ai/primers/pytorch/#model-trainingfine-tuning-and-evaluation-workflow) | [Training](training.md#components) |
| [Overview](https://aman.ai/primers/pytorch/#overview-1) | [Training](training.md#components) |
| [Core Components of a Training Workflow](https://aman.ai/primers/pytorch/#core-components-of-a-training-workflow) | [Training](training.md#components) |
| [Example: NLP Model Training Workflow](https://aman.ai/primers/pytorch/#example-nlp-model-training-workflow) | [Text project](text-project.md#train-evaluate) |
| [Example: Vision Classification Training Loop](https://aman.ai/primers/pytorch/#example-vision-classification-training-loop) | [Training](training.md#train-loop) |
| [LoRA (Low-Rank Adaptation) Fine-Tuning](https://aman.ai/primers/pytorch/#lora-low-rank-adaptation-fine-tuning) | [Fine tuning](fine-tuning.md#lora) |
| [Example: LoRA Fine-Tuning in PyTorch](https://aman.ai/primers/pytorch/#example-lora-fine-tuning-in-pytorch) | [Fine tuning](fine-tuning.md#lora) |
| [Evaluation and Metrics](https://aman.ai/primers/pytorch/#evaluation-and-metrics) | [Evaluation](evaluation.md#classification) |
| [Classification Metrics](https://aman.ai/primers/pytorch/#classification-metrics) | [Evaluation](evaluation.md#classification) |
| [Early Stopping and Checkpointing](https://aman.ai/primers/pytorch/#early-stopping-and-checkpointing) | [Training](training.md#early-stopping) |
| [Reproducibility Techniques](https://aman.ai/primers/pytorch/#reproducibility-techniques) | [Training](training.md#reproducibility-logging) |
| [Logging and Monitoring](https://aman.ai/primers/pytorch/#logging-and-monitoring) | [Training](training.md#reproducibility-logging) |
| [FAQs](https://aman.ai/primers/pytorch/#faqs-2) | [Training](training.md#validation) |
| [Practical Implementation – Model Training/Fine-tuning and Evaluation Workflow](https://aman.ai/primers/pytorch/#practical-implementation--model-trainingfine-tuning-and-evaluation-workflow) | [Training](training.md#components) |
| [Example 1: Vision Use-Case (Image Classification on CIFAR-10)](https://aman.ai/primers/pytorch/#example-1-vision-use-case-image-classification-on-cifar-10) | [Vision project](vision-project.md#train) |
| [Step 1: Setup and Data Loading](https://aman.ai/primers/pytorch/#step-1-setup-and-data-loading) | [Vision data](vision-data.md#cifar10) |
| [Step 2: Define the Model](https://aman.ai/primers/pytorch/#step-2-define-the-model) | [Vision project](vision-project.md#model) |
| [Step 3: Training and Evaluation Loops](https://aman.ai/primers/pytorch/#step-3-training-and-evaluation-loops) | [Vision project](vision-project.md#train) |
| [Step 4: Run Training](https://aman.ai/primers/pytorch/#step-4-run-training) | [Vision project](vision-project.md#train) |
| [Example 2: NLP Use-Case (Sentiment Classification on IMDb Dataset)](https://aman.ai/primers/pytorch/#example-2-nlp-use-case-sentiment-classification-on-imdb-dataset) | [Text project](text-project.md#train-evaluate) |
| [Step 1: Data Preparation](https://aman.ai/primers/pytorch/#step-1-data-preparation) | [Text project](text-project.md#data) |
| [Step 2: Define the LSTM Model](https://aman.ai/primers/pytorch/#step-2-define-the-lstm-model) | [Text project](text-project.md#model) |
| [Step 3: Training and Validation Loop](https://aman.ai/primers/pytorch/#step-3-training-and-validation-loop) | [Text project](text-project.md#train-evaluate) |
| [Step 4: Run Training](https://aman.ai/primers/pytorch/#step-4-run-training-1) | [Text project](text-project.md#train-evaluate) |
| [End Result](https://aman.ai/primers/pytorch/#end-result) | [Text project](text-project.md#train-evaluate) |
| [Model Experimentation and Hyperparameter Tuning](https://aman.ai/primers/pytorch/#model-experimentation-and-hyperparameter-tuning) | [Experiments](experiments.md#principles) |
| [Overview](https://aman.ai/primers/pytorch/#overview-2) | [Experiments](experiments.md#principles) |
| [Core Principles of Experimentation](https://aman.ai/primers/pytorch/#core-principles-of-experimentation) | [Experiments](experiments.md#principles) |
| [Isolate One Variable at a Time](https://aman.ai/primers/pytorch/#isolate-one-variable-at-a-time) | [Experiments](experiments.md#principles) |
| [Track Every Experiment](https://aman.ai/primers/pytorch/#track-every-experiment) | [Experiments](experiments.md#principles) |
| [Automate Where Possible](https://aman.ai/primers/pytorch/#automate-where-possible) | [Experiments](experiments.md#principles) |
| [Example: Manual Hyperparameter Tuning Loop](https://aman.ai/primers/pytorch/#example-manual-hyperparameter-tuning-loop) | [Experiments](experiments.md#grid-search) |
| [Example: Automated Tuning with Optuna](https://aman.ai/primers/pytorch/#example-automated-tuning-with-optuna) | [Experiments](experiments.md#optuna) |
| [Configuration Management with Hydra](https://aman.ai/primers/pytorch/#configuration-management-with-hydra) | [Experiments](experiments.md#hydra) |
| [Experiment Tracking with Weights & Biases](https://aman.ai/primers/pytorch/#experiment-tracking-with-weights--biases) | [Experiments](experiments.md#logging) |
| [Visualization of Hyperparameter Results](https://aman.ai/primers/pytorch/#visualization-of-hyperparameter-results) | [Experiments](experiments.md#visualization) |
| [Reproducibility and Randomness Control](https://aman.ai/primers/pytorch/#reproducibility-and-randomness-control) | [Experiments](experiments.md#visualization) |
| [FAQs](https://aman.ai/primers/pytorch/#faqs-3) | [Experiments](experiments.md#principles) |
| [Practical Implementation – Model Experimentation and Hyperparameter Tuning](https://aman.ai/primers/pytorch/#practical-implementation--model-experimentation-and-hyperparameter-tuning) | [Experiments](experiments.md#trial) |
| [Example 1: Vision Use-Case (CIFAR-10 CNN Hyperparameter Tuning)](https://aman.ai/primers/pytorch/#example-1-vision-use-case-cifar-10-cnn-hyperparameter-tuning) | [Experiments](experiments.md#trial) |
| [Step 1: Setup Experiment Function](https://aman.ai/primers/pytorch/#step-1-setup-experiment-function) | [Experiments](experiments.md#trial) |
| [Step 2: Experiment Function](https://aman.ai/primers/pytorch/#step-2-experiment-function) | [Experiments](experiments.md#trial) |
| [Step 3: Grid Search](https://aman.ai/primers/pytorch/#step-3-grid-search) | [Experiments](experiments.md#grid-search) |
| [Step 4: Visualizing Results](https://aman.ai/primers/pytorch/#step-4-visualizing-results) | [Experiments](experiments.md#visualization) |
| [Example 2: NLP Use-Case (IMDb Sentiment Classification Tuning)](https://aman.ai/primers/pytorch/#example-2-nlp-use-case-imdb-sentiment-classification-tuning) | [Experiments](experiments.md#optuna) |
| [Step 1: Setup Study Environment](https://aman.ai/primers/pytorch/#step-1-setup-study-environment) | [Experiments](experiments.md#optuna) |
| [Step 2: Run the Optimization](https://aman.ai/primers/pytorch/#step-2-run-the-optimization) | [Experiments](experiments.md#optuna) |
| [Step 3: Track Experiments with Weights & Biases (Optional)](https://aman.ai/primers/pytorch/#step-3-track-experiments-with-weights--biases-optional) | [Experiments](experiments.md#logging) |
| [Summary of Both Pipelines](https://aman.ai/primers/pytorch/#summary-of-both-pipelines) | [Experiments](experiments.md#visualization) |
| [Key Takeaways](https://aman.ai/primers/pytorch/#key-takeaways) | [Experiments](experiments.md#visualization) |
| [Model Evaluation, Benchmarking, and Reporting](https://aman.ai/primers/pytorch/#model-evaluation-benchmarking-and-reporting) | [Evaluation](evaluation.md#protocol) |
| [Overview](https://aman.ai/primers/pytorch/#overview-3) | [Evaluation](evaluation.md#protocol) |
| [Dataset Splitting and Evaluation Protocols](https://aman.ai/primers/pytorch/#dataset-splitting-and-evaluation-protocols) | [Evaluation](evaluation.md#protocol) |
| [Standard Split](https://aman.ai/primers/pytorch/#standard-split) | [Evaluation](evaluation.md#protocol) |
| [Cross-Validation](https://aman.ai/primers/pytorch/#cross-validation) | [Evaluation](evaluation.md#protocol) |
| [Stratified Sampling](https://aman.ai/primers/pytorch/#stratified-sampling) | [Evaluation](evaluation.md#protocol) |
| [Quantitative Evaluation Metrics](https://aman.ai/primers/pytorch/#quantitative-evaluation-metrics) | [Evaluation](evaluation.md#classification) |
| [Classification Metrics](https://aman.ai/primers/pytorch/#classification-metrics-1) | [Evaluation](evaluation.md#classification) |
| [Regression Metrics](https://aman.ai/primers/pytorch/#regression-metrics) | [Evaluation](evaluation.md#regression-generation) |
| [NLP and Generation Metrics](https://aman.ai/primers/pytorch/#nlp-and-generation-metrics) | [Evaluation](evaluation.md#regression-generation) |
| [Practical Evaluation Code Example](https://aman.ai/primers/pytorch/#practical-evaluation-code-example) | [Evaluation](evaluation.md#prediction-loop) |
| [Classification Example (Vision or NLP)](https://aman.ai/primers/pytorch/#classification-example-vision-or-nlp) | [Evaluation](evaluation.md#prediction-loop) |
| [Benchmarking Across Models](https://aman.ai/primers/pytorch/#benchmarking-across-models) | [Evaluation](evaluation.md#uncertainty) |
| [Example](https://aman.ai/primers/pytorch/#example) | [Evaluation](evaluation.md#uncertainty) |
| [Qualitative Evaluation and Error Analysis](https://aman.ai/primers/pytorch/#qualitative-evaluation-and-error-analysis) | [Evaluation](evaluation.md#error-analysis) |
| [Error Bucketing](https://aman.ai/primers/pytorch/#error-bucketing) | [Evaluation](evaluation.md#error-analysis) |
| [Visualization for Vision Models](https://aman.ai/primers/pytorch/#visualization-for-vision-models) | [Evaluation](evaluation.md#error-analysis) |
| [Visualization for Text Models](https://aman.ai/primers/pytorch/#visualization-for-text-models) | [Evaluation](evaluation.md#error-analysis) |
| [Reporting and Documentation](https://aman.ai/primers/pytorch/#reporting-and-documentation) | [Evaluation](evaluation.md#reporting) |
| [Statistical Significance Testing](https://aman.ai/primers/pytorch/#statistical-significance-testing) | [Evaluation](evaluation.md#uncertainty) |
| [FAQs](https://aman.ai/primers/pytorch/#faqs-4) | [Evaluation](evaluation.md#reporting) |
| [Practical Implementation – Model Evaluation, Benchmarking, and Reporting](https://aman.ai/primers/pytorch/#practical-implementation--model-evaluation-benchmarking-and-reporting) | [Evaluation](evaluation.md#prediction-loop) |
| [Example 1: Vision Use-Case (Evaluating CIFAR-10 CNN)](https://aman.ai/primers/pytorch/#example-1-vision-use-case-evaluating-cifar-10-cnn) | [Vision project](vision-project.md#evaluate) |
| [Step 1: Load Model and Prepare Test Data](https://aman.ai/primers/pytorch/#step-1-load-model-and-prepare-test-data) | [Vision project](vision-project.md#evaluate) |
| [Step 2: Generate Predictions and Compute Metrics](https://aman.ai/primers/pytorch/#step-2-generate-predictions-and-compute-metrics) | [Vision project](vision-project.md#evaluate) |
| [Step 3: Visualize Confusion Matrix](https://aman.ai/primers/pytorch/#step-3-visualize-confusion-matrix) | [Evaluation](evaluation.md#error-analysis) |
| [Step 4: Benchmark Report Across Model Variants](https://aman.ai/primers/pytorch/#step-4-benchmark-report-across-model-variants) | [Evaluation](evaluation.md#reporting) |
| [Example 2: NLP Use-Case (Evaluating IMDb Sentiment Model)](https://aman.ai/primers/pytorch/#example-2-nlp-use-case-evaluating-imdb-sentiment-model) | [Text project](text-project.md#run) |
| [Step 1: Load Model and Prepare Test Loader](https://aman.ai/primers/pytorch/#step-1-load-model-and-prepare-test-loader) | [Text project](text-project.md#run) |
| [Step 2: Compute Predictions and Metrics](https://aman.ai/primers/pytorch/#step-2-compute-predictions-and-metrics) | [Text project](text-project.md#run) |
| [Step 3: Inspect Misclassified Examples](https://aman.ai/primers/pytorch/#step-3-inspect-misclassified-examples) | [Evaluation](evaluation.md#error-analysis) |
| [Step 4: Report Comparison Across Experiments](https://aman.ai/primers/pytorch/#step-4-report-comparison-across-experiments) | [Evaluation](evaluation.md#reporting) |
| [Summary of the Evaluation Workflow](https://aman.ai/primers/pytorch/#summary-of-the-evaluation-workflow) | [Evaluation](evaluation.md#reporting) |
| [Key Takeaways](https://aman.ai/primers/pytorch/#key-takeaways-1) | [Evaluation](evaluation.md#reporting) |
| [Model Deployment, Monitoring, and Continuous Evaluation](https://aman.ai/primers/pytorch/#model-deployment-monitoring-and-continuous-evaluation) | [Monitoring](monitoring.md#metrics) |
| [Overview](https://aman.ai/primers/pytorch/#overview-4) | [Monitoring](monitoring.md#metrics) |
| [Deployment Modes](https://aman.ai/primers/pytorch/#deployment-modes) | [Exporting](exporting.md#deployment-modes) |
| [Model Serialization and Export](https://aman.ai/primers/pytorch/#model-serialization-and-export) | [Exporting](exporting.md#state-dictionary) |
| [TorchScript Export](https://aman.ai/primers/pytorch/#torchscript-export) | [Exporting](exporting.md#torchscript) |
| [ONNX Export](https://aman.ai/primers/pytorch/#onnx-export) | [Exporting](exporting.md#onnx) |
| [Serving Infrastructure](https://aman.ai/primers/pytorch/#serving-infrastructure) | [Serving](serving.md#infrastructure) |
| [Option 1: TorchServe](https://aman.ai/primers/pytorch/#option-1-torchserve) | [Serving](serving.md#infrastructure) |
| [Option 2: FastAPI or Flask](https://aman.ai/primers/pytorch/#option-2-fastapi-or-flask) | [Serving](serving.md#fastapi) |
| [Option 3: Cloud Deployments](https://aman.ai/primers/pytorch/#option-3-cloud-deployments) | [Serving](serving.md#infrastructure) |
| [Inference Optimization](https://aman.ai/primers/pytorch/#inference-optimization) | [Optimization](optimization.md#benchmarking) |
| [Quantization](https://aman.ai/primers/pytorch/#quantization) | [Optimization](optimization.md#quantization) |
| [Pruning](https://aman.ai/primers/pytorch/#pruning) | [Optimization](optimization.md#pruning) |
| [Batch Inference and Caching](https://aman.ai/primers/pytorch/#batch-inference-and-caching) | [Optimization](optimization.md#batch-cache) |
| [Continuous Monitoring and Feedback Loops](https://aman.ai/primers/pytorch/#continuous-monitoring-and-feedback-loops) | [Monitoring](monitoring.md#metrics) |
| [System Metrics](https://aman.ai/primers/pytorch/#system-metrics) | [Monitoring](monitoring.md#metrics) |
| [Model Metrics](https://aman.ai/primers/pytorch/#model-metrics) | [Monitoring](monitoring.md#drift) |
| [Example: Drift Detection](https://aman.ai/primers/pytorch/#example-drift-detection) | [Monitoring](monitoring.md#drift) |
| [Model Versioning and Retraining](https://aman.ai/primers/pytorch/#model-versioning-and-retraining) | [Monitoring](monitoring.md#versioning) |
| [Version Control](https://aman.ai/primers/pytorch/#version-control) | [Monitoring](monitoring.md#versioning) |
| [Retraining Workflow](https://aman.ai/primers/pytorch/#retraining-workflow) | [Monitoring](monitoring.md#retraining) |
| [Continuous Evaluation](https://aman.ai/primers/pytorch/#continuous-evaluation) | [Monitoring](monitoring.md#rollouts) |
| [Shadow Mode](https://aman.ai/primers/pytorch/#shadow-mode) | [Monitoring](monitoring.md#rollouts) |
| [A/B Testing](https://aman.ai/primers/pytorch/#ab-testing) | [Monitoring](monitoring.md#rollouts) |
| [Feedback Integration](https://aman.ai/primers/pytorch/#feedback-integration) | [Monitoring](monitoring.md#feedback) |
| [Logging and Observability](https://aman.ai/primers/pytorch/#logging-and-observability) | [Monitoring](monitoring.md#metrics) |
| [Deployment Safety and Compliance](https://aman.ai/primers/pytorch/#deployment-safety-and-compliance) | [Monitoring](monitoring.md#responsibility) |
| [FAQs](https://aman.ai/primers/pytorch/#faqs-5) | [Monitoring](monitoring.md#responsibility) |
| [Practical Implementation – Model Deployment, Monitoring, and Continuous Evaluation](https://aman.ai/primers/pytorch/#practical-implementation--model-deployment-monitoring-and-continuous-evaluation) | [Serving](serving.md#operations) |
| [Example 1: Vision Use-Case (Deploying CIFAR-10 CNN as an API)](https://aman.ai/primers/pytorch/#example-1-vision-use-case-deploying-cifar-10-cnn-as-an-api) | [Vision project](vision-project.md#serve) |
| [Step 1: Export the Trained Model](https://aman.ai/primers/pytorch/#step-1-export-the-trained-model) | [Vision project](vision-project.md#serve) |
| [Step 2: Create a FastAPI Inference Server](https://aman.ai/primers/pytorch/#step-2-create-a-fastapi-inference-server) | [Vision project](vision-project.md#serve) |
| [Step 3: Add Basic Monitoring (Latency & Drift Tracking)](https://aman.ai/primers/pytorch/#step-3-add-basic-monitoring-latency--drift-tracking) | [Monitoring](monitoring.md#metrics) |
| [Step 4: Automate Retraining via Drift Detection](https://aman.ai/primers/pytorch/#step-4-automate-retraining-via-drift-detection) | [Monitoring](monitoring.md#retraining) |
| [Example 2: NLP Use-Case (Deploying IMDb Sentiment Classifier)](https://aman.ai/primers/pytorch/#example-2-nlp-use-case-deploying-imdb-sentiment-classifier) | [Text project](text-project.md#serve) |
| [Step 1: Prepare Model for Inference](https://aman.ai/primers/pytorch/#step-1-prepare-model-for-inference) | [Text project](text-project.md#serve) |
| [Step 2: Define API for Sentiment Prediction](https://aman.ai/primers/pytorch/#step-2-define-api-for-sentiment-prediction) | [Text project](text-project.md#serve) |
| [Step 3: Confidence Drift Monitoring](https://aman.ai/primers/pytorch/#step-3-confidence-drift-monitoring) | [Monitoring](monitoring.md#drift) |
| [Step 4: Continuous Evaluation via Feedback Integration](https://aman.ai/primers/pytorch/#step-4-continuous-evaluation-via-feedback-integration) | [Monitoring](monitoring.md#feedback) |
| [Summary of the Deployment and Monitoring Workflow](https://aman.ai/primers/pytorch/#summary-of-the-deployment-and-monitoring-workflow) | [Serving](serving.md#operations) |
| [Key Takeaways](https://aman.ai/primers/pytorch/#key-takeaways-2) | [Serving](serving.md#operations) |
| [Practical Implementation – End-to-End Example: From Data to Deployment](https://aman.ai/primers/pytorch/#practical-implementation--end-to-end-example-from-data-to-deployment) | [Vision project](vision-project.md#structure) |
| [Example 1: End-to-End Vision Pipeline (CIFAR-10 CNN)](https://aman.ai/primers/pytorch/#example-1-end-to-end-vision-pipeline-cifar-10-cnn) | [Vision project](vision-project.md#structure) |
| [Step 1: Project Structure](https://aman.ai/primers/pytorch/#step-1-project-structure) | [Vision project](vision-project.md#structure) |
| [Step 2: Data Preparation (utils.py)](https://aman.ai/primers/pytorch/#step-2-data-preparation-utilspy) | [Vision project](vision-project.md#data) |
| [Step 3: Model Definition (models/cnn_model.py)](https://aman.ai/primers/pytorch/#step-3-model-definition-modelscnn_modelpy) | [Vision project](vision-project.md#model) |
| [Step 4: Training Script (train.py)](https://aman.ai/primers/pytorch/#step-4-training-script-trainpy) | [Vision project](vision-project.md#train) |
| [Step 5: Evaluation Script (evaluate.py)](https://aman.ai/primers/pytorch/#step-5-evaluation-script-evaluatepy) | [Vision project](vision-project.md#evaluate) |
| [Step 6: Deployment API (serve.py)](https://aman.ai/primers/pytorch/#step-6-deployment-api-servepy) | [Vision project](vision-project.md#serve) |
| [Pipeline Summary](https://aman.ai/primers/pytorch/#pipeline-summary) | [Vision project](vision-project.md#cifar-workflow) |
| [Key Takeaways](https://aman.ai/primers/pytorch/#key-takeaways-3) | [Vision project](vision-project.md#cifar-workflow) |
| [Example 1: End-to-End NLP Pipeline (IMDb Sentiment Analysis)](https://aman.ai/primers/pytorch/#example-1-end-to-end-nlp-pipeline-imdb-sentiment-analysis) | [Text project](text-project.md#structure) |
| [Step 1: Data Preparation](https://aman.ai/primers/pytorch/#step-1-data-preparation-1) | [Text project](text-project.md#data) |
| [Step 2: Model Definition](https://aman.ai/primers/pytorch/#step-2-model-definition) | [Text project](text-project.md#model) |
| [Step 3: Train and Evaluate](https://aman.ai/primers/pytorch/#step-3-train-and-evaluate) | [Text project](text-project.md#train-evaluate) |
| [Step 4: Deploy as Text API](https://aman.ai/primers/pytorch/#step-4-deploy-as-text-api) | [Text project](text-project.md#serve) |
| [End-to-End Orchestration with Prefect or Airflow](https://aman.ai/primers/pytorch/#end-to-end-orchestration-with-prefect-or-airflow) | [Orchestration](orchestration.md#overview) |
| [Comparison: Prefect vs. Airflow](https://aman.ai/primers/pytorch/#comparison-prefect-vs-airflow) | [Orchestration](orchestration.md#overview) |
| [Orchestrating a Vision (CIFAR-10 Image Classification) Pipeline with Prefect or Airflow](https://aman.ai/primers/pytorch/#orchestrating-a-vision-cifar-10-image-classification-pipeline-with-prefect-or-airflow) | [Orchestration](orchestration.md#tasks) |
| [Prefect](https://aman.ai/primers/pytorch/#prefect) | [Orchestration](orchestration.md#prefect) |
| [Step 1: Install Dependencies](https://aman.ai/primers/pytorch/#step-1-install-dependencies) | [Orchestration](orchestration.md#prefect) |
| [Step 2: Define Pipeline Script (vision_pipeline.py)](https://aman.ai/primers/pytorch/#step-2-define-pipeline-script-vision_pipelinepy) | [Orchestration](orchestration.md#prefect) |
| [Step 3: Run the Flow](https://aman.ai/primers/pytorch/#step-3-run-the-flow) | [Orchestration](orchestration.md#prefect-scheduling) |
| [Step 4: Schedule and Automate](https://aman.ai/primers/pytorch/#step-4-schedule-and-automate) | [Orchestration](orchestration.md#prefect-scheduling) |
| [Step 5: Optional Integrations](https://aman.ai/primers/pytorch/#step-5-optional-integrations) | [Orchestration](orchestration.md#prefect-scheduling) |
| [Summary of the Vision Prefect Pipeline](https://aman.ai/primers/pytorch/#summary-of-the-vision-prefect-pipeline) | [Orchestration](orchestration.md#prefect-scheduling) |
| [Key Takeaways](https://aman.ai/primers/pytorch/#key-takeaways-4) | [Orchestration](orchestration.md#prefect-scheduling) |
| [Airflow](https://aman.ai/primers/pytorch/#airflow) | [Orchestration](orchestration.md#airflow) |
| [Airflow Setup](https://aman.ai/primers/pytorch/#airflow-setup) | [Orchestration](orchestration.md#airflow) |
| [Define the Airflow DAG](https://aman.ai/primers/pytorch/#define-the-airflow-dag) | [Orchestration](orchestration.md#airflow) |
| [How It Works](https://aman.ai/primers/pytorch/#how-it-works) | [Orchestration](orchestration.md#airflow-operation) |
| [Orchestrating an NLP (Sentiment Prediction) Pipeline with Prefect or Airflow](https://aman.ai/primers/pytorch/#orchestrating-an-nlp-sentiment-prediction-pipeline-with-prefect-or-airflow) | [Orchestration](orchestration.md#tasks) |
| [Prefect](https://aman.ai/primers/pytorch/#prefect-1) | [Orchestration](orchestration.md#prefect) |
| [Step 1: Install Dependencies](https://aman.ai/primers/pytorch/#step-1-install-dependencies-1) | [Orchestration](orchestration.md#prefect) |
| [Step 2: Define Pipeline Script (nlp_pipeline.py)](https://aman.ai/primers/pytorch/#step-2-define-pipeline-script-nlp_pipelinepy) | [Orchestration](orchestration.md#prefect) |
| [Step 3: Run the Flow](https://aman.ai/primers/pytorch/#step-3-run-the-flow-1) | [Orchestration](orchestration.md#prefect-scheduling) |
| [Step 4: Schedule and Automate](https://aman.ai/primers/pytorch/#step-4-schedule-and-automate-1) | [Orchestration](orchestration.md#prefect-scheduling) |
| [Step 5: Optional Integrations](https://aman.ai/primers/pytorch/#step-5-optional-integrations-1) | [Orchestration](orchestration.md#prefect-scheduling) |
| [Summary of the NLP Prefect Pipeline](https://aman.ai/primers/pytorch/#summary-of-the-nlp-prefect-pipeline) | [Orchestration](orchestration.md#prefect-scheduling) |
| [Key Takeaways](https://aman.ai/primers/pytorch/#key-takeaways-5) | [Orchestration](orchestration.md#prefect-scheduling) |
| [Airflow](https://aman.ai/primers/pytorch/#airflow-1) | [Orchestration](orchestration.md#airflow) |
| [Airflow Setup](https://aman.ai/primers/pytorch/#airflow-setup-1) | [Orchestration](orchestration.md#airflow) |
| [Define the Airflow DAG](https://aman.ai/primers/pytorch/#define-the-airflow-dag-1) | [Orchestration](orchestration.md#airflow) |
| [How It Works](https://aman.ai/primers/pytorch/#how-it-works-1) | [Orchestration](orchestration.md#airflow-operation) |
| [References](https://aman.ai/primers/pytorch/#references) | [Coverage](coverage.md#sources) |
| [Model Training and Evaluation](https://aman.ai/primers/pytorch/#model-training-and-evaluation) | [Coverage](coverage.md#sources) |
| [Hyperparameter Tuning](https://aman.ai/primers/pytorch/#hyperparameter-tuning) | [Coverage](coverage.md#sources) |
| [Model Evaluation and Benchmarking](https://aman.ai/primers/pytorch/#model-evaluation-and-benchmarking) | [Coverage](coverage.md#sources) |
| [Model Deployment](https://aman.ai/primers/pytorch/#model-deployment) | [Coverage](coverage.md#sources) |
| [Monitoring and Continuous Evaluation](https://aman.ai/primers/pytorch/#monitoring-and-continuous-evaluation) | [Coverage](coverage.md#sources) |
| [Continuous Integration and Orchestration](https://aman.ai/primers/pytorch/#continuous-integration-and-orchestration) | [Coverage](coverage.md#sources) |
| [Advanced Topics](https://aman.ai/primers/pytorch/#advanced-topics) | [Coverage](coverage.md#sources) |
| [Citation](https://aman.ai/primers/pytorch/#citation) | [Coverage](coverage.md#sources) |

## Selected recipes by task {#recipes}

- **Tensors:** [shape, dtype and initialization](tensors.md), [views/axes/keepdim](shapes.md), [autograd and model summaries](autograd.md).
- **Preprocessing:** [Dataset/DataLoader](datasets.md), [vision and CIFAR-10](vision-data.md), [text and tagging](text-data.md), [waveforms and audio features](audio-data.md).
- **Training:** [CNN/LSTM and custom masked loss](networks.md), [training, validation and checkpoints](training.md), [LoRA](fine-tuning.md), [experiments and logging](experiments.md).
- **Evaluation:** [classification, regression and generation](evaluation.md#classification), [uncertainty and benchmarks](evaluation.md#uncertainty).
- **Inference:** [export formats and runtime parity](exporting.md), [FastAPI serving](serving.md), [quantization, pruning and batching](optimization.md), [drift and controlled releases](monitoring.md).
- **Complete workflows:** [vision project](vision-project.md), [text project](text-project.md), [Prefect and Airflow](orchestration.md).

## Sources and further reading {#sources}

- Aman Chadha, **PyTorch primer**, Distilled AI / Aman.ai: [the supplied reference](https://aman.ai/primers/pytorch/), accessed 14 November 2026. Its outline and nested topics form this course's coverage checklist. The primer credits Stanford CS230 material and the official PyTorch tutorials among its sources.
- [PyTorch documentation](https://docs.pytorch.org/docs/stable/index.html), [autograd mechanics](https://docs.pytorch.org/docs/stable/notes/autograd.html), [torch.export](https://docs.pytorch.org/docs/stable/export.html), [ONNX export](https://docs.pytorch.org/docs/stable/onnx.html), [torchvision](https://docs.pytorch.org/vision/stable/index.html) and [torchaudio](https://docs.pytorch.org/audio/stable/index.html) for library behavior.
- The official [character-level RNN name-generation tutorial](https://docs.pytorch.org/tutorials/intermediate/char_rnn_generation_tutorial.html) and [sequence-to-sequence translation tutorial](https://docs.pytorch.org/tutorials/intermediate/seq2seq_translation_tutorial.html) extend the recurrent-model concepts to generation tasks, as suggested by the reference's reading list.
- [TorchText status](https://docs.pytorch.org/text/stable/index.html), [TorchScript status](https://docs.pytorch.org/docs/stable/jit.html) and [archived TorchServe repository](https://github.com/pytorch/serve) for older reference context.
- [Optuna](https://optuna.readthedocs.io/), [Hydra](https://hydra.cc/docs/intro/), [TensorBoard](https://www.tensorflow.org/tensorboard), [W&B](https://docs.wandb.ai/), [scikit-learn metrics](https://scikit-learn.org/stable/api/sklearn.metrics.html) and [TorchMetrics](https://lightning.ai/docs/torchmetrics/stable/) for experiments and evaluation.
- [ONNX Runtime](https://onnxruntime.ai/docs/), [FastAPI](https://fastapi.tiangolo.com/), [TorchAO](https://docs.pytorch.org/ao/stable/), [Prefect 3](https://docs.prefect.io/v3/get-started) and [Airflow 3](https://airflow.apache.org/docs/apache-airflow/stable/) for runtime-specific integration recipes.
- [Opacus](https://opacus.ai/), [SHAP](https://shap.readthedocs.io/), [LIME](https://github.com/marcotcr/lime), [MLflow](https://mlflow.org/docs/latest/) and [Prometheus](https://prometheus.io/docs/introduction/overview/) for further privacy, attribution, artifact and monitoring study.

To cite this independent course, identify BuildMyX Learn and the lesson used. To cite the supplied primer, identify Aman Chadha, its title and URL, and your access date. These are separate works; no affiliation or endorsement is implied.
