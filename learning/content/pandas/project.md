---
title: A complete workshop analysis
description: Apply the pandas course to an original downloadable dataset, validate its schema, produce named aggregates and export a reproducible report.
course: Pandas
lesson: CHAPTER 15 OF 15
---

# A complete workshop analysis

## Define the output before the transformation {#question}

The workshop team wants a report of **booked seats, booked value and feedback coverage by workshop** for four days in October 2026. One source row is an enrolment, which can reserve several seats. A rating belongs to the enrolment, not every reserved seat. Booked value is seats multiplied by the fictional per-seat fee; the data does not establish payments, refunds, tax or attendance.

Use the original [sample CSV](data/workshop-enrolments.csv). Save it as `workshop-enrolments.csv` in a practice folder. The compact fixture below creates the same file so this chapter also runs offline without a download. Skip the fixture-writing block if you already saved the supplied sample.

```python
from pathlib import Path
import pandas as pd

sample = """booking_id,workshop,city,seats,fee,booked_at,rating,tags
B01,Python,Pune,2,40,2026-10-01,5,"beginner,online"
B02,Pandas,Delhi,1,60,2026-10-01,,"data,online"
B03,Python,Pune,3,40,2026-10-02,4,"beginner,in-person"
B04,System Design,Delhi,1,80,2026-10-02,5,"architecture,online"
B05,Pandas,Pune,2,60,2026-10-03,3,"data,in-person"
B06,Python,Delhi,1,40,2026-10-03,,"beginner,online"
B07,System Design,Pune,2,80,2026-10-04,4,"architecture,in-person"
B08,Pandas,Delhi,1,60,2026-10-04,5,"data,online"
"""
Path("workshop-enrolments.csv").write_text(sample, encoding="utf-8")
```

## Read and validate the contract {#validate}

Explicit validation makes malformed inputs fail before they create a misleading report. Check the required columns, unique key, allowed categories, missing fields and numeric ranges. A date is parsed with a known format; ratings can be missing, but present ratings must lie between 1 and 5.

```python
df = pd.read_csv("workshop-enrolments.csv", dtype={"booking_id": "string", "seats": "Int64", "fee": "Int64"})
required = {"booking_id", "workshop", "city", "seats", "fee", "booked_at", "rating", "tags"}
if set(df.columns) != required:
    raise ValueError("Unexpected input columns")
if df["booking_id"].isna().any() or not df["booking_id"].is_unique:
    raise ValueError("Booking IDs must be present and unique")
if df[["workshop", "city", "seats", "fee", "booked_at"]].isna().any(axis=None):
    raise ValueError("Required booking fields are missing")
if not df["workshop"].isin(["Python", "Pandas", "System Design"]).all():
    raise ValueError("Unknown workshop")
if not (df["seats"].gt(0).all() and df["fee"].ge(0).all()):
    raise ValueError("Invalid seats or fee")
if not df["rating"].dropna().between(1, 5).all():
    raise ValueError("Ratings must be between 1 and 5")
df["booked_at"] = pd.to_datetime(df["booked_at"], format="%Y-%m-%d", errors="raise")
assert df.shape == (8, 8)
```

These checks describe this fixture's contract, rather than every possible booking system. A real system would also define currency, refunds, cancellations and timezone-aware event times. Do not silently broaden a validation rule just to make a failing file load.

## Derive fields and validate a join {#prepare}

Create the row measure before grouping. A small workshop catalog supplies a learning level; validate the relationship so duplicate catalog rows cannot multiply booked value. Missing catalog matches are a separate error to investigate.

```python
catalog = pd.DataFrame({"workshop": ["Python", "Pandas", "System Design"], "level": ["Foundations", "Data", "Architecture"]})
prepared = (
    df.assign(booked_value=lambda x: x["seats"] * x["fee"])
    .merge(catalog, on="workshop", how="left", validate="many_to_one", indicator=True)
)
if not prepared["_merge"].eq("both").all():
    raise ValueError("Workshop missing from catalog")
prepared = prepared.drop(columns="_merge")
assert len(prepared) == len(df)
assert prepared["booked_value"].sum() == 720
```

