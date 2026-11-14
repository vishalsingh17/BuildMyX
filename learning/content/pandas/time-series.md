---
title: Time series, resampling and time zones
description: Build timestamp and period indexes, resample with explicit boundaries, interpolate thoughtfully and distinguish localization from timezone conversion.
course: Pandas
lesson: CHAPTER 10 OF 15
---

# Time series, resampling and time zones

## Represent instants and create a time range {#ranges}

`Timestamp` represents an instant, `Timedelta` a duration, and `DatetimeIndex` an axis of timestamps. `date_range` generates a regular schedule using a start plus periods or an end. A frequency describes the schedule; it does not establish that every expected observation actually arrived.

```python
import pandas as pd

hours = pd.date_range("2026-10-01 09:00", periods=4, freq="h")
visits = pd.Series([2, 4, 1, 3], index=hours, name="visits")
assert visits.loc["2026-10-01 10:00"] == 4
assert hours[1] - hours[0] == pd.Timedelta(hours=1)
assert pd.Timestamp("2026-10-01") == hours[0].normalize()
business = pd.date_range("2026-10-02", periods=2, freq="B")
assert business[1] == pd.Timestamp("2026-10-05")
assert pd.Timestamp("2026-10-02") + pd.offsets.BDay(1) == business[1]
```

Use current offset aliases such as `h`, `min` and `ME` (month end). Older `H`, `T` and datetime-offset `M` examples can be deprecated or rejected. Business days skip weekends by default, not every local public holiday; a custom calendar is needed for that.

## Parse and index real records {#parse}

`to_datetime` converts input into timestamps. Choose a known format when possible and decide how invalid data should fail. `errors="coerce"` converts invalid dates to `NaT`, which should then be counted and investigated. It is not an excuse to ignore parsing failures.

```python
raw = pd.Series(["2026-10-01", "bad-date", "2026-10-03"])
parsed = pd.to_datetime(raw, format="%Y-%m-%d", errors="coerce")
assert parsed.isna().sum() == 1
records = pd.DataFrame({"at": hours, "visits": visits.to_numpy()})
indexed = records.set_index("at").sort_index()
assert indexed.loc["2026-10-01", "visits"].sum() == 10
assert indexed.index.is_monotonic_increasing
```

Ambiguous strings such as `01/02/2026` need a documented convention. For timestamps carrying offsets, `utc=True` is often useful to establish one common timeline before analysis.

## Resample into time bins {#resampling}

`resample` is a time-based grouping operation. It usually requires a datetime-like index, or an explicit `on` column. Choose an aggregation that fits the measure: sum event counts, average sampled temperatures, and define how to summarize a balance. Set `closed`, `label` and the bin origin when boundaries matter.

```python
two_hour = visits.resample("2h", origin="start", closed="left", label="left").sum()
assert two_hour.tolist() == [6, 4]
assert two_hour.index[0] == hours[0]
minimums = visits.resample("2h", origin="start").min()
assert minimums.tolist() == [2, 1]
daily = indexed.resample("D")["visits"].sum(min_count=1)
assert daily.iloc[0] == 10
```

A left-closed bin starting at 09:00 contains 09:00 and excludes 11:00 when its width is two hours. `asfreq` changes the grid without aggregating observations; resampling with `sum` or `mean` calculates a value per bin. A missing entire day may deserve “unknown,” not zero, depending on data collection.

## Upsample and interpolate deliberately {#upsampling}

Upsampling creates a denser time grid and therefore introduces gaps. A forward fill means the previous observed value remains applicable. Interpolation estimates intermediate values. Neither invents a measured observation, and neither should be applied to transaction counts merely to make a chart smooth.

```python
temperature = pd.Series([10.0, 14.0], index=pd.date_range("2026-10-01 09:00", periods=2, freq="2h"))
hourly = temperature.resample("h").asfreq()
assert pd.isna(hourly.iloc[1])
assert hourly.ffill().iloc[1] == 10
estimated = hourly.interpolate(method="time", limit_area="inside")
assert estimated.iloc[1] == 12.0
irregular = pd.Series([0.0, None, 8.0], index=pd.to_datetime(["2026-10-01 09:00", "2026-10-01 10:00", "2026-10-01 13:00"]))
assert irregular.interpolate(method="time").iloc[1] == 2.0
```

`method="time"` weights by elapsed time, whereas ordinary linear interpolation uses position. Avoid filling arbitrarily long gaps: use a justified `limit` and retain a flag identifying estimated values.

## Localize a clock time; convert an instant {#timezones}

`tz_localize` attaches a timezone to **naive local times**. `tz_convert` changes the display timezone for **already aware instants**, preserving their place on the timeline. A date alone does not tell you its timezone. Store instants in a consistent timezone, and convert to the user's reporting zone when grouping by local day.

```python
local = pd.DatetimeIndex(["2026-10-01 09:00"]).tz_localize("Asia/Kolkata")
utc = local.tz_convert("UTC")
assert utc[0].hour == 3 and utc[0].minute == 30
assert utc[0] == local[0]
aware = pd.to_datetime(pd.Series(["2026-10-01T03:30:00Z"]), utc=True)
assert aware.dt.tz_convert("Asia/Kolkata").dt.hour.iloc[0] == 9
```

Daylight saving creates clock times that never occur and times that occur twice. pandas raises on ambiguous or nonexistent localization unless you supply a policy. Choose it based on the source system rather than silently shifting data.

```python
nonexistent = pd.DatetimeIndex(["2026-03-08 02:30"]).tz_localize("America/New_York", nonexistent="NaT")
assert pd.isna(nonexistent[0])
ambiguous = pd.DatetimeIndex(["2026-11-01 01:30"]).tz_localize("America/New_York", ambiguous="NaT")
assert pd.isna(ambiguous[0])
```

## Periods represent spans {#periods}

A `Period` represents an interval such as a month or quarter, rather than one instant. `period_range` constructs a PeriodIndex. `.asfreq` converts to another period frequency, choosing the start or end boundary; `.to_timestamp` turns a chosen boundary into an instant. A monthly Period still uses `freq="M"`; it is different from the `ME` datetime offset.

```python
months = pd.period_range("2026-01", periods=3, freq="M")
sales = pd.Series([10, 12, 15], index=months)
assert months[0] + 1 == pd.Period("2026-02", freq="M")
assert months[0].asfreq("D", how="end") == pd.Period("2026-01-31", freq="D")
assert sales.to_timestamp(how="start").index[1] == pd.Timestamp("2026-02-01")
quarter = pd.Period("2026Q1", freq="Q-DEC")
assert quarter.asfreq("M", how="end") == pd.Period("2026-03", freq="M")
```

Timezone-aware instants and abstract calendar periods serve different purposes. Converting to periods can discard timezone information; decide the reporting timezone first if the calendar boundary matters.

## Practice

Two systems record `09:00` with no offset. One operates in Delhi and the other in London. Should you concatenate them and localize everything to UTC?

??? question "Check your reasoning"
    No. First localize each naive clock time to its source timezone, resolving daylight-saving ambiguity where relevant, then convert both to UTC. Attaching UTC to a local clock reading changes the represented instant instead of converting it.
