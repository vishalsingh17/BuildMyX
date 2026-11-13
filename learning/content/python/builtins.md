---
title: Useful built-ins and sorting patterns
description: Apply any, all, dir, eval, filter, isinstance, issubclass, iter, len, range, reversed, sorting and zip with predictable edge cases.
course: Python
lesson: CHAPTER 15 OF 15
---

# Useful built-ins and sorting patterns

Built-ins often express an operation more clearly than a hand-written loop. Understand their return type and boundary cases, especially whether they return a value, mutate an object or produce a one-pass iterator.

## Any and all {#any-all}

`any` asks whether at least one item is truthy. `all` asks whether every item is truthy. Both short-circuit; a generator expression can avoid doing work after the answer is known.

| Input | `any` | `all` |
| --- | --- | --- |
| All truthy values | `True` | `True` |
| All falsy values, non-empty | `False` | `False` |
| A mixture | `True` | `False` |
| Empty iterable | `False` | `True` |

```python
assert any([0, "", "ready"])
assert not all([1, True, []])
assert any([]) is False and all([]) is True
assert all(weight > 0 for weight in [2, 3, 4])
assert bool((False,))  # Container truthiness does not inspect its elements.
```

If your requirement says “a non-empty list whose every value is valid,” check non-emptiness separately; `all` on an empty list intentionally returns `True`.

## Explore names with dir {#dir}

`dir(object)` suggests available attribute names; `dir()` without an argument inspects the current scope's names. It is a discovery tool, not a complete or stable API specification. A class can customize it through `__dir__`.

```python
assert "upper" in dir("ready")
assert "append" in dir([])
```

Use `help(object)` and the official documentation to understand what an attribute means, its signature and its constraints.

## Eval is execution, not data parsing {#eval}

`eval` evaluates a Python expression and returns its value. This is suitable only when executing that expression is intentional and trusted. Passing fewer globals is **not** a secure sandbox for arbitrary input.

```python
hours = 3
assert eval("hours * 4") == 12  # A literal expression written by this program.

import ast
import json
assert ast.literal_eval("{'ready': True}") == {"ready": True}
assert json.loads('{"ready": true}') == {"ready": True}
```

Use `json.loads` for JSON data. `ast.literal_eval` accepts a constrained set of Python literal/container expressions, not a general computation language; very large or deeply nested inputs can still consume resources. Choose limits appropriate to the data source.

## Filter returns an iterator {#filter}

```python
weights = [0, 2, -1, 5]
valid = filter(lambda weight: weight > 0, weights)
assert list(valid) == [2, 5]
assert list(valid) == []
assert list(filter(None, [0, "", "A", 3])) == ["A", 3]
```

