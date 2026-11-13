---
title: DataFrames, arithmetic and NumPy
description: Build tables from several input shapes, understand two-axis alignment and convert to NumPy with explicit memory and dtype choices.
course: Pandas
lesson: CHAPTER 03 OF 15
---

# DataFrames, arithmetic and NumPy

## Construct a DataFrame {#constructing}

A DataFrame has an index, column labels and a dtype for each column. A dictionary of equal-length lists is convenient for a small table. A list of dictionaries is useful for records whose fields can be absent. A dictionary of Series aligns their indexes before assembling the table.

```python
import pandas as pd
import numpy as np

table = pd.DataFrame({"workshop": ["Python", "Pandas"], "seats": [2, 1]})
records = pd.DataFrame([{"id": "A", "seats": 2}, {"id": "B"}])
aligned = pd.DataFrame({
    "seats": pd.Series({"B01": 2, "B02": 1}),
    "fee": pd.Series({"B02": 60, "B01": 40}, name="ignored_name"),
})
assert table.shape == (2, 2)
assert pd.isna(records.loc[1, "seats"])
assert aligned.loc["B01", "fee"] == 40
assert aligned.columns.tolist() == ["seats", "fee"]
```

The dictionary keys supply column names, even if an input Series has its own name. Passing `index=` and `columns=` to the constructor explicitly selects and orders labels; missing labels create missing values. Nested dictionaries also work: the outer keys identify columns and inner keys identify rows.

```python
restricted = pd.DataFrame(aligned, index=["B02", "B99"], columns=["fee", "note"])
assert restricted.index.tolist() == ["B02", "B99"]
assert restricted.loc["B02", "fee"] == 60
assert restricted["note"].isna().all()
nested = pd.DataFrame({"seats": {"A": 2}, "fee": {"A": 40, "B": 60}})
assert pd.isna(nested.loc["B", "seats"])
single = pd.DataFrame({"city": "Pune", "seats": 2}, index=["B01"])
assert single.shape == (1, 2)
```

A dictionary containing **only scalars** needs an index to define its row count. Alternatively, wrap it in a list to make one record. This avoids “If using all scalar values, you must pass an index.”

## Arrays, lists and masked values {#array-input}

A two-dimensional array or list of lists provides positions; you attach labels separately. Every row must fit the column count. NumPy masked arrays are another input representation for missing data. The old `np.object` alias is removed; use the built-in `object` or a concrete dtype.

```python
matrix = np.array([[2, 40], [1, 60]])
from_array = pd.DataFrame(matrix, index=["B01", "B02"], columns=["seats", "fee"])
from_lists = pd.DataFrame([[2, 40], [1, 60]], columns=["seats", "fee"])
masked = np.ma.array([[2.0, 40.0], [1.0, 60.0]], mask=[[False, False], [True, False]])
with_missing = pd.DataFrame(masked, columns=["seats", "fee"])
assert from_array.loc["B02", "fee"] == 60
assert from_lists.iloc[0].tolist() == [2, 40]
assert pd.isna(with_missing.loc[1, "seats"])
```

## Arithmetic and the meaning of axis {#operations}

Scalar arithmetic broadcasts over numeric cells. A NumPy function such as `sqrt` can retain the DataFrame's labels. Reductions usually operate down rows for each column (`axis=0`); `axis=1` reduces across columns for each row. Select numeric columns deliberately rather than hoping mixed text and numbers will combine meaningfully.

```python
scores = pd.DataFrame({"quiz": [4, 9], "project": [9, 16]}, index=["A", "B"])
assert (scores + 1).loc["A", "quiz"] == 5
assert np.sqrt(scores).loc["B", "project"] == 4
assert scores.mean(axis=0).to_dict() == {"quiz": 6.5, "project": 12.5}
assert scores.sum(axis=1).to_dict() == {"A": 13, "B": 25}
assert (scores >= 9).all(axis=1).to_dict() == {"A": False, "B": True}
```

## Alignment on two axes {#alignment}

DataFrame-to-DataFrame arithmetic aligns **both row and column labels**. DataFrame-to-Series arithmetic normally matches the Series index to the DataFrame's **columns**, then broadcasts down rows. Use a method such as `.sub(..., axis="index")` to request row alignment explicitly. Equal length alone does not establish a match.

```python
centered = scores - scores.mean()
assert centered.loc["A", "project"] == -3.5
row_offsets = pd.Series({"B": 2, "A": 1})
adjusted = scores.sub(row_offsets, axis="index")
assert adjusted.loc["A", "quiz"] == 3
other = pd.DataFrame({"quiz": [1], "exam": [7]}, index=["B"])
added = scores + other
assert added.loc["B", "quiz"] == 10
assert pd.isna(added.loc["A", "quiz"])
assert pd.isna(added.loc["B", "exam"])
```

The last result has no matching `exam` column on the left. Label alignment is not a database join of arbitrary key columns; [merges](combining.md) handle those explicitly.

## Column-oriented does not promise one memory layout {#column-oriented}

pandas exposes efficient column operations, and each column can have a different dtype or an extension-array representation. Thinking in columns is useful. Calling every DataFrame “a column-major matrix” is too strong: its physical storage is an implementation detail, and a mixed-type table is not one homogeneous NumPy buffer.

Prefer `df["fee"] * df["seats"]` to constructing a Python row object for every multiplication. Performance still depends on dtype, operation and data size. A timing ratio from one notebook is not a guarantee for your workload. Use `timeit` or a notebook's `%timeit` on representative data if the distinction matters.

## Convert to NumPy, with an explicit contract {#numpy-conversion}

`.values` is a **property**, not a method. Prefer `.to_numpy()` because it exposes dtype, missing-value and copy choices. Conversion loses row/column labels, may coerce mixed columns to a shared dtype, and may return a read-only view under Copy-on-Write. `copy=False` does not guarantee a zero-copy conversion.

```python
assert scores.values.shape == (2, 2)
array = scores.to_numpy(dtype="float64", copy=True)
assert array.dtype == np.dtype("float64")
assert array[0, 0] == 4
nullable = pd.DataFrame({"n": pd.Series([1, pd.NA], dtype="Int64")})
numeric = nullable.to_numpy(dtype="float64", na_value=np.nan)
assert np.isnan(numeric[1, 0])
```

If an external library requires a writable, independent, row-major (C-contiguous) array, request exactly that. “Row-major” describes how array elements are laid out; it does not make pandas row iteration preferable.

```python
row_major = np.array(scores.to_numpy(), order="C", copy=True)
assert row_major.flags.c_contiguous
assert row_major.flags.writeable
row_major[0, 0] = -1
assert scores.loc["A", "quiz"] == 4
```

## Practice

A Series of row discounts has exactly as many values as a table has rows. Is `table - discounts` enough to subtract the right discount from each row?

??? question "Check your reasoning"
    No. The default DataFrame–Series operation aligns the Series index to column labels. Use an explicit method such as `table.sub(discounts, axis="index")` on the relevant numeric columns, and verify that the row labels match.