## Report measures and their denominators {#report}

Use named aggregation for a clear output schema. Count ratings without filling them with zero. A feedback rate measures rated **bookings divided by bookings**, not rated bookings divided by seats. Keep that denominator in the column name or accompanying explanation.

```python
report = (
    prepared.groupby("workshop", as_index=False).agg(
        bookings=("booking_id", "size"),
        seats=("seats", "sum"),
        booked_value=("booked_value", "sum"),
        rated_bookings=("rating", "count"),
        mean_rating=("rating", "mean"),
    )
    .assign(feedback_rate=lambda x: x["rated_bookings"] / x["bookings"])
    .sort_values("workshop")
    .reset_index(drop=True)
)
assert report["seats"].sum() == 13
assert report["booked_value"].sum() == 720
python = report.set_index("workshop").loc["Python"]
assert python["bookings"] == 3 and python["seats"] == 6
assert python["booked_value"] == 240
assert python["mean_rating"] == 4.5
assert python["feedback_rate"] == 2 / 3
```

| Workshop | Bookings | Seats | Booked value | Rated bookings | Mean rating |
| --- | ---: | ---: | ---: | ---: | ---: |
| Pandas | 3 | 4 | 240 | 2 | 4.0 |
| Python | 3 | 6 | 240 | 2 | 4.5 |
| System Design | 2 | 3 | 240 | 2 | 4.5 |

All three workshops happen to have the same booked value in this fixture. That is an arithmetic result from the sample, not evidence about pricing strategy or future demand.

## Create a daily view and inspect tags {#reshape}

Pivot daily totals for a wide report. Separately explode tags to count tag occurrences. Preserve the booking-grain measure; summing booked value after tag explosion would count each booking twice in this dataset.

```python
daily = prepared.pivot_table(index="booked_at", columns="workshop", values="seats", aggfunc="sum", fill_value=0, observed=True)
assert daily.sum(axis=1).tolist() == [3, 4, 3, 3]
tag_rows = prepared.assign(tag=prepared["tags"].str.split(",")).explode("tag")
tag_counts = tag_rows["tag"].value_counts()
assert tag_counts.loc["online"] == 5
assert len(tag_rows) == 16
assert tag_rows["booking_id"].nunique() == len(prepared)
```

## Export and communicate the result {#export}

Save a stable row order and omit the incidental index from CSV. Float output may be rounded for display; retain unrounded calculations for subsequent analysis. A report should state the input snapshot, time window, units and missing-data policy alongside its numbers.

```python
report.to_csv("workshop-summary.csv", index=False, float_format="%.4f")
daily.to_csv("daily-seats.csv", index_label="booked_at")
reloaded = pd.read_csv("workshop-summary.csv")
assert reloaded["booked_value"].sum() == 720
assert "Unnamed: 0" not in reloaded.columns
print(report.to_string(index=False))
```

The next useful question might be how attendance differs from bookings, but this dataset cannot answer it. Identify the additional fields you would need rather than treating a convenient measure as a replacement.

## Keep learning {#next}

Try a second city, a duplicate identifier, an unknown workshop, an unrated booking and an invalid date. Predict which checks should fail. Then add a cancellation field with a documented meaning and recalculate a separate net-booked measure without overwriting the original gross measure.

Use the [pandas user guide](https://pandas.pydata.org/docs/user_guide/index.html) and [cookbook](https://pandas.pydata.org/docs/user_guide/cookbook.html) for further techniques. The [topic index](coverage.md) makes every supplied primer topic easy to revisit.

## Practice

The exported CSV rounds `feedback_rate` to four decimals. Should a later report recompute overall feedback by averaging those displayed rates?

??? question "Check your reasoning"
    No. Add the underlying rated-booking counts and booking counts, then divide. An unweighted average gives small and large groups equal influence, and rounded display values add avoidable error. Keep counts alongside rates so their denominators remain inspectable.
