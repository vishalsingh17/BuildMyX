---
title: Select, index and sort
description: Use loc, iloc, Boolean masks, meaningful indexes and stable sorting without confusing a row position with a label.
course: Pandas
lesson: CHAPTER 04 OF 15
---

# Select, index and sort

## Choose columns deliberately {#columns}

Square brackets containing a column name return a Series. A list of column names returns a DataFrame, even when the list has one item. Attribute access such as `df.seats` can be convenient, but fails for spaces or clashes with methods such as `count`. Brackets work consistently.

```python
import pandas as pd

df = pd.DataFrame({
    "booking_id": ["B03", "B01", "B02", "B04"],
    "workshop": ["Python", "Python", "Pandas", "Design"],
    "seats": [3, 2, 1, 1],
    "fee": [40, 40, 60, 80],
})
assert isinstance(df["seats"], pd.Series)
assert isinstance(df[["seats"]], pd.DataFrame)
assert df[["fee", "seats"]].columns.tolist() == ["fee", "seats"]
```

## Select positions with iloc {#iloc}

`.iloc[rows, columns]` accepts integer positions, slices and positional Boolean arrays. The slice's stop is excluded, like a Python list. Negative positions count from the end. A scalar row selection returns a Series; a list or slice preserves a DataFrame.

```python
assert df.iloc[0, 0] == "B03"
assert df.iloc[-1, 0] == "B04"
assert df.iloc[:2, [0, 2]].shape == (2, 2)
assert isinstance(df.iloc[0], pd.Series)
assert isinstance(df.iloc[[0]], pd.DataFrame)
assert df.iloc[[True, False, True, False], 0].tolist() == ["B03", "B02"]
```

Out-of-bounds scalar access raises `IndexError`; a slice can stop at the available boundary. `.iloc` does not look up integer index labels. A labelled Boolean Series belongs with `.loc`; use a positional Boolean array for `.iloc` only when its order is intentional.

## Create and select labels with loc {#loc-labels}

An identifier can become the index with `set_index`. Check uniqueness first when it should identify one record. `reset_index()` returns that index to a column and supplies a fresh RangeIndex. It does not undo a sort or restore discarded rows.

```python
assert df["booking_id"].is_unique
indexed = df.set_index("booking_id", verify_integrity=True).sort_index()
assert indexed.loc["B01", "seats"] == 2
assert indexed.loc[["B04", "B02"], "fee"].tolist() == [80, 60]
assert indexed.loc["B01":"B03", "seats"].tolist() == [2, 1, 3]
assert indexed.reset_index().columns[0] == "booking_id"
```

Label slices include **both** endpoints. Sorting the index makes range slicing predictable; non-monotonic or duplicate labels can make slices invalid or surprising. Creating a key from multiple fields is possible, but do not concatenate strings blindly: `(city, workshop)` as a [MultiIndex](reshaping.md#multiindex) avoids separator collisions.

## Boolean masks select matching labels {#masks}

Use `&`, `|` and `~` for elementwise and/or/not, with parentheses around comparisons. Python's `and` and `or` expect scalar truth values and cannot decide the truth of an entire Series. `.isin` handles membership in several values. A Boolean Series passed to `.loc` aligns by its index; it is not merely a list of flags.

```python
mask = (indexed["seats"] >= 2) & indexed["workshop"].isin(["Python", "Pandas"])
assert indexed.loc[mask, ["workshop", "seats"]].index.tolist() == ["B01", "B03"]
reordered = mask.sort_index(ascending=False)
assert indexed.loc[reordered].index.tolist() == ["B01", "B03"]
assert indexed.loc[~mask].index.tolist() == ["B02", "B04"]
assert indexed.loc[indexed["fee"].between(50, 80), "fee"].tolist() == [60, 80]
```

Handle missing flags consciously: `mask.fillna(False)` explicitly excludes unknown matches. A mask with absent or unrelated labels can raise an unalignable-index error; avoid carrying stale masks between unrelated tables.

## Slice a Series without ambiguity {#series-slices}

The same label/position distinction applies to a single column. An integer-looking label is not a position. Prefer explicit accessors to `series[start:stop]` when teaching or reviewing code, since the latter's meaning depends on its index and pandas version.

```python
fees = indexed["fee"]
assert fees.loc["B01":"B02"].tolist() == [40, 60]
assert fees.iloc[0:1].tolist() == [40]
numbered = pd.Series([40, 60, 80], index=[100, 200, 300])
assert numbered.loc[100:200].tolist() == [40, 60]
assert numbered.iloc[:2].index.tolist() == [100, 200]
```

## Sort values or sort the index {#sorting}

`sort_values` orders rows using column values. `sort_index` orders their labels. Both return a result by default; assigning that result makes the new order explicit. For tied values, give a deterministic secondary key. `kind="stable"` preserves tie order for a single-column sort.

```python
ranked = df.sort_values(["seats", "booking_id"], ascending=[False, True])
assert ranked["booking_id"].tolist() == ["B03", "B01", "B02", "B04"]
stable = df.sort_values("seats", kind="stable")
assert stable.iloc[:2]["booking_id"].tolist() == ["B02", "B04"]
assert indexed.sort_index(ascending=False).index[0] == "B04"
assert df.iloc[0]["booking_id"] == "B03"  # The original was not reordered.
```

## Operation order changes the question {#operation-order}

“The first two Python bookings” means filter, then take two. “Python bookings among the first two rows” means take two, then filter. They can produce different answers. Select both axes in one `.loc` when you can; it also provides a clear route for assignment in [chapter 14](reliable-workflows.md#single-loc).

```python
first_three = df.iloc[:3]
among_first = first_three.loc[first_three["workshop"].eq("Pandas")]
first_matches = df.loc[df["workshop"].eq("Pandas")].iloc[:3]
assert len(among_first) == len(first_matches) == 1
first_python = df.loc[df["workshop"].eq("Python")].iloc[:1]
python_in_first = df.iloc[:1].loc[lambda x: x["workshop"].eq("Python")]
assert first_python["booking_id"].tolist() == python_in_first["booking_id"].tolist()
different = df.iloc[:1].loc[lambda x: x["workshop"].eq("Pandas")]
assert different.empty and not first_matches.empty
```

## Practice

After sorting a table by seats, does `.loc[0]` return its first row?

??? question "Check your reasoning"
    Only if that first row happens to have label `0`. Sorting preserves labels. `.iloc[0]` returns the first position. Use an identifier index when you mean “this record” and a position when you mean “this place in the current order.”