With `None` as the predicate, `filter` retains truthy items. A comprehension can be easier to read when the condition is a short expression; see [lambdas](lambdas.md#map-filter).

## Isinstance and issubclass {#type-checks}

`isinstance(value, Type)` respects inheritance; `type(value) is Type` asks for an exact type. `issubclass(Child, Parent)` checks classes rather than instances. Both accept a tuple of alternative classes, and modern Python also supports suitable unions.

```python
assert isinstance("A", (str, int))
assert isinstance(True, int)
assert not isinstance(True, float)
assert issubclass(bool, int)
assert issubclass(list, list)

def is_non_boolean_integer(value):
    return isinstance(value, int) and not isinstance(value, bool)

assert is_non_boolean_integer(3)
assert not is_non_boolean_integer(True)
```

Python 2's `unicode` name is historical; Python 3's `str` already represents Unicode text. Decide whether subclasses and Boolean-as-integer behavior fit your validation requirement.

## Iter, len and range {#iteration-tools}

`iter(value)` obtains an iterator. Its two-argument form repeatedly calls a zero-argument callable until it returns a sentinel. `len` asks an object for its length, normally through `__len__`. `range` describes an immutable integer sequence without building a full list.

```python
from io import StringIO

stream = StringIO("A\nB\n")
assert list(iter(stream.readline, "")) == ["A\n", "B\n"]
assert len({"A": 1, "B": 2}) == 2
assert list(range(1, 8, 2)) == [1, 3, 5, 7]
assert list(range(5, 0, -2)) == [5, 3, 1]
```

The stop is excluded, and a zero step is invalid. `len` returns a non-negative integer; an iterator need not provide a length merely because it can produce values.

## Reversed versus reverse {#reversal}

`reversed(sequence)` produces a reverse iterator without requiring a new list. `list.reverse()` changes a list in place and returns `None`. Strings do not have a `.reverse()` method.

```python
codes = ["A", "B", "C"]
assert list(reversed(codes)) == ["C", "B", "A"]
assert codes == ["A", "B", "C"]
assert codes.reverse() is None
assert codes == ["C", "B", "A"]
assert "".join(reversed("crate")) == "etarc"
```

## Sorting basics {#sorting}

`sorted(iterable)` returns a new list. `list.sort()` changes one list and returns `None`. Both support `key` and `reverse`, and their sorting is stable: items whose keys compare equal retain their relative order.

```python
values = [7, 2, 5]
assert sorted(values) == [2, 5, 7]
assert values == [7, 2, 5]
assert values.sort(reverse=True) is None
assert values == [7, 5, 2]
assert sorted({"B": 2, "A": 9}) == ["A", "B"]  # Dictionary iteration gives keys.
```

Values must be orderable under the chosen key. Sorting a mixture of unrelated types such as integers and strings without a suitable key normally raises `TypeError`.

## Sort keys, itemgetter and attrgetter {#sort-keys}

A key function computes the comparison value once per input item. Use a tuple for a lexicographic multi-part key. `itemgetter` selects positions or dictionary keys; `attrgetter` selects object attributes.

```python
from operator import itemgetter, attrgetter
from types import SimpleNamespace

rows = [("east", 3), ("west", 1), ("east", 1)]
assert sorted(rows, key=itemgetter(1)) == [("west", 1), ("east", 1), ("east", 3)]
assert sorted(rows, key=lambda row: (row[0], -row[1])) == [("east", 3), ("east", 1), ("west", 1)]
assert itemgetter(0, 2)(["A", "B", "C"]) == ("A", "C")
objects = [SimpleNamespace(weight=3), SimpleNamespace(weight=1)]
assert [obj.weight for obj in sorted(objects, key=attrgetter("weight"))] == [1, 3]
assert sorted(["b", "A", "c"], key=str.casefold) == ["A", "b", "c"]
```

`reverse=True` reverses the entire key ordering, not just one component. If you need different directions for separate fields, construct an appropriate key or use stable multi-pass sorting deliberately.

## Zip, unzipping and uneven inputs {#zip}

`zip` combines parallel iterables into tuples and is lazy. By default it stops at the shortest input. Use `strict=True` when a length mismatch is an error, or `itertools.zip_longest` when you need padding instead.

```python
from itertools import zip_longest

names = ["A", "B"]
weights = [2, 5]
pairs = list(zip(names, weights, strict=True))
assert pairs == [("A", 2), ("B", 5)]
unzipped_names, unzipped_weights = zip(*pairs)
assert unzipped_names == ("A", "B") and unzipped_weights == (2, 5)
assert list(zip([1, 2], [3])) == [(1, 3)]
assert list(zip_longest([1, 2], [3], fillvalue=None)) == [(1, 3), (2, None)]
```

Strict mismatch errors occur when the iterator is consumed, not necessarily when it is created. Unpacking `zip(*pairs)` also requires handling the empty-input case if you expect two result variables.

## Put the course together

Build a small text-report tool: read lines using `with`, validate a field, group records in a dictionary, sort the results and format a summary. Put the reusable parts into functions or a package. Add a custom exception only when it gives a caller a useful recovery decision.

??? question "Which of sorted, list.sort, reversed and list.reverse mutates its input?"
    `list.sort` and `list.reverse` mutate the list and return `None`. `sorted` returns a new list; `reversed` returns an iterator. Choosing the right return/mutation contract prevents accidentally replacing a list with `None`.

[Review the topic coverage →](coverage.md){ .md-button .md-button--primary }
