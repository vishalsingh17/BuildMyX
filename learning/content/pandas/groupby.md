---
title: Group and aggregate
description: Split data into groups, name aggregates, distinguish size from count, collect lists, sample deterministically and select the largest records per group.
course: Pandas
lesson: CHAPTER 07 OF 15
---

# Group and aggregate

## Split, calculate and combine {#groupby}

`groupby` splits records by a key, applies a calculation to each group and combines the results. First decide what one input row represents and what one output row should represent. Here, each input is one booking and each output is one workshop summary.

```python
import pandas as pd

df = pd.DataFrame({
    "id": ["B01", "B02", "B03", "B04", "B05", "B06"],
    "workshop": ["Python", "Pandas", "Python", "Pandas", "Python", None],
    "city": ["Pune", "Delhi", "Pune", "Pune", "Delhi", "Delhi"],
    "seats": [2, 1, 3, 2, 1, 1],
    "rating": [5.0, None, 4.0, 3.0, None, 5.0],
})
by_topic = df.groupby("workshop")["seats"].sum()
assert by_topic.to_dict() == {"Pandas": 3, "Python": 6}
by_pair = df.groupby(["workshop", "city"])["seats"].sum()
assert by_pair.loc[("Python", "Pune")] == 5
```

Missing grouping keys are dropped by default. Set `dropna=False` if unknown-key records belong in the summary. For categorical keys, specify `observed=True` for observed combinations or `observed=False` to include unused category combinations; explicit options make your intent survive changes in defaults.

```python
including_unknown = df.groupby("workshop", dropna=False)["seats"].sum()
assert including_unknown.sum() == df["seats"].sum() == 10
assert by_topic.sum() == 9
```

## Name aggregation outputs {#named-aggregation}

Named aggregation makes a report schema clear: `output_name=(source_column, operation)`. `as_index=False` keeps grouping keys as ordinary columns. Selecting numeric measures avoids accidentally trying to average text.

```python
report = df.groupby("workshop", as_index=False).agg(
    booked_seats=("seats", "sum"),
    bookings=("id", "size"),
    rated_bookings=("rating", "count"),
    mean_rating=("rating", "mean"),
)
python = report.set_index("workshop").loc["Python"]
assert python["booked_seats"] == 6
assert python["bookings"] == 3
assert python["rated_bookings"] == 2
assert python["mean_rating"] == 4.5
```

You can also rename an existing result, but naming the aggregations at the calculation makes it easier to see which input produced each output.

## Size counts rows; count excludes missing values {#size-count}

`.size()` counts records per group, regardless of missing fields. `.count()` counts non-missing values separately for each selected column. A count of ratings is not the number of bookings.

```python
sizes = df.groupby("workshop").size()
counts = df.groupby("workshop")[["id", "rating"]].count()
assert sizes.loc["Python"] == 3
assert counts.loc["Python", "id"] == 3
assert counts.loc["Python", "rating"] == 2
```

## Collect rows into lists {#lists}

Use `agg(list)` to collect one column's values per group, or a dictionary of such aggregations for several columns. Row order within a group follows the input; sort first when the list must have a meaningful order. Separate lists are not nested full records, and very large groups can require substantial memory.

```python
ids = df.sort_values("id").groupby("workshop")["id"].agg(list)
assert ids.loc["Pandas"] == ["B02", "B04"]
collected = df.groupby("workshop").agg({"id": list, "seats": list})
assert collected.loc["Python", "seats"] == [2, 3, 1]
```

## Find the largest records in each group {#top-n}

`SeriesGroupBy.nlargest(n)` returns the largest values, typically with a MultiIndex of group key and original row index. It is useful for a quick numeric answer. To keep full records and control ties, sort by the measure plus a unique secondary key, then take `head(n)` per group.

```python
largest = df.groupby("workshop")["seats"].nlargest(2)
assert largest.loc["Python"].tolist() == [3, 2]
ranked = (
    df.sort_values(["seats", "id"], ascending=[False, True])
    .groupby("workshop", sort=False)
    .head(2)
)
assert ranked.loc[ranked["workshop"].eq("Python"), "id"].tolist() == ["B03", "B01"]
```

Decide whether ties should produce exactly N rows or all tied rows. `nlargest(..., keep="all")` can return more than N. Without a tie policy, a “top two” report can change when upstream order changes.

## Sample within groups reproducibly {#sample}

`groupby(...).sample(n=..., random_state=...)` takes a random sample separately within each group. The smallest group must contain at least `n` rows unless sampling with replacement. A fixed random state makes the same input and library version repeatable; changing row order can still change which records are selected.

```python
sample_a = df.groupby("workshop").sample(n=1, random_state=17)
sample_b = df.groupby("workshop").sample(n=1, random_state=17)
pd.testing.assert_frame_equal(sample_a, sample_b)
assert sample_a.groupby("workshop").size().eq(1).all()
```

This provides equal sample sizes per group, not a population-proportional sample. Choose the design that fits the question rather than treating any random subset as representative.

## Group by an index level or a mapper {#levels-mappers}

A MultiIndex can carry several grouping dimensions. Use `level=` to group by one or more levels. A callable mapper groups index labels by a derived value; a Series mapper aligns by index label. Mapping values should be deliberate and complete when dropping unmatched labels would lose records.

```python
indexed = df.dropna(subset=["workshop"]).set_index(["workshop", "city"])
assert indexed.groupby(level="workshop")["seats"].sum().loc["Python"] == 6
letters = pd.Series([2, 3, 4], index=["A1", "A2", "B1"])
assert letters.groupby(lambda label: label[0]).sum().to_dict() == {"A": 5, "B": 4}
mapper = pd.Series({"A1": "early", "A2": "early", "B1": "late"})
assert letters.groupby(mapper).sum().to_dict() == {"early": 5, "late": 4}
```

## Aggregate a whole DataFrame {#agg}

`DataFrame.agg` is also useful without groups. A list of operations applies each operation to each selected column. A dictionary chooses different operations per column. `axis=1` applies operations across each row; combine only measurements whose units make sense together.

```python
numeric = df[["seats", "rating"]]
stats = numeric.agg(["min", "max", "mean"])
assert stats.loc["max", "seats"] == 3
mixed = numeric.agg({"seats": ["sum", "max"], "rating": ["mean"]})
assert mixed.loc["sum", "seats"] == 10
assert pd.isna(mixed.loc["sum", "rating"])
scores = pd.DataFrame({"quiz": [2, 4], "lab": [6, 8]})
assert scores.agg("mean", axis=1).tolist() == [4.0, 6.0]
```

## Practice

Why can a grouped summary's total be lower than the original table's total, even when `sum` itself is correct?

??? question "Check your reasoning"
    Missing grouping keys may have been excluded by the default `dropna=True`. Earlier filters can also change the population. Check row counts and totals before and after each step, and decide whether an explicit unknown group belongs in the output.
