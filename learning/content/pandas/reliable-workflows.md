---
title: Write reliable pandas
description: Understand pandas 3 Copy-on-Write, fix chained assignment, compare vectorization and row iteration, and make analyses reproducible across environments.
course: Pandas
lesson: CHAPTER 14 OF 15
---

# Write reliable pandas

## Return values and explicit mutations {#returns}

Most transformations return a new pandas object rather than updating the variable you called them on. Assignment to a column or a single `.loc` operation changes the target DataFrame. These are API behaviors, separate from whether pandas internally reuses a memory buffer.

```python
import pandas as pd
import numpy as np

df = pd.DataFrame({"workshop": ["Python", "Pandas", "Python"], "seats": [2, 1, 3], "fee": [40, 60, 40]})
dropped = df.drop(columns=["fee"])
assert "fee" in df and "fee" not in dropped
renamed = df.rename(columns={"seats": "booked_seats"})
assert "seats" in df and "booked_seats" in renamed
local = df.copy()
result = local.drop(columns=["fee"], inplace=True)
assert result is None and "fee" not in local
```

Do not write `df = df.drop(..., inplace=True)`; that assigns `None`. Returning and assigning a result is usually easier to compose. `inplace=True` does not promise lower memory use or faster execution.

## Copy-on-Write: logical independence {#copy-on-write}

In pandas 3, Copy-on-Write is the standard behavior. A derived Series or DataFrame behaves independently when modified through pandas: editing it does not implicitly edit its parent. pandas may share underlying memory until a write, but you should reason from the API's logical behavior rather than inspecting internal buffers.

```python
subset = df[["seats"]]
subset.loc[0, "seats"] = 99
assert df.loc[0, "seats"] == 2
assert subset.loc[0, "seats"] == 99
alias = df
alias.loc[0, "seats"] = 4
assert df.loc[0, "seats"] == 4  # An alias is the very same object.
df.loc[0, "seats"] = 2
```

`alias = df` is not a derived object; both names refer to the same DataFrame. This ordinary Python aliasing remains important even with Copy-on-Write.

## SettingWithCopyWarning and chained assignment {#chained-assignment}

Older pandas versions raised `SettingWithCopyWarning` when a mutation might affect either a view or a temporary copy. Whether a slice shared memory could depend on dtype and layout. Code such as `df[df["seats"] > 1]["fee"] = 0` combines two indexing operations and cannot reliably express which object you intended to edit.

With pandas 3 Copy-on-Write, **chained assignment cannot update the original through the intermediate object**. It may produce a `ChainedAssignmentError` warning. The historical warning name is still worth recognizing when reading old notebooks, but suppressing it does not fix the assignment.

## Update once with loc {#single-loc}

Combine the row condition and column selection into one operation on the object you intend to change. If you want a separate working table, take it explicitly and modify that table instead. Column-level inplace calls such as `df["rating"].fillna(0, inplace=True)` are also a chained-operation trap; assign the returned column or use a DataFrame operation.

```python
edited = df.copy()
mask = edited["seats"] > 1
edited.loc[mask, "fee"] = 0
assert edited["fee"].tolist() == [0, 60, 0]
assert df["fee"].tolist() == [40, 60, 40]
working = df.loc[df["seats"] > 1].copy()
working["fee"] = 0
assert len(working) == 2
assert df["fee"].sum() == 140
```

Boolean filters, row slices and a selected column can all create intermediate objects. A short expression is not proof of a single assignment: identify the target and the number of indexing steps.

## Turn chained-assignment diagnostics into a failure {#raise-error}

In pandas 2.x, `pd.options.mode.chained_assignment = "raise"` was commonly used to turn the old diagnostic into an error. For this pandas 3 course, catch the actual `ChainedAssignmentError` warning category with Python's warnings mechanism. This example deliberately demonstrates a rejected assignment without leaking that warning into later examples.

```python
import warnings

unchanged = df.copy()
with warnings.catch_warnings():
    warnings.simplefilter("error", pd.errors.ChainedAssignmentError)
    try:
        unchanged[unchanged["seats"] > 1]["fee"] = 0
    except pd.errors.ChainedAssignmentError:
        pass
    else:
        raise AssertionError("Expected a chained-assignment diagnostic")
pd.testing.assert_frame_equal(unchanged, df)
```

Keep the corrective `.loc` version in your real code. Diagnostic settings help catch a mistake; they do not convert an intermediate object into a reference to its parent.

