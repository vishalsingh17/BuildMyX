---
title: Strings, categories and accessors
description: Clean text with str, derive date fields with dt, define categorical order with cat and inspect sparse storage with sparse.
course: Pandas
lesson: CHAPTER 11 OF 15
---

# Strings, categories and accessors

## An accessor groups type-specific operations {#accessors}

A Series exposes methods appropriate to its values through accessors. `.str` handles strings, `.dt` handles datetime-like data, `.cat` handles categoricals and `.sparse` handles sparse arrays. They are namespaces, not conversions: `.dt` cannot operate on arbitrary date-looking text until you parse it.

| Accessor | Typical use | Required preparation |
| --- | --- | --- |
| `.str` | Normalize text, match, split, extract | A compatible string-like Series |
| `.dt` | Year, month, duration or timezone operations | Parse timestamps or durations |
| `.cat` | Categories, codes and ordering | Construct or cast to categorical dtype |
| `.sparse` | Density and dense conversion | Construct a SparseDtype Series |

## Clean and search text with str {#strings}

String operations usually preserve the Series index and handle missing values without a Python loop. Specify `regex=False` when you mean a literal substring. A regex is a pattern language; punctuation such as `.` has special meaning. Set the missing-result policy explicitly for Boolean masks.

```python
import pandas as pd
import numpy as np

raw = pd.Series(["  Python ONLINE ", "Pandas / in-person", None], dtype="string")
clean = raw.str.strip().str.lower()
assert clean.iloc[0] == "python online"
assert clean.str.contains("online", regex=False, na=False).tolist() == [True, False, False]
assert clean.str.startswith("pandas", na=False).tolist() == [False, True, False]
assert clean.str.len().iloc[1] == 18
assert clean.str.replace(" / ", " ", regex=False).iloc[1] == "pandas in-person"
assert pd.isna(clean.iloc[2])
```

`.str.extract` returns captured regex groups; `.str.split` separates tokens. Use a narrow, documented pattern to extract an actual field, and inspect failed matches instead of assuming every input has the expected format.

```python
reviews = pd.Series(["Process took 2 weeks", "Process took 10 days", "No duration given"], dtype="string")
duration = reviews.str.extract(r"(?P<amount>\d+)\s+(?P<unit>weeks|days)")
duration["amount"] = pd.to_numeric(duration["amount"]).astype("Int64")
assert duration.loc[0, "amount"] == 2
assert duration.loc[1, "unit"] == "days"
assert pd.isna(duration.loc[2, "amount"])
words = clean.str.split()
assert words.iloc[0] == ["python", "online"]
```

The number alone is not a normalized duration: two weeks and two days differ. Convert units using an explicit rule before comparing them. [Split and explode](transforming.md#split-explode) is useful when each token deserves its own row.

## Derive date and duration fields with dt {#datetime-accessor}

Parse first, then use `.dt` to access year, month, day of week or timezone operations. A Timedelta Series also supports `.dt`; `total_seconds()` includes whole days, unlike the seconds-within-a-day component.

```python
dates = pd.to_datetime(pd.Series(["2026-10-01", "2026-11-03", None]))
assert dates.dt.month.iloc[:2].tolist() == [10.0, 11.0]
assert dates.dt.day_name().iloc[0] == "Thursday"
assert dates.dt.strftime("%Y-%m").iloc[1] == "2026-11"
elapsed = pd.to_timedelta(pd.Series(["1 days 01:00:00", "02:00:00"]))
assert elapsed.dt.total_seconds().tolist() == [90000.0, 7200.0]
```

Use the [time-series chapter](time-series.md) for resampling and timezone boundaries. A month number without its year can accidentally combine several years of data.

## Define and rename categories {#categories}

Categoricals represent values drawn from a known set. They store category labels plus codes and can reduce repeated-string storage, depending on cardinality. Category codes are internal positions, not a business meaning to average. Define readable labels and an explicit order when comparisons such as “low before high” matter.

```python
codes = pd.Series([10, 30, 10, 20]).astype("category")
labels = codes.cat.rename_categories({10: "Beginner", 20: "Intermediate", 30: "Advanced"})
assert labels.iloc[1] == "Advanced"
assert labels.cat.categories.tolist() == ["Beginner", "Intermediate", "Advanced"]
level_type = pd.CategoricalDtype(["Beginner", "Intermediate", "Advanced"], ordered=True)
levels = labels.astype(level_type)
assert levels.sort_values().tolist() == ["Beginner", "Beginner", "Intermediate", "Advanced"]
assert (levels > "Beginner").tolist() == [False, True, False, True]
```

Use `.cat.rename_categories(...)` rather than assigning directly to `.cat.categories`, a pattern in older tutorials. An unordered categorical can sort by its category sequence, but ordered comparisons require `ordered=True`. Values outside a declared set become missing when cast; validate source values first if unknown categories should be an error.

```python
with_unused = levels.cat.add_categories(["Expert"])
assert "Expert" in with_unused.cat.categories
trimmed = with_unused.cat.remove_unused_categories()
assert "Expert" not in trimmed.cat.categories
counts = with_unused.groupby(with_unused, observed=False).size()
assert counts.loc["Expert"] == 0
assert -1 == pd.Series(pd.Categorical([None], dtype=level_type)).cat.codes.iloc[0]
```

`.cat.codes` uses `-1` for a missing value. Do not export those codes as stable external identifiers; category order can change when datasets are recoded or combined.

## Sparse values and the sparse accessor {#sparse}

A sparse Series stores non-fill values rather than every repeated fill value. `SparseDtype` specifies both the value dtype and the fill value. Sparse storage is useful when most values equal the fill value, but is not automatically smaller or faster for all data. Sparse data is also not a GPU array.

```python
sparse = pd.Series([0, 0, 5, 0], dtype=pd.SparseDtype("int64", fill_value=0))
assert sparse.sparse.density == 0.25
assert sparse.sparse.npoints == 1
dense = sparse.sparse.to_dense()
assert dense.tolist() == [0, 0, 5, 0]
assert np.asarray(dense).sum() == 5
```

## Practice

A categorical column uses codes 0, 1 and 2 for three workshop topics. Is the average code a meaningful “average topic”?

??? question "Check your reasoning"
    No. Those codes identify categories; their numeric distance does not represent a measured quantity. Count categories, map them to readable names and define order only when the domain has one. Even an ordered level does not automatically have equal numeric spacing.
