---
title: Get started with pandas
description: Set up pandas, understand its two core data structures and inspect a small, original workshop dataset.
course: Pandas
lesson: CHAPTER 01 OF 15
---

# Get started with pandas

## Start with a question {#overview}

pandas is a Python library for working with labelled data. It helps turn rows from a CSV, spreadsheet or query into calculations you can inspect and repeat. A useful starting question is specific: “How many seats were booked for each workshop?” gives you a unit, a grouping key and a measure. “Analyze the data” leaves all three undecided.

This course follows a fictional workshop business. Its records are synthetic; they do not describe customers or imply a business result for BuildMyX. The small numbers make it possible to check a result by hand.

## Background and prerequisites {#prerequisites}

You should be comfortable with Python lists, dictionaries, functions and imports. Revisit the [Python learning path](../python/index.md) if those are new. NumPy supplies efficient arrays and mathematical operations; pandas adds labelled axes, column types and table operations. You do not need advanced NumPy knowledge, but distinguish an array's **position** from a pandas **label**.

A spreadsheet formula is often tied to a cell's position. A pandas operation can line values up by their labels even when the order differs. That is useful and also a common source of surprising missing values. The next chapters make this behavior explicit.

## Set up a reproducible environment {#setup}

Use Python 3.12 or newer. In an empty practice directory, create a virtual environment so these packages do not change another project's dependencies.

```sh
python -m venv .venv
# macOS/Linux:
source .venv/bin/activate
# Windows PowerShell instead:
# .venv\Scripts\Activate.ps1
python -m pip install pandas==3.1.1 numpy==2.5.4 matplotlib==3.11.2 lxml==6.1.3 openpyxl==3.1.5
```

The course targets **pandas 3.1.1**. These are the versions used to validate the examples; pandas 2 tutorials can differ in assignment behavior and supported keywords. A plain `.py` script is enough. A notebook is convenient for rich tables; install Jupyter separately if you choose that workflow. Type `print(result)` in a script where a notebook would display its last expression.

```python
import pandas as pd
import numpy as np

assert pd.__version__ == "3.1.1"
print(f"pandas {pd.__version__}; NumPy {np.__version__}")
```

`pd` and `np` are conventions, not special syntax. Use `python -m pip` from the active environment if an import fails; a different `pip` executable may install into a different interpreter.

## The two data structures {#data-structures}

A **Series** is a one-dimensional collection with an index. A **DataFrame** is a two-dimensional table whose rows and columns both have labels. Columns can have different types. A row might contain an identifier, a date and an integer; that does not make the whole table an integer matrix.

```python
seats = pd.Series([2, 1, 3], index=["W01", "W02", "W03"], name="seats")
bookings = pd.DataFrame({"seats": seats, "fee": [40, 60, 40]})
assert seats.ndim == 1
assert bookings.ndim == 2
assert bookings.shape == (3, 2)
assert bookings.loc["W01", "seats"] == 2
assert bookings["seats"].equals(seats)
```

Here the index identifies a booking. It is not a hidden extra data column. `shape` is `(row_count, column_count)`, `index` holds row labels and `columns` holds column labels.

## A dataset at a glance {#dataset}

The [downloadable workshop-enrolments.csv](data/workshop-enrolments.csv) contains eight enrolments with identifiers, workshop, location, seats, fee, date and optional feedback. Amounts are fictional whole currency units per seat. A missing rating means no feedback was recorded, rather than a rating of zero.

This small inline extract runs without downloading a file:

```python
from io import StringIO

csv = StringIO("""booking_id,workshop,city,seats,fee,rating
B01,Python,Pune,2,40,5
B02,Pandas,Delhi,1,60,
B03,Python,Pune,3,40,4
""")
df = pd.read_csv(csv, dtype={"booking_id": "string", "seats": "Int64"})
assert df.shape == (3, 6)
assert df["booking_id"].is_unique
assert df["rating"].isna().sum() == 1
print(df.head())
print(df.dtypes)
```

Before calculating, ask what one row represents, whether its key is unique, what each unit means and how missing values arose. Those questions prevent a plausible calculation from answering the wrong question. In [the final project](project.md), you will validate the full sample and create a workshop summary.

## Practice

The table has three enrolment rows and `seats` values of 2, 1 and 3. Does counting rows tell you how many seats were booked?

??? question "Check your reasoning"
    There are three enrolments and six seats. Count rows to answer an enrolment question; sum `seats` to answer a seat question. Neither number is a count of unique people because this dataset has no person identifier.
