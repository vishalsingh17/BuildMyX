---
title: Lists, dictionaries, sets and tuples
description: Choose the right container, understand mutation and hashability, and write clear slicing and comprehension operations.
course: Python
lesson: CHAPTER 03 OF 15
---

# Lists, dictionaries, sets and tuples

Choose a collection from the question you need to answer. Does position matter? Do you look up a value by a key? Do you need uniqueness? The container is part of the explanation of your program.

| Container | Useful when | Important property |
| --- | --- | --- |
| `list` | Position and change matter | Ordered, mutable, allows duplicates |
| `dict` | A key identifies a value | Unique hashable keys; preserves insertion order |
| `set` | Membership and uniqueness matter | Hashable elements; no positional order guarantee |
| `tuple` | A fixed grouping represents one value | Immutable container; can contain mutable objects |

## Lists and iteration {#lists}

A list holds references to objects. Indexes start at zero; negative indexes count from the end. Iterate directly over values, or use `enumerate` when you also need positions.

```python
stations = ["cut", "fold", "pack"]
assert stations[0] == "cut"
assert stations[-1] == "pack"
assert list(enumerate(stations, start=1)) == [(1, "cut"), (2, "fold"), (3, "pack")]
for station in stations:
    assert isinstance(station, str)
```

An out-of-range index raises `IndexError`. A slice can extend beyond the list's boundaries without raising that error.

## Slicing, copying and list operations {#list-operations}

`items[start:stop:step]` includes `start` and excludes `stop`. Missing bounds use defaults. A negative step can reverse the traversal.

```python
numbers = [2, 4, 6, 8, 10]
assert numbers[1:4] == [4, 6, 8]
assert numbers[::2] == [2, 6, 10]
assert numbers[::-1] == [10, 8, 6, 4, 2]
assert numbers[:99] == numbers
copy = numbers[:]
assert copy == numbers and copy is not numbers

copy.append(12)
copy.extend([14, 16])
copy.insert(0, 0)
copy.remove(6)           # Remove the first equal value; missing value -> ValueError.
assert copy.index(8) == 3
assert copy.pop() == 16
del copy[0]
copy[1:3] = [99]        # Slice assignment can change the length.
copy += (18,)           # Extending accepts another iterable.
assert copy == [2, 99, 10, 12, 14, 18]
assert len(copy) == 6 and 99 in copy
assert numbers + [12] == [2, 4, 6, 8, 10, 12]
```

`append([a, b])` adds one list object; `extend([a, b])` adds two elements. `+` creates a new list; `extend` and `+=` mutate the original list. Mutation methods such as `append` return `None`, not the changed list.

A trailing comma makes a tuple: `items += 7,` extends by one element, whereas `items += 7` fails because an integer is not iterable. Prefer the clearer `items.append(7)` when adding one element.

A slice or `.copy()` is **shallow**: nested mutable objects remain shared. Use an appropriate deep copy only when you actually need independent nested structures.

## Comprehensions: transform, filter, flatten {#list-comprehensions}

A comprehension describes a new collection. Read the `for` clauses in the same left-to-right order as the loops they replace.

```python
weights = [1, 2, 3, 4]
loop_result = []
for weight in weights:
    if weight % 2 == 0:
        loop_result.append(weight * 10)
assert [w * 10 for w in weights if w % 2 == 0] == loop_result == [20, 40]
assert ["even" if w % 2 == 0 else "odd" for w in weights] == ["odd", "even", "odd", "even"]

rows = [[1, 2], [3, 4]]
assert [value for row in rows for value in row] == [1, 2, 3, 4]
```

The trailing `if` removes items; an `if ... else` expression before `for` chooses a replacement value for every item. Use ordinary nested loops when multiple conditions or side effects make a comprehension hard to read.

## Dictionaries, keys and missing data {#dictionaries}

A dictionary maps a key to a value. Keys must be hashable; strings, integers and tuples of hashable values work. Lists, dictionaries and sets are not hashable. A tuple containing a list is not hashable either.

