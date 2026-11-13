---
title: Control flow and functions
description: Use conditions, loops and reusable functions with clear arguments, return values and stopping rules.
course: Python
lesson: CHAPTER 04 OF 15
---

# Control flow and functions

Control flow determines which statements run and how often. Functions give a useful piece of behavior a name, inputs and a result. Keep both understandable before trying to make them shorter.

## Conditions and conditional expressions {#conditions}

An `if` statement chooses a block. `elif` tries another condition, and `else` handles the remaining case. An inline conditional expression chooses one value.

```python
def shipping_band(weight):
    if weight <= 0:
        return "invalid"
    elif weight <= 2:
        return "small"
    else:
        return "large"

assert shipping_band(1.5) == "small"
assert shipping_band(0) == "invalid"
weight = 3
label = "heavy" if weight > 2 else "light"
assert label == "heavy"
```

Use the expression form for a simple choice, not a deeply nested decision tree. Remember that `and` and `or` return operands; `return a and b` is not equivalent to `return None if not a else b` when `a` is a falsy value other than `None`.

## For loops, range and enumerate {#for-loops}

A `for` loop asks an iterable for its items. It does not require a numeric index. `range(stop)`, `range(start, stop)` and `range(start, stop, step)` describe integer sequences with an excluded stop bound.

```python
assert list(range(4)) == [0, 1, 2, 3]
assert list(range(3, 7)) == [3, 4, 5, 6]
assert list(range(2, 9, 3)) == [2, 5, 8]
assert list(range(5, 0, -2)) == [5, 3, 1]
labels = []
for position, name in enumerate(["cut", "pack"], start=1):
    labels.append(f"{position}: {name}")
assert labels == ["1: cut", "2: pack"]
```

`break` exits the nearest loop; `continue` skips to its next iteration. A zero step in `range` raises `ValueError`.

## A loop's else means no break {#loop-else}

The `else` clause on a loop runs if the loop finishes without `break`, including when it has no items. It is useful for a search with a distinct not-found outcome.

```python
found = None
for candidate in [5, 8, 11]:
    if candidate % 2 == 0:
        found = candidate
        break
else:
    found = "no even value"
assert found == 8

for candidate in []:
    break
else:
    empty_search = "not found"
assert empty_search == "not found"
```

An early-returning function is sometimes clearer than loop `else`. Choose the version that makes the success and absence cases easiest to follow.

## While loops need progress {#while-loops}

Use `while` when a condition, rather than the next item, controls repetition. Identify what changes the condition and what bounds the work.

```python
remaining = 7
loads = []
while remaining > 0:
    load = min(3, remaining)
    loads.append(load)
    remaining -= load
assert loads == [3, 3, 1]
```

A loop that never changes its controlling state can run forever. A `while` loop can also have an `else` clause with the same no-`break` meaning as a `for` loop.

## Function inputs and results {#function-basics}

`def` creates a function. Positional arguments match parameter order; keyword arguments name their destination. `return` ends the call and gives a value to the caller. A function that reaches its end returns `None`.

```python
def line_total(quantity, unit_price=5):
    return quantity * unit_price

assert line_total(3) == 15
assert line_total(unit_price=4, quantity=3) == 12

def describe(name, *, zone="unassigned"):
    return f"{name}: {zone}"

assert describe("A", zone="east") == "A: east"
```

Here `*` makes `zone` keyword-only. Defaults are evaluated when the function is defined, not each time it is called. Do not use a mutable list as an accumulating default unintentionally:

```python
def add_label(label, labels=None):
    if labels is None:
        labels = []
    labels.append(label)
    return labels

assert add_label("A") == ["A"]
assert add_label("B") == ["B"]
```

## Variable arguments and unpacking {#variable-arguments}

`*args` collects extra positional arguments as a tuple; `**kwargs` collects extra keyword arguments as a dictionary. The names `args` and `kwargs` are conventions, while the stars carry the meaning.

```python
def describe_batch(*codes, **metadata):
    return codes, metadata

codes, metadata = describe_batch("A", "B", zone="east")
assert codes == ("A", "B")
assert metadata == {"zone": "east"}

def multiply(a, b):
    return a * b

assert multiply(*[3, 4]) == 12
assert multiply(**{"a": 3, "b": 4}) == 12
```

Unpacking at the call site expands a collection into arguments. Returning `a, b` creates a tuple which the caller can unpack. Use flexible arguments for an actual flexible interface, not to conceal which inputs a function needs.

## Try it yourself

Write `first_over_limit(values, limit)` returning the first suitable value or `None`. Implement one version with an early `return`, then one with loop `else`. Compare readability.

??? question "Does a default value get recreated for every function call?"
    No. A default is evaluated when the function definition executes. A mutable default can therefore be shared by later calls. A `None` sentinel and a new list inside the function avoid accidental sharing.

[Next: Scope and closures →](scope-and-closures.md){ .md-button .md-button--primary }
