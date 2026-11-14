---
title: Series, labels and alignment
description: Construct Series from arrays, dictionaries and scalars; distinguish labels from positions and predict automatic alignment.
course: Pandas
lesson: CHAPTER 02 OF 15
---

# Series, labels and alignment

## Create a labelled one-dimensional collection {#creating}

A Series pairs a sequence of values with an index. With no explicit index, pandas supplies `0, 1, 2, …`. An explicit `dtype` documents the expected values instead of relying on inference. A Series has one dtype, although an `object` dtype can hold mixed Python objects.

```python
import pandas as pd
import numpy as np

seats = pd.Series([2, 1, 3], index=["B01", "B02", "B03"], dtype="Int64", name="seats")
assert seats.shape == (3,)
assert seats.index.tolist() == ["B01", "B02", "B03"]
assert str(seats.dtype) == "Int64"
assert pd.Series([7, 8]).index.tolist() == [0, 1]
```

## Similar to a one-dimensional ndarray {#array-operations}

Arithmetic, comparisons and many NumPy universal functions operate on every element. This avoids writing a Python loop for a simple column calculation. Labels are retained. A comparison returns a Series of truth values, not a single answer about the whole collection.

```python
assert (seats * 2).tolist() == [4, 2, 6]
assert (seats >= 2).tolist() == [True, False, True]
areas = pd.Series([1.0, 4.0, 9.0], index=seats.index)
assert np.sqrt(areas).tolist() == [1.0, 2.0, 3.0]
assert np.exp(pd.Series([0.0])).iloc[0] == 1.0
assert seats[seats >= 2].index.tolist() == ["B01", "B03"]
```

## Labels and positions answer different questions {#labels}

`.loc[label]` chooses an index label; `.iloc[position]` chooses a zero-based position. Integer labels are still labels. In modern pandas, `s[10]` means label `10`; make the intent explicit instead of using an ambiguous shortcut. A missing label raises `KeyError`, while an out-of-range scalar position raises `IndexError`.

```python
by_id = pd.Series([12, 24], index=[10, 20])
assert by_id.loc[10] == 12
assert by_id.iloc[0] == 12
assert by_id.loc[10:20].tolist() == [12, 24]  # Label endpoints included.
assert by_id.iloc[0:1].tolist() == [12]      # Positional stop excluded.
assert seats.loc[["B03", "B01"]].tolist() == [3, 2]
```

Index labels need not be unique. If there are duplicates, scalar `.loc` can return multiple values. Check `s.index.is_unique` when the index is intended to identify exactly one record.

## Initialize from a dictionary or a scalar {#constructors}

A dictionary maps labels to values. Giving a separate index selects and orders dictionary keys; absent keys become missing. A scalar is repeated for every label in the supplied index.

```python
from_dict = pd.Series({"B02": 1, "B01": 2}, index=["B01", "B02", "B99"], dtype="Int64")
assert from_dict.loc["B01"] == 2
assert pd.isna(from_dict.loc["B99"])
allowance = pd.Series(5, index=["B01", "B02"], dtype="Int64")
assert allowance.tolist() == [5, 5]
```

Use nullable `"Int64"` with a capital `I` for integer data that can be missing. NumPy's `"int64"` is a different dtype and cannot represent `pd.NA` directly.

## Automatic alignment matches labels {#alignment}

Adding two Series matches their indexes, rather than pairing their first values blindly. The result normally contains the union of labels. A label present on only one side has no matching operand, so its ordinary sum is missing. The `.add` method lets you provide an explicit missing-side fill value.

```python
morning = pd.Series({"Python": 5, "Pandas": 2})
evening = pd.Series({"Pandas": 4, "Design": 3})
total = morning + evening
assert total.loc["Pandas"] == 6
assert pd.isna(total.loc["Python"])
filled = morning.add(evening, fill_value=0)
assert filled.to_dict() == {"Design": 3.0, "Pandas": 6.0, "Python": 5.0}
aligned = evening.reindex(morning.index, fill_value=0)
assert aligned.tolist() == [0, 4]
```

Choose a fill only when it has a real meaning. A missing sales record might mean no sales, an ingestion failure or an unknown amount. Replacing all three with zero hides that distinction. `reindex` introduces or reorders labels; it is different from merely changing the spelling of existing labels with `rename`.

## Name a Series and turn it into a table {#name-and-frame}

`name` describes the values; `index.name` describes the labels. `rename` returns a new Series unless asked otherwise. **`to_frame()` is a Series method**: it creates a one-column DataFrame, using the name as the column label. A DataFrame is already two-dimensional.

```python
seats.index.name = "booking_id"
renamed = seats.rename("booked_seats")
frame = renamed.to_frame()
assert frame.columns.tolist() == ["booked_seats"]
assert frame.index.name == "booking_id"
assert seats.name == "seats"
assert frame.loc["B03", "booked_seats"] == 3
```

Series also has a `.plot()` method. You will create and export a labelled Series plot in [the plotting chapter](plotting.md#series-plot); keeping plotting together makes chart choices easier to compare.

## Practice

Two Series have labels `a, b` and `b, a`, with values `10, 20` and `1, 2`. What is the sum at label `a`?

??? question "Check your reasoning"
    It is `12`: the first Series has `a=10` and the second has `a=2`. The first positions are not paired. If order alone is intended, first verify the shape and intentionally convert to arrays; discarding labels should be a decision.
