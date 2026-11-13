---
title: Read and write data
description: Save and load CSV, JSON, HTML and Excel, fix accidental CSV index columns and understand the limits of clipboard and remote input.
course: Pandas
lesson: CHAPTER 12 OF 15
---

# Read and write data

## Pick a format and a schema {#formats}

File formats preserve different information. CSV is portable text but has no complete dtype schema. JSON is convenient for structured interchange, with several orientations. HTML is a display table. Excel is familiar for manual review but needs an engine such as `openpyxl`. Specify index, date and dtype policies instead of assuming every round trip reproduces an in-memory object exactly.

All paths below are relative to a disposable practice folder. The examples generate their own input files and need no network access. Create a separate practice directory before running them against your own files.

```python
import pandas as pd
from pathlib import Path
from io import StringIO

df = pd.DataFrame({"id": ["B01", "B02"], "workshop": ["Python", "Pandas"], "seats": [2, 1], "fee": [40, 60]})
assert df["id"].is_unique
```

## Save and load CSV {#csv}

`to_csv` writes the index by default. Use `index=False` when a separate identifier column already carries identity. Pass deliberate dtypes to `read_csv`, especially for identifiers with leading zeros. `parse_dates` can parse known date columns; inspect invalid or ambiguous formats rather than relying on guesses.

```python
df.to_csv("bookings.csv", index=False, encoding="utf-8")
loaded = pd.read_csv("bookings.csv", dtype={"id": "str"})
pd.testing.assert_frame_equal(loaded, df)
assert Path("bookings.csv").read_text(encoding="utf-8").startswith("id,workshop,seats,fee")
as_text = pd.read_csv(StringIO("code,seats\n001,2\n002,1\n"), dtype={"code": "string"})
assert as_text.loc[0, "code"] == "001"
```

For larger inputs, `usecols` reduces columns and `chunksize` yields batches. A chunked calculation must still combine partial results correctly; averaging chunk means without their counts can be wrong. Passing an HTTP URL to `read_csv` is supported, but remote content can change or be unavailable. Download, version and validate important inputs for reproducible work.

## Fix an accidental Unnamed: 0 column {#unnamed-index}

An `Unnamed: 0` column often comes from a CSV that serialized an unnamed index. Determine whether it is a real field, a meaningful saved index or an accidental counter. Do not blindly delete every column whose name starts with `Unnamed`.

```python
df.to_csv("with_index.csv")
accidental = pd.read_csv("with_index.csv")
assert accidental.columns[0] == "Unnamed: 0"
restored = pd.read_csv("with_index.csv", index_col=0)
pd.testing.assert_frame_equal(restored, df)
named = df.set_index("id")
named.to_csv("named_index.csv", index_label="booking_id")
round_trip = pd.read_csv("named_index.csv", index_col="booking_id")
assert round_trip.index.name == "booking_id"
assert round_trip.loc["B01", "seats"] == 2
```

Prevent the accidental index using `index=False` at export. If the saved index is intentional, read it with `index_col=` and give it a clear name.

## JSON orientations and round trips {#json}

The JSON orientation determines how rows, columns and labels are encoded. `orient="records"` produces a list of record objects and does not retain a separate index. Other orientations, including `split` and `table`, carry different metadata. Missing values normally serialize as JSON `null`; timestamps need an explicit representation when exchanged with another system.

```python
df.to_json("bookings.json", orient="records", indent=2)
json_loaded = pd.read_json("bookings.json", orient="records")
pd.testing.assert_frame_equal(json_loaded, df)
records = df.to_dict(orient="records")
assert records[0] == {"id": "B01", "workshop": "Python", "seats": 2, "fee": 40}
indexed_dict = df.set_index("id").to_dict(orient="index")
assert indexed_dict["B02"]["seats"] == 1
```

`to_dict` creates Python objects rather than a JSON string. Choose the orientation your consumer expects; default column-oriented dictionaries differ from record-oriented lists.

## Read HTML tables {#html}

`to_html` creates a table. `pd.read_html` returns a **list of DataFrames**, because one document may contain several tables. Wrap a literal HTML string in `StringIO`; select tables by a known attribute or match when possible, then validate the result. The setup installs `lxml` for these examples.

```python
df.to_html("bookings.html", index=False, table_id="bookings")
tables = pd.read_html("bookings.html", attrs={"id": "bookings"}, flavor="lxml")
assert len(tables) == 1
pd.testing.assert_frame_equal(tables[0], df)
literal = StringIO("<table><tr><th>seats</th></tr><tr><td>3</td></tr></table>")
assert pd.read_html(literal, flavor="lxml")[0].loc[0, "seats"] == 3
```

`read_html` parses table markup; it does not execute JavaScript to render a page. If a remote page requires a browser, prefer its documented data download or API. Resolve certificate problems by configuring trusted certificates, not by turning verification off.

## Excel needs an optional engine {#excel}

`to_excel` and `read_excel` use an engine appropriate to the workbook format. Choose sheet names explicitly. A workbook may contain several sheets, headers, formulas or formatting that do not correspond to one clean data table.

```python
df.to_excel("bookings.xlsx", sheet_name="Bookings", index=False, engine="openpyxl")
excel = pd.read_excel("bookings.xlsx", sheet_name="Bookings", engine="openpyxl")
pd.testing.assert_frame_equal(excel, df)
with pd.ExcelWriter("report.xlsx", engine="openpyxl") as writer:
    df.to_excel(writer, sheet_name="Rows", index=False)
    df.groupby("workshop")["seats"].sum().to_frame().to_excel(writer, sheet_name="Summary")
assert set(pd.read_excel("report.xlsx", sheet_name=None, engine="openpyxl")) == {"Rows", "Summary"}
```

An exported workbook is a report, not a substitute for validating numeric ranges and keys before export. Keep identifiers as strings when their exact spelling matters.

## Clipboard input is a local convenience {#clipboard}

`pd.read_clipboard(sep=",")` parses the current clipboard as delimited text. Desktop access may require an OS clipboard utility and permission, so it is not a portable ingestion pipeline. Use `StringIO` or versioned files in scripts and automated checks.

This runnable demonstration simulates clipboard text. It exercises `read_clipboard` without accessing the real clipboard, including on a headless machine. The patched function is restored when the `with` block ends.

```python
from unittest.mock import patch

with patch("pandas.io.clipboard.clipboard_get", return_value="id,seats\nB01,2\nB02,1\n"):
    pasted = pd.read_clipboard(sep=",")
assert pasted["seats"].tolist() == [2, 1]
# On your desktop, after copying a CSV table, use:
# pasted = pd.read_clipboard(sep=",")
```

## Practice

Your identifier `0012` comes back from CSV as `12`. Did pandas lose a booking?

??? question "Check your reasoning"
    The row may still exist, but numeric inference changed the identifier's representation. Treat codes as strings when leading zeros matter and specify their dtype while reading. A successful parse is not proof that the intended schema survived.
