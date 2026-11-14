---
title: Type hints that explain your interfaces
description: Use modern annotations, aliases and unions while recognizing legacy typing syntax and the limits of runtime enforcement.
course: Python
lesson: CHAPTER 06 OF 15
---

# Type hints that explain your interfaces

Type annotations communicate intended inputs and outputs to readers, editors and static checkers. Python does **not** normally enforce them at runtime. Validate external data when correctness depends on its shape or value.

## Annotate functions and containers {#annotations}

```python
def greeting(name: str) -> str:
    return f"Welcome, {name}"

def total_weights(weights: list[float]) -> float:
    return sum(weights)

assert greeting("Sam") == "Welcome, Sam"
assert total_weights([1.5, 2.5]) == 4.0
```

`-> None` means the function is not intended to return a useful result. A type hint is not a cast. Adding `: int` does not turn a string into an integer.

## Modern and legacy container syntax {#container-types}

Built-in generics such as `list[int]` and `dict[str, int]` are supported from Python 3.9. Older code often uses `typing.List`, `Dict` and `Tuple`. Recognize both; prefer the modern built-in spelling when your supported versions allow it.

```python
from typing import Dict, List, Tuple

old_counts: Dict[str, int] = {"east": 3}
new_counts: dict[str, int] = {"east": 3}
old_codes: List[str] = ["A", "B"]
new_codes: list[str] = ["A", "B"]
old_point: Tuple[int, int] = (2, 4)
new_point: tuple[int, int] = (2, 4)
assert old_counts == new_counts
assert old_codes == new_codes
assert old_point == new_point
```

Use a concrete `list` or `dict` when mutation or that exact API matters. For a read-only input interface, consider `collections.abc.Sequence` or `Mapping`; this can accept suitable implementations without promising a mutable list or dictionary.

## Simple and composite type aliases {#aliases}

An alias gives a useful name to a repeated type expression. The `type` statement below requires Python 3.12+. It creates a type alias, not a new runtime class and not a data validator.

```python
from collections.abc import Mapping, Sequence
from typing import TypeAlias

LegacyVector: TypeAlias = list[float]  # Recognize this pre-3.12 style.
type Vector = list[float]
type Address = tuple[str, int]
type Options = Mapping[str, str]
type Endpoint = tuple[Address, Options]

def endpoint_names(endpoints: Sequence[Endpoint]) -> list[str]:
    return [f"{address[0]}:{address[1]}" for address, options in endpoints]

assert endpoint_names([(("localhost", 8000), {"mode": "test"})]) == ["localhost:8000"]
```

Without an explicit alias declaration, `Vector = list[float]` is also a common compatible spelling. Keep aliases meaningful; nesting several aliases can obscure a simple data shape if names do not clarify the domain.

## Union and Optional {#unions}

`int | str` means one of two types; it does not use Boolean `or`. The older equivalent is `Union[int, str]`. `Optional[T]` means `T | None`, regardless of whether an argument has a default value.

```python
from typing import Optional, Union

def normalize_code(value: int | str) -> str:
    return str(value).strip()

def find_zone(code: str) -> str | None:
    return {"A": "east"}.get(code)

def old_find_zone(code: str) -> Optional[str]:
    return find_zone(code)

value: Union[int, str] = 7
assert normalize_code(value) == "7"
assert find_zone("missing") is None
assert old_find_zone("A") == "east"
assert Union[int, str, int] == Union[str, int]
assert Union[Union[int, str], float] == Union[int, str, float]
assert Union[int] is int
```

Union order and duplicates do not create distinct choices. You cannot meaningfully re-subscript a completed union with another type. An alias created with `type` can affect when a checker expands a nested union; do not depend on runtime representations of aliases as your validation strategy.

An omittable parameter and a nullable value are separate concepts:

```python
def retries(count: int = 3) -> int:
    return count

def nullable_label(label: str | None) -> str:
    return "untitled" if label is None else label

def optional_label(label: str | None = None) -> str:
    return nullable_label(label)

assert retries() == 3
assert nullable_label(None) == "untitled"  # Still requires an argument.
assert optional_label() == "untitled"
```

## Any trades checking for flexibility {#any}

`Any` permits arbitrary operations from a checker's perspective. It can be useful at a genuinely dynamic boundary, but it does not make those operations safe at runtime. `object` is a useful alternative when a value may have any type and callers must narrow it before using a type-specific API.

```python
from typing import Any

def display_dynamic(value: Any) -> str:
    return str(value)

def uppercase_if_text(value: object) -> str:
    return value.upper() if isinstance(value, str) else "not text"

assert display_dynamic({"count": 2}) == "{'count': 2}"
assert uppercase_if_text(2) == "not text"
```

## Tuple and list type shapes {#tuple-and-list}

`tuple[int, str]` describes a fixed two-position record. `tuple[int, ...]` describes a variable-length tuple of integers. `tuple[()]` describes an empty tuple. `tuple[Any, ...]` allows arbitrary element types. In legacy syntax, these are `Tuple[int, str]`, `Tuple[int, ...]`, `Tuple[()]` and `Tuple[Any, ...]`.

`list[int]` describes an arbitrary-length list whose elements are integers; `list[int | str]` allows either type in each position. A nested `list[dict[str, str]]` describes rows of string-valued mappings. A union of lists, `list[int] | list[str]`, has a different meaning from a list of union elements.

```python
pair: tuple[int, str] = (3, "east")
trail: tuple[int, ...] = (1, 2, 3)
empty: tuple[()] = ()
mixed: list[int | str] = [1, "A"]
rows: list[dict[str, str]] = [{"zone": "east"}]
assert pair[1] == "east" and trail[-1] == 3
assert not empty and len(mixed) == 2 and rows[0]["zone"] == "east"
```

## Try it yourself

Annotate a lookup function that accepts a sequence of `(code, zone)` tuples and returns the zone or `None`. Keep lookup behavior working when no matching code exists; annotations alone cannot implement that behavior.

??? question "Does Optional[int] mean the caller can omit the argument?"
    No. It means an integer or `None` is an allowed value. The function needs a default value in its signature if callers should be able to omit that argument.

[Next: Lambdas and clearer alternatives →](lambdas.md){ .md-button .md-button--primary }
