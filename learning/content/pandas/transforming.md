---
title: Transform a table
description: Add and remove columns, use assign and map, choose the right apply axis, split and explode text, and use trusted query expressions.
course: Pandas
lesson: CHAPTER 05 OF 15
---

# Transform a table

## Add, insert, remove and retrieve columns {#columns}

Column assignment changes a DataFrame. A scalar broadcasts; a list follows row order; a Series aligns by index labels. `insert` chooses a column position and usually rejects an existing name. `pop` removes a column and returns it; `del` removes without returning it. `drop(columns=...)` returns a new table by default.

```python
import pandas as pd

df = pd.DataFrame({"workshop": ["Python", "Pandas", "Python"], "seats": [2, 1, 3], "fee": [40, 60, 40]})
df["amount"] = df["seats"] * df["fee"]
df.insert(0, "booking_id", ["B01", "B02", "B03"])
df["source"] = "web"
removed = df.pop("source")
assert removed.tolist() == ["web", "web", "web"]
assert df["amount"].tolist() == [80, 60, 120]
smaller = df.drop(columns=["amount"])
assert "amount" in df and "amount" not in smaller
temporary = smaller.copy()
temporary["note"] = "draft"
del temporary["note"]
```

## Assign several derived columns {#assign}

`assign` returns a DataFrame and works well in a readable method chain. Callable values receive the intermediate table. Later assignments can use columns created earlier in the same call. A callable prevents accidentally reaching back to an earlier variable after filtering or renaming.

```python
enriched = (
    df.assign(
        amount=lambda x: x["seats"] * x["fee"],
        discount=lambda x: x["amount"] * 0.10,
    )
    .assign(net=lambda x: x["amount"] - x["discount"])
)
assert enriched["net"].tolist() == [72.0, 54.0, 108.0]
assert "discount" not in df
```

Chaining is a way to express dependencies, not a reason to pack everything into one expression. Name an intermediate table when it deserves its own validation or explanation.

## Map a Series through a dictionary {#map}

`Series.map` substitutes one value at a time using a mapping or callable. An unmapped dictionary key normally becomes missing. That can reveal an unknown code; it can also silently lose information if you ignore it. Use `replace` when unlisted values should stay unchanged, or explicitly validate mapping coverage.

```python
labels = {"Python": "Language", "Pandas": "Data"}
topics = df["workshop"].map(labels)
assert topics.tolist() == ["Language", "Data", "Language"]
codes = pd.Series(["PY", "PD", "XX"], dtype="string")
mapped = codes.map({"PY": "Python", "PD": "Pandas"})
assert pd.isna(mapped.iloc[2])
assert codes.replace({"PY": "Python"}).iloc[2] == "XX"
```

## Apply functions at the intended level {#apply}

`DataFrame.apply(func)` passes **each column Series** to `func` by default (`axis=0`). `axis=1` passes each row Series. `Series.apply` passes each element for an ordinary scalar function. Before using row-wise apply, see whether arithmetic, `.str`, `.dt`, `.map` or a join expresses the operation directly. Vectorization avoids repeated Python calls; speed still depends on the operation and dtype.

```python
numeric = df[["seats", "fee"]]
spans = numeric.apply(lambda col: col.max() - col.min())
assert spans.to_dict() == {"seats": 2, "fee": 20}
row_amount = df.apply(lambda row: row["seats"] * row["fee"], axis=1)
pd.testing.assert_series_equal(row_amount, df["amount"], check_names=False)
assert df["workshop"].apply(len).tolist() == [6, 6, 6]
assert df["workshop"].str.len().tolist() == [6, 6, 6]
```

The row-wise example is deliberately simple so you can compare it with `df["seats"] * df["fee"]`. Do not mutate the object supplied to `apply`; produce a result and assign it explicitly.

## Split text, then explode a list column {#split-explode}

`.str.split` returns lists unless `expand=True` requests separate columns. `explode` makes one row per list element and repeats the other columns. Empty lists yield a missing element; exploding a set has no stable element order. Use ordered lists if order matters.

```python
tagged = pd.DataFrame({"id": ["B01", "B02"], "tags": ["python,online", "pandas"]})
long = tagged.assign(tag=tagged["tags"].str.split(",")).explode("tag", ignore_index=True)
assert long["id"].tolist() == ["B01", "B01", "B02"]
assert long["tag"].tolist() == ["python", "online", "pandas"]
parts = tagged["tags"].str.split(",", expand=True)
assert parts.shape == (2, 2)
assert pd.isna(parts.iloc[1, 1])
```

If you explode two columns together, their lists must have matching lengths in every row. Also remember that repeating an amount across tags does not create extra revenue: summing after explosion can double-count the original record.

## Evaluate an expression and query rows {#expressions}

`eval` calculates a column expression; `query` selects rows using an expression. `@name` accesses a local variable and backticks quote column names with spaces. Both accept trusted expressions authored in your code. Neither is a sandbox for arbitrary user input.

```python
calculated = df.eval("gross = seats * fee", engine="python")
assert calculated["gross"].tolist() == [80, 60, 120]
assert "gross" not in df
minimum = 2
selected = df.query("seats >= @minimum and fee <= 40", engine="python")
assert selected["booking_id"].tolist() == ["B01", "B03"]
pd.testing.assert_frame_equal(selected, df.loc[(df["seats"] >= minimum) & (df["fee"] <= 40)])
```

The explicit Python engine makes this example independent of optional `numexpr`. A simple bracket expression is often easier to debug and has clearer type checking. Expression evaluation can help for some large numeric workloads, but should not be assumed faster for every table.

## Practice

You split one booking into three tag rows. Can you now sum its repeated `amount` column to calculate total booked value?

??? question "Check your reasoning"
    That would count the same booking three times. Aggregate at the booking grain before exploding, deduplicate by a verified booking key for that measure, or explicitly allocate value across tags if that is the question. The number of rows changed; the business transaction did not.
