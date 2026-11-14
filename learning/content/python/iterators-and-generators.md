---
title: Iterators and generators
description: Understand how for loops obtain values, build a custom iterator, and process data lazily with generator functions and expressions.
course: Python
lesson: CHAPTER 08 OF 15
---

# Iterators and generators

A loop does not need to know every value in advance. It needs a way to request the **next** value. Python's iteration protocol separates that process from how a collection stores its data.

## Beyond looping with indexes {#indexes}

Indexing can be useful when positions matter. It is not a general way to traverse every iterable: a set has no positional indexing, a file yields lines, and an infinite sequence cannot first be materialized as a list.

```python
codes = ["A", "B", "C"]
assert [codes[index] for index in range(len(codes))] == codes
assert list(enumerate(codes)) == [(0, "A"), (1, "B"), (2, "C")]
assert sorted(code for code in {"B", "A"}) == ["A", "B"]
```

Prefer direct iteration when you need values, and `enumerate` when you need positions too.

## Iterable versus iterator {#iterables-and-iterators}

An **iterable** can provide an iterator through `iter(value)`. An **iterator** remembers its current position and provides `__next__()`. When there are no more values, `next()` raises `StopIteration`, unless you pass a default value.

```python
letters = iter("box")
assert next(letters) == "b"
assert next(letters) == "o"
assert next(letters) == "x"
assert next(letters, "done") == "done"
assert iter(letters) is letters
```

An iterator is also iterable: its `__iter__()` normally returns itself. A list can produce a fresh iterator repeatedly; a particular iterator is usually a one-pass object. Converting an exhausted iterator to a list gives an empty list.

## The protocol inside a for loop {#protocol}

A `for` loop gets an iterator and repeatedly calls `next()`, stopping at `StopIteration`. This manual version makes the mechanism visible:

```python
source = iter([2, 5, 8])
collected = []
while True:
    try:
        value = next(source)
    except StopIteration:
        break
    collected.append(value)
assert collected == [2, 5, 8]
```

You would normally write a `for` loop instead. The protocol lets the same loop syntax work with lists, dictionary keys, sets, files and generated values. The [data model chapter](data-model.md) shows how other built-ins such as `str` and `len` also use special methods.

## Build an iterator when values are produced on demand {#custom-iterator}

Use a custom iterator when requesting the next value requires keeping state. This countdown stores only its current position:

```python
class Countdown:
    def __init__(self, start):
        self.current = start

    def __iter__(self):
        return self

    def __next__(self):
        if self.current <= 0:
            raise StopIteration
        value = self.current
        self.current -= 1
        return value

counter = Countdown(3)
assert iter(counter) is counter
assert list(counter) == [3, 2, 1]
assert list(counter) == []
```

This object is deliberately one-pass. If you want a reusable iterable, implement `__iter__` so each call returns a new independent iterator. The [classes chapter](classes.md) explains the class syntax in more detail.

## Constant-state and infinite iterators {#lazy-tools}

`itertools.repeat` can repeat a value without allocating a list containing all those references. `itertools.count` can produce an unbounded arithmetic progression. Limit consumption explicitly.

```python
from itertools import count, islice, repeat

assert list(islice(count(10, 5), 4)) == [10, 15, 20, 25]
assert list(repeat("label", 3)) == ["label", "label", "label"]
```

The iterator's own state can be small even if the represented sequence is huge. That does not make every pipeline constant-memory: downstream calls such as `list(...)`, caches and retained references can still consume substantial memory. Do not call `list(count())`.

`sys.getsizeof(object)` reports an implementation-dependent shallow size, not the size of every object it refers to. It can illustrate the difference between a small iterator and a materialized list, but is not a complete memory profiler. Python 2's iterator `.next()` method is historical; use Python 3's `next(iterator)` and implement `__next__` on custom iterators.

## Generator functions use yield {#generator-functions}

A function containing `yield` creates a generator when called. It resumes its body when a caller requests a value, suspends at `yield`, and retains its local state. Finishing the function ends iteration.

```python
def even_weights(weights):
    for weight in weights:
        if weight % 2 == 0:
            yield weight

stream = even_weights([1, 2, 3, 4])
assert next(stream) == 2
assert list(stream) == [4]
assert list(stream) == []
```

Returning a value from a normal function and yielding a series of values solve different problems. Inside a generator, use `return` to finish; do not explicitly raise `StopIteration` to end it.

## Generator expressions {#generator-expressions}

Use parentheses for a lazy expression and brackets for an eager list comprehension. Both forms can transform and filter values.

```python
weights = [1, 2, 3, 4]
eager = [weight * 2 for weight in weights]
lazy = (weight * 2 for weight in weights)
assert eager == [2, 4, 6, 8]
assert sum(lazy) == 20
assert sum(lazy) == 0  # Already consumed.
```

Errors in work deferred by a generator may appear during consumption, rather than when you create it. Resource lifetimes also matter: a generator reading a file must be consumed while that file is open.

## Choose an expression or a function {#choosing-generators}

A generator expression is useful for a short transformation at a call site. A generator function gives longer work a name and accommodates multiple statements, branches and documentation.

```python
def cleaned_lines(lines):
    for line in lines:
        cleaned = line.strip()
        if cleaned and not cleaned.startswith("#"):
            yield cleaned

assert list(cleaned_lines(["  A  ", "", "# ignored", "B\n"])) == ["A", "B"]
assert list(value for value in [0, 1, 2] if value > 0) == [1, 2]
```

## Try it yourself

Write a generator that yields batches of at most three values. Test an empty input, an exact multiple of three and a final partial batch.

??? question "Why does calling list() twice on the same generator produce different results?"
    A generator retains its position and is consumed once. The first call exhausts it. Call the generator function again to get a fresh generator, or save a materialized result if repeated traversal is required.

[Next: Decorators →](decorators.md){ .md-button .md-button--primary }
