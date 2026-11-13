---
title: Missing values and data exploration
description: Inspect a table, distinguish missing sentinels and nullable dtypes, fill deliberately, and understand counts, uniqueness and Boolean reductions.
course: Pandas
lesson: CHAPTER 06 OF 15
---

# Missing values and data exploration

## Inspect before changing anything {#overview}

`head` and `tail` show the beginning and end. `shape` counts rows and columns. `info` prints column types, non-null counts and memory information; it returns `None`. `describe` summarizes columns, using numeric columns by default when present. Its `count` excludes missing values, `std` is the sample standard deviation, and `50%` is the median. Use `include="all"` to include text summaries as well.

```python
import pandas as pd
import numpy as np
from io import StringIO

df = pd.DataFrame({
    "workshop": pd.Series(["Python", "Pandas", "Python", None], dtype="string"),
    "seats": pd.Series([2, 1, pd.NA, 3], dtype="Int64"),
    "rating": [5.0, np.nan, 4.0, np.nan],
})
assert df.head(2).shape == (2, 3)
assert df.tail(1).index.tolist() == [3]
summary = df.describe()
assert summary.loc["count", "rating"] == 2
assert summary.loc["50%", "rating"] == 4.5
buffer = StringIO()
assert df.info(buf=buffer, memory_usage="deep") is None
assert "seats" in buffer.getvalue()
assert "workshop" in df.describe(include="all").columns
```

A preview can hide a problem outside the displayed rows. Follow it with checks over the entire relevant columns: missing rates, valid ranges and key uniqueness. Deep memory accounting estimates object contents; it is more work than the default summary.

## Missing values and their types {#sentinels}

`np.nan` is a floating-point missing marker. In traditional NumPy-backed integer columns, introducing it often coerces values to float. Nullable `Int64`, `boolean` and `string` dtypes can represent missing data with `pd.NA`. Datetime columns use `NaT`. pandas 3 also changed default string inference, so specify a dtype when missing-value behavior is important.

```python
traditional = pd.Series([1, np.nan])
nullable = pd.Series([1, pd.NA], dtype="Int64")
dates = pd.to_datetime(pd.Series(["2026-10-01", None]))
assert str(traditional.dtype) == "float64"
assert str(nullable.dtype) == "Int64"
assert dates.isna().tolist() == [False, True]
assert df.isna().sum().to_dict() == {"workshop": 1, "seats": 1, "rating": 2}
assert df.notna().sum()["rating"] == 2
assert not (np.nan == np.nan)
assert pd.isna(pd.NaT) and pd.isna(pd.NA)
```

Use `isna`/`notna` instead of equality with a missing marker. `pd.NA == pd.NA` is itself unknown; converting `pd.NA` to a Boolean is ambiguous. Empty strings and infinity are not normally missing. Decide whether an empty field should be converted before analysis.

## Drop, fill or preserve {#handling}

`dropna(subset=...)` removes rows that lack required fields. `fillna` replaces missing cells. Neither choice is automatically correct: a missing rating does not mean an unhappy attendee, and a missing seat count does not establish a zero-seat booking. Often the correct output includes both a metric and a missing-data count.

```python
required = df.dropna(subset=["seats"])
assert len(required) == 3
display = df.fillna({"workshop": "Unknown"})
assert display.loc[3, "workshop"] == "Unknown"
assert pd.isna(display.loc[2, "seats"])
assert df["rating"].mean() == 4.5
assert df["rating"].fillna(0).mean() == 2.25
all_missing = pd.Series([pd.NA, pd.NA], dtype="Int64")
assert all_missing.sum() == 0
assert pd.isna(all_missing.sum(min_count=1))
```

Most numeric reductions skip missing values. `min_count=1` can preserve an unknown sum when no observations exist. Document both the policy and the denominator, especially when comparing groups with different feedback completion rates.

## Forward fill uses order, not knowledge {#forward-fill}

`ffill()` carries the last observed value forward; `bfill()` carries the next observed value backward. Leading gaps remain after a forward fill. Sort by the relevant sequence first and fill **within each entity** when records belong to different sensors or accounts. Carrying one customer's value into another customer's row is a data error.

```python
readings = pd.Series([np.nan, 10.0, np.nan, 14.0, np.nan])
assert pd.isna(readings.ffill().iloc[0])
assert readings.ffill().iloc[2] == 10
assert readings.bfill().iloc[2] == 14
assert pd.isna(readings.ffill(limit=1).iloc[0])
```

Older tutorials write `fillna(method="ffill")`; use **`.ffill()`** in pandas 3. Filling is different from [interpolation](time-series.md#upsampling), which estimates between observed values.

## Count occurrences and distinct values {#uniqueness}

`Series.value_counts()` counts repeated values and drops missing values by default. `normalize=True` produces proportions. `.unique()` returns distinct values in encounter order; `.nunique()` returns their count, normally excluding missing values. `pd.unique` also accepts a one-dimensional Series, Index, extension array or NumPy array; pandas 3 does not accept a plain list here.

```python
labels = df["workshop"]
assert labels.value_counts().to_dict() == {"Python": 2, "Pandas": 1}
assert labels.value_counts(dropna=False).sum() == 4
assert labels.value_counts(normalize=True).loc["Python"] == 2 / 3
assert labels.nunique() == 2
assert labels.nunique(dropna=False) == 3
assert labels.dropna().unique().tolist() == ["Python", "Pandas"]
assert pd.unique(np.array(["B", "A", "B"])).tolist() == ["B", "A"]
pairs = pd.DataFrame({"city": ["Pune", "Pune", "Delhi"], "topic": ["PY", "PY", "PD"]})
assert pairs.value_counts().loc[("Pune", "PY")] == 2
assert len(pairs.drop_duplicates()) == 2
```

`DataFrame.value_counts()` counts **row combinations**, optionally over a `subset`. There is no general `DataFrame.unique()` method: use a column's `.unique()` or `drop_duplicates()` for whole rows. Those distinctions correct misleading recipe names in some older references.

## Reduce truth values with any and all {#any-all}

For a Series, `.any()` asks whether at least one value is true and `.all()` asks whether every value is true. For a DataFrame, the default `axis=0` returns an answer for each column; `axis=1` returns an answer for each row; `axis=None` reduces the entire table. The truth of an entire Series or DataFrame in `if df:` is ambiguous.

```python
flags = pd.DataFrame({"late": [False, True], "invalid": [False, False]})
assert flags.any().to_dict() == {"late": True, "invalid": False}
assert flags.any(axis=1).tolist() == [False, True]
assert bool(flags.any(axis=None))
assert not pd.Series([], dtype=bool).any()
assert pd.Series([], dtype=bool).all()
assert pd.DataFrame().any().empty
float_missing = pd.Series([np.nan])
assert not float_missing.any()
assert bool(float_missing.any(skipna=False))
unknown = pd.Series([False, pd.NA], dtype="boolean")
assert not unknown.any()
assert pd.isna(unknown.any(skipna=False))
```

With nullable Boolean data, unknowns can remain unknown when `skipna=False`. With float data, a non-skipped NaN can count as truthy. Do not assume all missing sentinels have identical Boolean behavior; build a Boolean condition such as `isna()` before reducing when checking data quality.

## Practice

Two workshops each have ten bookings. One has two ratings averaging 5; the other has ten ratings averaging 4. Can the mean alone establish which workshop attendees preferred?

??? question "Check your reasoning"
    No. The completion rates differ, and feedback may be selective. Report the number of ratings, total eligible bookings, missing count and mean together. Filling unrated rows with zero changes the question and introduces an unsupported assumption.