```python
stock = {"tape": 8, "labels": 20}
assert stock["tape"] == 8
assert "labels" in stock       # Membership checks keys.
assert stock.get("boxes") is None
assert stock.get("boxes", 0) == 0
assert "boxes" not in stock    # get() does not insert the default.
stock[("north", 2)] = 5
del stock[("north", 2)]
assert list(stock) == ["tape", "labels"]
assert list(stock.keys()) == ["tape", "labels"]
assert list(stock.values()) == [8, 20]
assert list(stock.items()) == [("tape", 8), ("labels", 20)]
```

Indexing a missing key with `stock["boxes"]` raises `KeyError`. Insertion order is a language guarantee in Python 3.7 and later; it is not sorted order. Avoid adding/removing keys while iterating over a dictionary's live view. Iterate over `list(stock)` when deletion during traversal is necessary.

For nested optional data, chained `.get()` calls only work when intermediate values are dictionaries. A present key whose value is `None` does not become `{}` just because a default was supplied.

```python
records = [{"details": {"zone": "east"}}, {}, {"details": None}]
zones = []
for record in records:
    details = record.get("details")
    zones.append(details.get("zone", "unknown") if isinstance(details, dict) else "unknown")
assert zones == ["east", "unknown", "unknown"]
```

## Default factories and dictionary comprehensions {#dictionary-patterns}

`defaultdict` calls a factory when a missing key is accessed with brackets, then stores that value. Use it for grouping or counting when missing entries should be created as part of the operation.

```python
from collections import defaultdict

groups = defaultdict(list)
for name, zone in [("A", "east"), ("B", "west"), ("C", "east")]:
    groups[zone].append(name)
assert groups["east"] == ["A", "C"]
assert groups.get("south") is None and "south" not in groups
assert groups["south"] == [] and "south" in groups

coordinates = defaultdict(lambda: (0, 0))
assert coordinates["unplaced"] == (0, 0)
assert {n: n ** 2 for n in range(5) if n % 2 == 0} == {0: 0, 2: 4, 4: 16}
assert {value: key for key, value in {"A": 1, "B": 2}.items()} == {1: "A", 2: "B"}
```

When reversing a dictionary's keys and values, duplicate values overwrite earlier entries. That is only correct when the product's meaning permits it.

## Sets and set operations {#sets}

Use `set()` for an empty set; `{}` makes an empty dictionary. `add` accepts one element and `update` accepts an iterable. `remove` raises `KeyError` for a missing element; `discard` does not.

```python
required = {"name", "email"}
provided = {"name", "company"}
assert required & provided == {"name"}                  # Intersection
assert required | provided == {"name", "email", "company"}  # Union
assert required - provided == {"email"}                # Difference
assert required ^ provided == {"email", "company"}     # Symmetric difference
assert {"name"} <= required                            # Subset
assert required >= {"email"}                          # Superset
copy = required.copy()
copy.add("company")
copy.discard("absent")
assert required == {"name", "email"}
assert {word[0] for word in ["crate", "cart", "tape"]} == {"c", "t"}
```

Iterating over a set is valid, but its order is not a positional contract. Use `sorted(my_set)` when output needs a deterministic order. `enumerate(my_set)` numbers the traversal you happen to get, not stable element identifiers.

## Tuples and unpacking {#tuples}

A comma, rather than parentheses alone, creates a tuple. Tuples support indexing, slicing, membership and concatenation, but not item reassignment.

```python
point = (4, 9)
x, y = point
assert x == 4 and y == 9
assert (4,) != 4
assert len(()) == 0
assert point[:1] == (4,)
assert point + (12,) == (4, 9, 12)
bundle = (["tape"], "east")
bundle[0].append("labels")  # The list changes; the tuple's references do not.
assert bundle == (["tape", "labels"], "east")
```

## Try it yourself

Given repeated `(zone, parcel_id)` pairs, build a dictionary of zones to **unique** parcel IDs. Decide whether deterministic output order matters before choosing how to display it.

??? question "Why can a tuple sometimes be a dictionary key and sometimes not?"
    A tuple is hashable only if all of its elements are hashable. A tuple of integers works; a tuple containing a list does not. Immutability of the outer container alone is not enough.

[Next: Control flow and functions →](control-flow-and-functions.md){ .md-button .md-button--primary }
