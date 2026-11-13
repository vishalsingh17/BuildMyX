---
title: Reshape tables and use MultiIndex
description: Work with hierarchical row and column labels, transpose, stack and unstack, then pivot, melt and cross-tabulate with clear aggregation rules.
course: Pandas
lesson: CHAPTER 08 OF 15
---

# Reshape tables and use MultiIndex

## More than one label can identify an axis {#multiindex}

A MultiIndex is an index of tuples with named levels. It can describe rows, columns or both. Instead of encoding `Pune/Python` into one string, preserve `city` and `workshop` as two dimensions. `from_tuples`, `from_arrays` and `from_product` are useful constructors; `set_index([col1, col2])` builds one from existing columns.

```python
import pandas as pd

index = pd.MultiIndex.from_product([["Delhi", "Pune"], ["Pandas", "Python"]], names=["city", "workshop"])
seats = pd.Series([2, 1, 3, 5], index=index, name="seats")
assert seats.loc[("Pune", "Python")] == 5
assert seats.loc["Delhi"].to_dict() == {"Pandas": 2, "Python": 1}
array_index = pd.MultiIndex.from_arrays([["Pune", "Pune"], ["A", "B"]], names=["city", "id"])
assert array_index.nlevels == 2
```

Sorted MultiIndexes make range selection more predictable. `.xs(value, level=...)` selects a cross-section. Use named levels when practical so code remains clear if the level order changes.

## Hierarchical columns and dropping a level {#dropping-levels}

Aggregating with multiple functions can produce MultiIndex columns. `droplevel` removes a level's labels; it does **not** aggregate or combine data. Removing a distinguishing level can create duplicate labels. Verify uniqueness before assuming one remaining label identifies one column.

```python
columns = pd.MultiIndex.from_tuples([("seats", "sum"), ("seats", "max")], names=["measure", "stat"])
summary = pd.DataFrame([[8, 5]], index=["all"], columns=columns)
assert summary.loc["all", ("seats", "sum")] == 8
flat = summary.droplevel("measure", axis="columns")
assert flat.columns.tolist() == ["sum", "max"]
assert flat.columns.is_unique
assert seats.xs("Pune", level="city").sum() == 8
```

For row indexes, `droplevel` returns an object with fewer index levels. `reset_index(level=...)` instead preserves the removed labels as columns, which is often better for export.

## Transpose swaps the axes {#transpose}

`.T` or `.transpose()` makes row labels into column labels and vice versa. The operation swaps orientation; it does not recalculate measures. Mixed-type columns can be coerced when they become mixed rows, so a transposed table may have different dtypes and need more memory.

```python
wide = seats.unstack("workshop")
assert wide.loc["Pune", "Python"] == 5
transposed = wide.T
assert transposed.loc["Python", "Pune"] == 5
pd.testing.assert_frame_equal(transposed.T, wide)
```

## Stack and unstack move index levels {#stack-unstack}

`unstack` moves an index level into columns. `stack` moves a column level into the row index. This is useful for switching between chart-friendly wide data and group-friendly long data. A missing combination can create an empty cell, and duplicate index combinations cannot be unstacked without an aggregation decision.

```python
long_again = wide.stack()
pd.testing.assert_series_equal(long_again.rename("seats"), seats)
observed = pd.Series([2, 5], index=pd.MultiIndex.from_tuples([("Delhi", "Pandas"), ("Pune", "Python")], names=["city", "workshop"]))
gaps = observed.unstack("workshop")
assert pd.isna(gaps.loc["Delhi", "Python"])
filled = observed.unstack("workshop", fill_value=0)
assert filled.loc["Delhi", "Python"] == 0
```

Zero is appropriate only when an absent combination genuinely means none occurred. In pandas 3, `stack` uses its modern implementation; old examples that rely on previous `dropna` or sorting defaults need review. Check actual index order when comparing round trips.

## Pivot a table, with or without aggregation {#pivot-table}

`pivot` expects one value for each index/column pair. `pivot_table` can aggregate repeated pairs. Make `aggfunc`, missing-key policy and category behavior explicit. The default aggregation is a mean, which is often wrong for a seat-count question.

```python
bookings = pd.DataFrame({"city": ["Pune", "Pune", "Delhi"], "workshop": ["Python", "Python", "Pandas"], "seats": [2, 3, 1]})
pivoted = pd.pivot_table(bookings, index="city", columns="workshop", values="seats", aggfunc="sum", fill_value=0, observed=True)
assert pivoted.loc["Pune", "Python"] == 5
assert pivoted.loc["Delhi", "Python"] == 0
unique_pairs = bookings.groupby(["city", "workshop"], as_index=False)["seats"].sum()
without_aggregation = unique_pairs.pivot(index="city", columns="workshop", values="seats")
assert without_aggregation.loc["Pune", "Python"] == 5
```

`margins=True` can add totals. A margin for a mean is computed from underlying observations, not necessarily the unweighted mean of displayed subgroup means. Keep the denominator visible.

## Melt wide columns into observations {#melt}

`pd.melt` or `.melt` turns measured columns into a variable column and a value column while preserving identifier columns. This is also called unpivoting. It increases row count, not the number of underlying observations; each output row now has a different grain.

```python
monthly = pd.DataFrame({"workshop": ["Python", "Pandas"], "oct": [5, 3], "nov": [6, 4]})
tidy = monthly.melt(id_vars="workshop", value_vars=["oct", "nov"], var_name="month", value_name="seats")
assert tidy.shape == (4, 3)
assert tidy.loc[(tidy["workshop"] == "Pandas") & (tidy["month"] == "nov"), "seats"].iloc[0] == 4
restored = tidy.pivot(index="workshop", columns="month", values="seats")
assert restored.loc["Python", "oct"] == 5
```

## Cross-tabulate categories {#crosstab}

`crosstab` counts combinations of categories by default. It can also aggregate a `values` Series with an explicit `aggfunc`. `normalize="index"` gives row proportions; `normalize="columns"` gives column proportions. Those denominators answer different questions.

```python
counts = pd.crosstab(bookings["city"], bookings["workshop"])
assert counts.loc["Pune", "Python"] == 2
proportions = pd.crosstab(bookings["city"], bookings["workshop"], normalize="index")
assert proportions.loc["Pune", "Python"] == 1.0
totals = pd.crosstab(bookings["city"], bookings["workshop"], values=bookings["seats"], aggfunc="sum")
assert totals.loc["Pune", "Python"] == 5
```

## Practice

An input has two bookings for the same city and workshop. Should you use `pivot` or `pivot_table` to total their seats?

??? question "Check your reasoning"
    Use `pivot_table(..., aggfunc="sum")`, or aggregate first and then pivot. `pivot` requires unique city/workshop pairs and cannot decide how duplicate records should be combined. A mean or maximum would answer a different question.
