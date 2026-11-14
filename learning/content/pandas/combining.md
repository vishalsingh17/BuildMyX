---
title: Combine tables without losing the key
description: Compare SQL-style joins with pandas merges, validate cardinality, find unmatched keys and concatenate batches along either axis.
course: Pandas
lesson: CHAPTER 09 OF 15
---

# Combine tables without losing the key

## Join on an explicit business key {#joins}

Use `merge` to match records using key values. Always name the intended keys: an implicit merge uses shared column names, which can change when someone adds a column upstream. The key's dtype and meaning should agree in both tables.

```python
import pandas as pd

bookings = pd.DataFrame({"id": ["B01", "B02", "B03"], "code": ["PY", "PD", "XX"], "seats": [2, 1, 1]})
catalog = pd.DataFrame({"code": ["PY", "PD"], "workshop": ["Python", "Pandas"], "fee": [40, 60]})
joined = bookings.merge(catalog, on="code", how="left", validate="many_to_one", indicator=True)
assert len(joined) == len(bookings)
assert joined.loc[0, "workshop"] == "Python"
assert joined.loc[2, "_merge"] == "left_only"
assert pd.isna(joined.loc[2, "fee"])
```

`validate="many_to_one"` permits many bookings per catalog code but requires the catalog key to be unique. If the catalog contains duplicates, pandas raises `MergeError` instead of silently multiplying rows. Use `one_to_one`, `one_to_many` or `many_to_many` only when that relationship matches the data contract; `many_to_many` permits multiplication rather than checking uniqueness.

## Choose which population to retain {#join-types}

| Join | Keep |
| --- | --- |
| `inner` | Keys matching on both sides |
| `left` | Every left record, with missing values for unmatched right fields |
| `right` | Every right record |
| `outer` | Keys from both sides, including unmatched records |
| `cross` | Every combination of a left and right record; no key match |

```python
inner = pd.merge(bookings, catalog, on="code", how="inner", validate="many_to_one")
assert inner["id"].tolist() == ["B01", "B02"]
outer = pd.merge(bookings, catalog, on="code", how="outer", indicator=True, validate="many_to_one")
assert set(outer["code"]) == {"PY", "PD", "XX"}
right = bookings.merge(catalog, on="code", how="right", validate="many_to_one")
assert set(right["code"]) == {"PY", "PD"}
slots = pd.DataFrame({"day": ["Mon", "Tue"]}).merge(pd.DataFrame({"room": ["A", "B"]}), how="cross")
assert len(slots) == 4
```

`left_on` and `right_on` match differently named key columns. `left_index=True`/`right_index=True` match an index. `.join` conveniently joins on an index by default. If both tables contain a non-key column of the same name, choose meaningful `suffixes` so readers can distinguish their source.

```python
catalog_index = catalog.set_index("code", verify_integrity=True)
with_index = bookings.join(catalog_index, on="code", validate="many_to_one")
assert with_index.loc[0, "fee"] == 40
renamed = catalog.rename(columns={"code": "course_code"})
different_names = bookings.merge(renamed, left_on="code", right_on="course_code", how="left", validate="many_to_one")
assert different_names.loc[1, "workshop"] == "Pandas"
```

## Null keys and duplicate keys deserve a check {#join-validation}

Unlike typical SQL equality joins, pandas can match a missing key to another missing key. If missing means “unknown identifier,” that match may be misleading. Validate or separate missing keys before merging. Duplicates on both sides produce a Cartesian product within each matching key, which can inflate money or counts.

```python
left = pd.DataFrame({"key": ["A", None], "left_value": [1, 2]})
right = pd.DataFrame({"key": ["A", None], "right_value": [3, 4]})
null_match = left.merge(right, on="key")
assert len(null_match) == 2  # The two missing keys also match.
known = left.dropna(subset=["key"]).merge(right.dropna(subset=["key"]), on="key", validate="one_to_one")
assert len(known) == 1
duplicate = pd.concat([catalog, catalog.iloc[[0]]], ignore_index=True)
try:
    bookings.merge(duplicate, on="code", validate="many_to_one")
except pd.errors.MergeError:
    pass
else:
    raise AssertionError("Duplicate catalog codes must fail validation")
```

Inspect unmatched keys using `indicator=True` before dropping the indicator. An inner join can hide missing catalog data by removing the very records that need attention.

## Concatenate batches {#concat}

`pd.concat` appends objects along an axis. Along rows (`axis=0`), columns are aligned by label; columns absent from a batch become missing. `ignore_index=True` gives the combined table a fresh RangeIndex. It does not validate business-key uniqueness.

```python
first = bookings.iloc[:2]
second = bookings.iloc[2:]
combined = pd.concat([first, second], ignore_index=True)
pd.testing.assert_frame_equal(combined, bookings)
assert combined["id"].is_unique
with_source = pd.concat({"morning": first, "evening": second}, names=["batch"])
assert with_source.index.nlevels == 2
assert with_source.loc["evening", "id"].tolist() == ["B03"]
```

Concatenating along columns (`axis=1`) aligns **indexes**, not row positions. Use `join="inner"` to retain shared labels rather than the default union. `verify_integrity=True` checks duplicates on the concatenation axis, which is different from validating a separate `id` column.

```python
names = pd.DataFrame({"topic": ["Python", "Pandas"]}, index=["B01", "B02"])
seats = pd.DataFrame({"seats": [3, 1]}, index=["B03", "B02"])
side_by_side = pd.concat([names, seats], axis=1)
assert pd.isna(side_by_side.loc["B01", "seats"])
shared = pd.concat([names, seats], axis=1, join="inner", verify_integrity=True)
assert shared.index.tolist() == ["B02"]
```

Collect batch tables into a list and concatenate once where possible. Repeated concatenation inside a loop repeatedly rebuilds growing outputs. The old `DataFrame.append` method is removed; use `pd.concat`.

## Practice

Your booking table has 100 rows. After a left merge with a catalog, there are 130 rows. What should you check first?

??? question "Check your reasoning"
    Check duplicate catalog keys and the intended join cardinality. A left merge preserves left records but can repeat each one for multiple matching right records. Use `validate="many_to_one"` for a unique catalog, investigate duplicates and confirm totals before trusting the joined report.
