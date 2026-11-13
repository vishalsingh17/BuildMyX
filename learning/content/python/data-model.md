---
title: The data model and magic methods
description: Connect Python syntax to special methods, implement a custom sequence and understand arithmetic, attributes, context managers and serialization hooks.
course: Python
lesson: CHAPTER 12 OF 15
---

# The data model and magic methods

Special methods—often called magic or “dunder” methods—connect your objects to Python's syntax. Implementing a relevant protocol lets an object work naturally with operations such as `len(obj)`, `obj[index]`, `obj + other` or `with obj`.

Prefer the normal operation to manually calling a dunder method. Python's special-method lookup can differ from ordinary instance attribute lookup, so assigning an arbitrary method on one instance is not a general way to implement a protocol.

## Construction, initialization and representation {#construction}

`__new__` creates an instance; `__init__` initializes an instance that has already been created. Most ordinary classes only need `__init__`, which must return `None`. Overriding `__new__` is more specialized, for example when creating a subclass of an immutable type.

`__repr__` should provide a useful developer-facing representation; `__str__` provides readable user-facing text. `__del__` is a finalization hook, not a dependable resource-cleanup schedule. `del name` removes a binding; it does not guarantee that an object's `__del__` immediately runs. Use a context manager for explicit cleanup.

```python
class ParcelCode:
    def __init__(self, value):
        self.value = value

    def __repr__(self):
        return f"ParcelCode({self.value!r})"

    def __str__(self):
        return self.value

code = ParcelCode("A-12")
assert str(code) == "A-12"
assert repr(code) == "ParcelCode('A-12')"
```

## Comparisons and hashing {#comparisons}

| Operation | Hook |
| --- | --- |
| `a == b`, `a != b` | `__eq__`, `__ne__` |
| `a < b`, `a > b` | `__lt__`, `__gt__` |
| `a <= b`, `a >= b` | `__le__`, `__ge__` |

Return `NotImplemented` for an operand type your method does not support. It lets Python try the other operand's appropriate operation or fall back according to the operator. `NotImplemented` is a return value, distinct from raising `NotImplementedError`.

```python
from dataclasses import dataclass
from functools import total_ordering

@total_ordering
@dataclass(frozen=True)
class Priority:
    level: int

    def __lt__(self, other):
        if not isinstance(other, Priority):
            return NotImplemented
        return self.level < other.level

assert Priority(1) < Priority(2)
assert Priority(2) >= Priority(1)
assert Priority(1) == Priority(1)
assert len({Priority(1), Priority(1)}) == 1
```

`total_ordering` fills in ordering operations from a supported comparison and equality. The frozen dataclass provides value equality and a suitable hash for this integer field. Equal hashable objects must have equal hashes; do not base a hash on mutable state that can change while an object is a dictionary key.

The Python 2 `__cmp__` hook is no longer used for comparisons in Python 3. Implement rich comparisons instead.

## Unary and arithmetic operations {#arithmetic}

| Syntax | Hook | Purpose |
| --- | --- | --- |
| `+value` | `__pos__` | Unary plus |
| `-value` | `__neg__` | Unary negation |
| `abs(value)` | `__abs__` | Absolute value or a domain-appropriate magnitude |
| `~value` | `__invert__` | Bitwise inversion or a clearly documented equivalent |
| `a + b`, `a - b`, `a * b` | `__add__`, `__sub__`, `__mul__` | Normal arithmetic |
| `a / b`, `a // b` | `__truediv__`, `__floordiv__` | True and floor division |
| `a % b`, `a ** b` | `__mod__`, `__pow__` | Remainder and exponentiation |

Reflected forms such as `__radd__` can support the other operand's side of an operation; in-place forms such as `__iadd__` define `+=` behavior. Python 2's `__div__` is historical; Python 3 uses `__truediv__` for `/`.

```python
from math import hypot

@dataclass(frozen=True)
class Offset:
    x: int
    y: int

    def __add__(self, other):
        if not isinstance(other, Offset):
            return NotImplemented
        return Offset(self.x + other.x, self.y + other.y)

    def __neg__(self):
        return Offset(-self.x, -self.y)

    def __abs__(self):
        return hypot(self.x, self.y)

assert Offset(1, 2) + Offset(3, 4) == Offset(4, 6)
assert -Offset(1, -2) == Offset(-1, 2)
assert abs(Offset(3, 4)) == 5
```

Only implement operators whose meaning is natural for the domain. Making `+` do unrelated network work would surprise callers even if Python permits the method definition.

## Build a custom sequence {#sequences}

For a basic indexable sequence, `__len__` and `__getitem__` establish important behavior. Mutable containers can also define assignment and deletion. Match the errors to the contract: invalid sequence positions normally raise `IndexError`, missing mapping keys raise `KeyError`, and unsuitable key types raise `TypeError`.

