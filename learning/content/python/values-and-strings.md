---
title: Values, strings and formatting
description: Understand numbers, truth values and strings, then format readable output and search or replace text correctly.
course: Python
lesson: CHAPTER 02 OF 15
---

# Values, strings and formatting

A value's type determines which operations make sense. `3 + 4` adds numbers; `"3" + "4"` joins text. Explicit conversion is useful at boundaries such as user input, files and APIs.

## Numeric types and readable literals {#numbers}

Python's `int` represents whole numbers, `float` represents binary floating-point numbers, and `complex` represents a real and imaginary part. Integers grow as needed within available memory. Floats have finite precision; they are not exact decimal arithmetic.

```python
budget = 2_400_000  # Underscores are visual separators, not part of the value.
assert budget == 2400000
assert 17 / 4 == 4.25
assert 17 // 4 == 4
assert 17 % 4 == 1
assert -17 // 4 == -5  # Floor division rounds toward negative infinity.
assert (2 + 3j).imag == 3

from decimal import Decimal
assert Decimal("0.1") + Decimal("0.2") == Decimal("0.3")
```

Use integer minor units or an appropriate decimal model for money. Writing `Decimal(0.1)` first introduces a binary float; `Decimal("0.1")` starts from an exact decimal string. `type(value)` helps inspect a value, while `isinstance` also respects inheritance.

## Booleans and truthiness {#booleans}

`True` and `False` are Boolean values. Empty containers, empty strings, zero and `None` are false in a condition; most other objects are true. Python uses `and`, `or` and `not`, rather than `&&` and `||`.

```python
assert not bool(0)
assert not bool([])
assert bool("0")           # It is a non-empty string.
assert bool((False,))      # It is a non-empty tuple.
assert isinstance(True, int)
assert True + True == 2    # Legal, but usually not the clearest business logic.
assert ("" or "untitled") == "untitled"
assert (0 and "unused") == 0
```

`and` and `or` short-circuit and return an **operand**, not necessarily a Boolean. `value or default` also replaces legitimate falsy values such as `0`. If only `None` means missing, check `value is None` instead.

## Strings are immutable sequences {#strings}

A `str` is Unicode text. Indexing returns a one-character string, and slicing returns another string. Changing text means creating a new string; methods such as `strip`, `replace` and `casefold` do not modify the original.

```python
label = "  Parcel A  "
clean = label.strip().casefold()
assert clean == "parcel a"
assert label.startswith("  ")
assert clean[0] == "p"
assert clean[-1] == "a"
assert clean[:6] == "parcel"
assert " / ".join(["north", "rack 2"]) == "north / rack 2"
assert "north,rack 2".split(",") == ["north", "rack 2"]
assert "line one\nline two".count("\n") == 1
assert "parcel".capitalize() == "Parcel"
assert "ready".upper() == "READY"
assert "EAST".lower() == "east"
assert "rack".rjust(6, "0") == "00rack"
assert "rack".center(8, "-") == "--rack--"
```

Use quotes consistently, escape a quote or choose the other quote character, and use `\n` for a newline. Text and `bytes` are different: encode text to bytes and decode bytes with a known encoding, typically UTF-8.

`capitalize` changes the first character to title case and lowercases the rest; `upper`, `lower` and `casefold` serve different casing tasks. `rjust` and `center` are convenient padding methods when a format specification would add little clarity.

## Three ways to format text {#formatting}

Percent formatting predates `str.format`; both remain available in Python 3. F-strings place expressions close to the surrounding text and are usually a good choice for new, direct string formatting.

```python
item, count = "notebook", 4
assert "%s x%d" % (item, count) == "notebook x4"
assert "{} x{}".format(item, count) == "notebook x4"
assert "{1} x{0}".format(count, item) == "notebook x4"
assert "{name} x{n}".format(name=item, n=count) == "notebook x4"
assert f"{item} x{count}" == "notebook x4"
```

“Old style” and “new style” in older material refer to the formatting APIs, not to a need to run an old interpreter. Logging APIs may deliberately use percent-style arguments for deferred formatting.

## Align, pad and truncate strings {#string-layout}

Inside a format specification, `<` aligns left, `>` aligns right and `^` centers. Width is a **minimum**; it does not truncate. For strings, `.precision` limits the number of characters included. A fill character comes before the alignment symbol.

```python
word = "crate"
assert f"{word:>8}" == "   crate"
assert f"{word:<8}" == "crate   "
assert f"{word:_^9}" == "__crate__"
assert f"{word:.3}" == "cra"
assert f"{word:<8.3}" == "cra     "  # Truncate, then pad.
assert "%-8.3s" % word == "cra     "
assert "{:>8.3}".format(word) == "     cra"
```

These operations count string characters, not terminal display columns or user-perceived grapheme clusters. Emojis and combining characters can make aligned Unicode output more complicated.

## Format numbers and dates {#numeric-formatting}

Use `d` for decimal integers, `f` for fixed-point output, `.2f` for two digits after the decimal point and `%` for a percentage. Formatting changes representation, not the stored value.

```python
from datetime import datetime

assert f"{27:04d}" == "0027"
assert f"{3.5:07.2f}" == "0003.50"
assert f"{4:+d}" == "+4"
assert f"{4: d}" == " 4"
assert f"{-4:d}" == "-4"
assert f"{255:x}" == "ff"
assert f"{255:#x}" == "0xff"
assert f"{10:#o}" == "0o12"
assert f"{10:#b}" == "0b1010"
assert f"{1250000:,}" == "1,250,000"
assert f"{7 / 8:.1%}" == "87.5%"
assert f"{datetime(2025, 4, 9, 8, 30):%Y-%m-%d %H:%M}" == "2025-04-09 08:30"
assert "%.2f" % 3.5 == "3.50"
```

Zero-padding, an explicit sign and base prefixes all consume field width. Not every format code supports every type: formatting a floating-point number with `d` raises `ValueError`.

## Find a substring {#substring-search}

`find()` returns the first matching position or `-1`. `index()` returns the matching position but raises `ValueError` if nothing matches. Both accept optional start/end bounds.

```python
text = "rack-a / rack-b"
assert text.find("rack") == 0
assert text.find("rack", 1) == 9
assert text.find("missing") == -1
assert text.index("/") == 7
assert "rack-b" in text
```

Do not test `if text.find(part)`: position zero is falsy and `-1` is truthy. Use `part in text` for membership, or compare the result with `-1`.

## Replace text with a regular expression {#regular-expressions}

Use `str.replace` for literal replacement and `re.sub` when a pattern describes the match. Raw strings such as `r"\s+"` avoid Python consuming backslashes before the regular-expression engine reads them.

```python
import re

raw = "rack   12\t ready"
assert re.sub(r"\s+", " ", raw) == "rack 12 ready"
assert re.sub(r"(rack) (\d+)", r"\1-\2", "rack 12") == "rack-12"
assert re.sub(re.escape("a.b"), "item", "a.b and axb") == "item and axb"
```

Escape user-supplied literal search text with `re.escape` before embedding it in a pattern. Keep patterns understandable; a long regex is not automatically better than several clear string operations.

## Try it yourself

Format a report row with a name shortened to six characters, a four-digit zero-padded quantity and a one-decimal percentage.

??? question "Does a width of eight guarantee an eight-character result?"
    No. Width specifies the minimum space. A longer value remains longer unless you explicitly truncate it. For strings, combine width with precision when you need both behaviors.

[Next: Collections →](collections.md){ .md-button .md-button--primary }
