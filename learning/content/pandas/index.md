---
title: Pandas, from raw tables to useful answers
description: Learn pandas through fifteen practical chapters covering the complete supplied primer, with tested examples, exercises, a sample dataset and a topic coverage index.
course: Pandas
---

<div class="lesson-eyebrow">BUILDMYX LEARN / PANDAS</div>

# Messy data.<br>Clear thinking. Useful answers.

<p class="lesson-lead">Turn a table into a question you can answer. Learn to select, clean, combine, reshape and explain data with pandas, one inspectable step at a time.</p>

<div class="lesson-meta"><span>15 free chapters</span><span>pandas 3.1.1</span><span>Python 3.12+</span><span>No sign-up</span></div>

[Start learning pandas →](getting-started.md){ .md-button .md-button--primary }
[Find a reference topic](coverage.md){ .md-button }

## Your pandas learning path

The examples use small, original datasets so you can calculate an answer yourself before trusting the code. Every chapter has a practice question and an expandable answer. Start here after the [Python collections](../python/collections.md) and [functions](../python/control-flow-and-functions.md) chapters, or jump straight to a technique you need.

| Chapter | Learn to… |
| --- | --- |
| [01 · Get started with pandas](getting-started.md) | Set up a reproducible environment and inspect a small dataset |
| [02 · Series and alignment](series.md) | Connect values to labels, construct Series and reason about arithmetic |
| [03 · DataFrames and NumPy](dataframes.md) | Construct tables, use broadcasting and understand memory conversion |
| [04 · Select, index and sort](indexing.md) | Choose rows and columns with explicit labels, positions and masks |
| [05 · Transform a table](transforming.md) | Add columns, map values, apply functions, query and explode lists |
| [06 · Missing values and exploration](missing-and-exploration.md) | Inspect types, handle missing data and count or reduce values |
| [07 · Group and aggregate](groupby.md) | Summarize groups, name outputs, find top records and sample fairly |
| [08 · Reshape and use MultiIndex](reshaping.md) | Stack, unstack, pivot, melt and cross-tabulate |
| [09 · Combine tables](combining.md) | Validate joins and concatenate without losing the meaning of a key |
| [10 · Time series](time-series.md) | Build time indexes, resample, interpolate and handle time zones |
| [11 · Strings, categories and accessors](accessors.md) | Work with text, dates, ordered categories and sparse values |
| [12 · Read and write data](input-output.md) | Round-trip CSV, JSON, HTML and Excel, and understand clipboard input |
| [13 · Plot an answer](plotting.md) | Choose, label and export useful Series and DataFrame plots |
| [14 · Write reliable pandas](reliable-workflows.md) | Understand Copy-on-Write, avoid chained assignment and choose iteration carefully |
| [15 · A complete analysis](project.md) | Validate a dataset, clean it and produce a reproducible report |

## Run the examples

Use the pinned [setup instructions](getting-started.md#setup). Run the Python blocks **in order within each chapter**, in a fresh notebook kernel or one script per chapter. An `assert` states the expected result; change an input and see whether the explanation still holds. Assertions make these teaching examples checkable; use explicit errors for production input validation.

Examples run locally on your computer. This website displays code and does not execute reader code, upload data or save exercise answers. The [sample CSV](data/workshop-enrolments.csv) is synthetic and can be downloaded without an account. The clipboard demonstration uses a simulated clipboard so it also runs on a headless machine. Plotting examples save images and close their figures.

## Modern pandas, with the older topics explained

This course covers all **117 section/subsection headings** in the supplied [Aman.ai pandas primer](https://aman.ai/primers/pandas/), including the selected-method recipes. The [coverage index](coverage.md) links each source topic to its lesson and records the source snapshot. It also explains version-sensitive changes: Copy-on-Write in pandas 3, `.ffill()` in place of the old `fillna(method="ffill")`, current frequency aliases and the distinction between `Series.unique()` and `DataFrame.value_counts()`.

## Apply it to your own question

Bring a small, shareable dataset and explain the decision you want it to support. We can discuss guided learning or project feedback after an enquiry.

[Discuss pandas learning support ↗](/?interest=learning#enquire){ .md-button }