```python
class ParcelQueue:
    def __init__(self, items):
        self._items = list(items)

    def __len__(self):
        return len(self._items)

    def __getitem__(self, key):
        return self._items[key]

    def __setitem__(self, key, value):
        self._items[key] = value

    def __delitem__(self, key):
        del self._items[key]

    def __iter__(self):
        return iter(self._items)

    def __contains__(self, value):
        return value in self._items

queue = ParcelQueue(["A", "B", "C"])
assert len(queue) == 3
assert queue[-1] == "C"
assert queue[:2] == ["A", "B"]  # This implementation returns a list for a slice.
queue[1] = "D"
del queue[0]
assert list(queue) == ["D", "C"]
assert "D" in queue and "B" not in queue
```

`__iter__` should return an iterator; it need not make the container itself an iterator. `__contains__` makes the intended membership rule explicit. If an operation could be confusing, document it rather than relying on callers to infer hidden behavior.

## Attribute hooks, indexing and truth values {#attribute-hooks}

| Hook | Trigger and responsibility |
| --- | --- |
| `__getattribute__` | Ordinary attribute access; delegate carefully to avoid recursive lookup |
| `__getattr__` | Fallback after ordinary lookup fails; raise `AttributeError` for an unknown attribute |
| `__setattr__` | Attribute assignment; use `object.__setattr__` when storing directly inside an override |
| `__delattr__` | Attribute deletion |
| `__index__` | An exact-integer interpretation for indexes and similar operations; return an integer |
| `__bool__` | Truth testing; return `True` or `False` |

Python 2's `__nonzero__` corresponds to Python 3's `__bool__`. If no `__bool__` is defined, Python can use `__len__` for truth testing; otherwise ordinary objects are truthy by default.

```python
class Position:
    def __init__(self, value):
        self.value = value

    def __index__(self):
        return self.value

assert ["A", "B"][Position(1)] == "B"

class Record:
    def __init__(self):
        object.__setattr__(self, "_data", {})

    def __getattr__(self, name):
        try:
            return self._data[name]
        except KeyError:
            raise AttributeError(name) from None

    def __setattr__(self, name, value):
        self._data[name] = value

    def __delattr__(self, name):
        try:
            del self._data[name]
        except KeyError:
            raise AttributeError(name) from None

record = Record()
record.zone = "east"
assert record.zone == "east"
del record.zone
assert not hasattr(record, "zone")
```

Overriding `__getattribute__` affects almost every normal attribute read and is easier to make recursive accidentally. Use it only when the simpler `__getattr__` fallback does not meet the requirement.

## Callable objects and context managers {#call-and-context}

`__call__` lets an instance behave like a callable. `__enter__` and `__exit__` define a context manager; the value returned from `__enter__` is bound after `as`.

```python
class ScaleBy:
    def __init__(self, factor):
        self.factor = factor

    def __call__(self, value):
        return value * self.factor

assert ScaleBy(3)(7) == 21

class AuditContext:
    def __init__(self):
        self.events = []

    def __enter__(self):
        self.events.append("entered")
        return self.events

    def __exit__(self, exc_type, exc_value, traceback):
        self.events.append("exited")
        return False  # Do not suppress an exception from the with body.

audit = AuditContext()
with audit as events:
    events.append("worked")
assert audit.events == ["entered", "worked", "exited"]
```

An exit hook receives exception information when the body raises. Returning a truthy value suppresses that exception; do that only as an intentional part of the context manager's contract.

## Pickling state hooks {#serialization}

`__getstate__` selects the state serialized by pickle; `__setstate__` restores it. For example, save durable notes while recreating a disposable cache. Only unpickle data you trust: loading a pickle can execute code. Use a constrained data format such as JSON when exchanging untrusted data.

```python
import pickle

class SessionNotes:
    def __init__(self, text):
        self.text = text
        self.cache = {"temporary": True}

    def __getstate__(self):
        return {"text": self.text}

    def __setstate__(self, state):
        self.text = state["text"]
        self.cache = {}

original = SessionNotes("review shelf layout")
restored = pickle.loads(pickle.dumps(original))  # Bytes produced by this program.
assert restored.text == original.text and restored.cache == {}
```

Pickle normally needs to import the object's class by module/name. Functions and classes defined inside another function are not generally suitable for this basic serialization pattern.

The stream-oriented forms are `pickle.dump(object, binary_stream)` and `pickle.load(binary_stream)`. They use the same state hooks as `dumps`/`loads`; the file argument order is important, and the same trust requirement applies.

## Try it yourself

Add `__bool__` to a small object representing a completed/unfinished task. Then decide whether `len(task)` would have a meaningful interpretation, rather than implementing every hook merely because it exists.

??? question "Why return NotImplemented rather than False for an unsupported comparison?"
    `False` claims the operation was supported and the values did not compare as requested. `NotImplemented` lets Python try the appropriate alternative, such as the other operand's comparison, before applying the operator's fallback behavior.

[Next: Exceptions →](exceptions.md){ .md-button .md-button--primary }