## What copy does, and does not, copy {#copy}

`.copy(deep=False)` can share data initially but remains logically independent under Copy-on-Write. `.copy(deep=True)` copies pandas-managed data, but does not recursively clone arbitrary Python objects inside object-dtype cells. Nested lists can still be shared. Prefer normalized scalar columns when possible; use a deliberate recursive copy if the nested structure truly requires one.

```python
shallow = df.copy(deep=False)
shallow.loc[0, "seats"] = 7
assert df.loc[0, "seats"] == 2
nested = pd.DataFrame({"tags": [["python"], ["pandas"]]})
deep = nested.copy(deep=True)
deep.at[0, "tags"].append("online")
assert nested.at[0, "tags"] == ["python", "online"]
```

`.at[row_label, column_label]` is useful for scalar access. A mutable list retrieved from a cell is an ordinary Python object; mutating that list is different from pandas assigning a new cell value.

## Vectorization, apply, iterrows and itertuples {#iteration}

Prefer column operations for arithmetic, masks and string/date work. `apply(axis=1)` builds row Series and calls Python code; it is convenient for some logic but is not automatically vectorized. `.iterrows()` yields `(index, row_series)` and may coerce row values to a common dtype. `.itertuples()` yields tuple-like rows, usually with less overhead and better preservation of scalar types.

```python
vectorized = df["seats"] * df["fee"]
applied = df.apply(lambda row: row["seats"] * row["fee"], axis=1)
iterated = [row["seats"] * row["fee"] for _, row in df.iterrows()]
tuples = [row.seats * row.fee for row in df.itertuples(index=False)]
assert vectorized.tolist() == applied.tolist() == iterated == tuples == [80, 60, 120]
mixed_numeric = pd.DataFrame({"integer": [1], "float": [1.5]})
_, row = next(mixed_numeric.iterrows())
assert row.dtype == np.dtype("float64")
assert next(mixed_numeric.itertuples(index=False)).integer == 1
```

Do not update the table by mutating yielded rows. If an external API genuinely requires one record at a time, collect results and assign them back against verified keys. With invalid or duplicate column names, named-tuple fields may be renamed; `itertuples(index=False, name=None)` provides ordinary positional tuples.

## Reproduce the calculation, not just the notebook {#reproducibility}

Record package versions, input snapshots, schema, units and timezone conventions. Pin random seeds and a deterministic input order. Retain stable identifiers across saving and loading. Floats have rounding limits; compare approximate numeric results with tolerances rather than exact equality when appropriate. Monetary models can use integer minor units when that matches their range and arithmetic needs.

```python
sample_a = df.sort_values(["workshop", "seats"]).sample(n=2, random_state=23)
sample_b = df.sort_values(["workshop", "seats"]).sample(n=2, random_state=23)
pd.testing.assert_frame_equal(sample_a, sample_b)
assert not (0.1 + 0.2 == 0.3)
np.testing.assert_allclose([0.1 + 0.2], [0.3], rtol=1e-12, atol=1e-12)
minor_units = pd.Series([1000, 2000], dtype="int64")
assert minor_units.sum() == 3000
```

A seed does not guarantee identical samples across every future library implementation. The pinned environment and input snapshot are part of the reproducibility contract. Run a notebook from a fresh kernel in order before sharing it; hidden variables from earlier runs are another source of inconsistent results.

## CPU, GPU and memory limits {#gpu}

Standard pandas primarily runs on the CPU and expects data to fit its processing strategy in memory. Installing it does not automatically move calculations to a GPU. GPU-oriented alternatives such as cuDF require compatible hardware and have API, dtype and operation differences; benchmark and validate results before migrating. Arrow-backed dtypes are also not a promise of GPU execution.

Select only needed columns, avoid unnecessary object values, aggregate chunks when possible and measure peak memory on representative data. A dataframe that fits as a CSV file may need much more memory after parsing, joining or expanding rows. Consider a database or an out-of-core engine when the workload requires it, rather than adding row loops to compensate.

## Practice

Does `subset = df[["seats"]]` followed by `subset.loc[0, "seats"] = 99` update `df` in pandas 3? What about `subset = df`?

??? question "Check your reasoning"
    A derived table behaves independently under Copy-on-Write, so the first form leaves `df` unchanged. The second form aliases the same Python object, so a mutation is visible through both names. Use one `.loc` on `df` when editing `df` is the intention.
