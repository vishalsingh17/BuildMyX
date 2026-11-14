---
title: Classes, inheritance and dataclasses
description: Model related state and behavior with instances, methods, properties, inheritance, abstract interfaces and dataclasses.
course: Python
lesson: CHAPTER 11 OF 15
---

# Classes, inheritance and dataclasses

A class defines a kind of object. An instance holds its own state and uses methods to act on that state. Use a class when keeping related behavior and data together explains the program more clearly than a loose collection of variables.

## Instance attributes and class attributes {#class-basics}

```python
class Parcel:
    category = "standard"  # Class attribute: looked up by instances too.

    def __init__(self, code, weight):
        self.code = code
        self.weight = weight

    def description(self):
        return f"{self.code}: {self.weight} kg"

first = Parcel("A", 2)
second = Parcel("B", 3)
assert first.description() == "A: 2 kg"
assert first.code != second.code
Parcel.category = "tracked"
assert first.category == second.category == "tracked"
first.category = "priority"  # Shadows the class attribute for this instance.
assert first.category == "priority" and second.category == "tracked"
```

`self` is the conventional name for the instance passed to an ordinary bound instance method. A mutable class attribute such as a list is shared unless you deliberately give each instance its own value. Initialize per-instance mutable state in `__init__`.

## Class methods, static methods and properties {#method-kinds}

`@classmethod` passes the calling class as `cls`, useful for alternate constructors. `@staticmethod` adds no implicit instance or class argument; it can be called through **either the class or an instance**.

```python
class Label:
    def __init__(self, text):
        self._text = text

    @classmethod
    def from_code(cls, code):
        return cls(f"parcel-{code}")

    @staticmethod
    def separator():
        return "-"

    @property
    def text(self):
        return self._text

    @text.setter
    def text(self, value):
        if not value:
            raise ValueError("A label needs text")
        self._text = value

    @text.deleter
    def text(self):
        del self._text

label = Label.from_code("A")
assert label.text == "parcel-A"
assert Label.separator() == label.separator() == "-"
label.text = "parcel-B"
assert label.text == "parcel-B"
del label.text
assert not hasattr(label, "_text")
```

A property lets callers use attribute syntax while a getter, setter or deleter implements the behavior. A property with no setter is read-only through that property interface. A leading underscore is a convention for internal use, not an access-control boundary.

## Inheritance and super {#inheritance}

A child class can inherit behavior, override a method or add state. `super()` delegates to the next implementation in the method resolution order (MRO), which is more precise than saying it always calls “the parent.”

```python
class ExpressParcel(Parcel):
    def __init__(self, code, weight, deadline):
        super().__init__(code, weight)
        self.deadline = deadline

    def description(self):
        return f"{super().description()} before {self.deadline}"

express = ExpressParcel("C", 1, "noon")
assert express.description() == "C: 1 kg before noon"
assert isinstance(express, Parcel)
assert type(express) is ExpressParcel
assert issubclass(ExpressParcel, Parcel)
```

Use `pass` for an intentionally empty class body, including a subclass that only inherits behavior. To import a class from `parcels.py`, use `from parcels import Parcel`; see [modules and packages](modules-and-packages.md) for the file layout.

## Multiple inheritance and method resolution {#multiple-inheritance}

Multiple inheritance searches implementations according to `Class.__mro__`. Small mixins can add independent behavior; combining stateful parents requires a deliberate initialization contract.

```python
class AuditMixin:
    def description(self):
        return "audit / " + super().description()

class AuditedExpressParcel(AuditMixin, ExpressParcel):
    pass

audited = AuditedExpressParcel("D", 2, "17:00")
assert audited.description() == "audit / D: 2 kg before 17:00"
assert AuditedExpressParcel.__mro__[:3] == (AuditedExpressParcel, AuditMixin, ExpressParcel)
```

Cooperative methods call `super()` consistently and use compatible signatures, allowing each participant to run once in MRO order. Explicitly calling several ancestor initializers can initialize a shared ancestor twice in a diamond hierarchy. Prefer composition when separate collaborators communicate more clearly than a complicated inheritance graph.

## Abstract base classes {#abstract-classes}

An ABC describes required behavior. A subclass cannot be instantiated while it still has unimplemented abstract methods. An abstract method can have a base implementation, but concrete subclasses must still override it.

```python
from abc import ABC, abstractmethod

class RateProvider(ABC):
    @abstractmethod
    def quote(self, weight):
        """Return a price for a positive weight."""
        raise NotImplementedError

class FlatRate(RateProvider):
    def quote(self, weight):
        return 5

assert FlatRate().quote(2) == 5
try:
    RateProvider()
except TypeError:
    pass
else:
    raise AssertionError("An incomplete ABC must not be instantiated")
```

ABCs can also contain ordinary methods and can be combined through inheritance. They enforce the presence of implementations, not the business correctness of those implementations; tests still matter.

## Dataclasses reduce repetitive data code {#dataclasses}

`@dataclass` can generate `__init__`, `__repr__` and value-based `__eq__` from annotated fields. It is useful for data records with a small amount of related behavior.

```python
from dataclasses import dataclass, field, FrozenInstanceError

@dataclass(order=True)
class Shipment:
    priority: int
    code: str
    tags: list[str] = field(default_factory=list, compare=False)

a = Shipment(1, "A")
b = Shipment(2, "B")
a.tags.append("fragile")
assert b.tags == []
assert a < b
assert repr(b) == "Shipment(priority=2, code='B', tags=[])"

@dataclass(frozen=True)
class Location:
    zone: str
    rack: int

assert Location("east", 2) == Location("east", 2)
assert len({Location("east", 2), Location("east", 2)}) == 1
```

`default_factory=list` creates a fresh list for each instance. `order=True` generates ordering methods, comparing fields in declaration order unless excluded. `init=False` prevents generation of an initializer; it does not write a custom one for you. A class can also provide its own initializer when the default is unsuitable.

`frozen=True` prevents ordinary field rebinding and raises `FrozenInstanceError` on such assignments. It does **not** recursively freeze objects held in fields or make every frozen dataclass hashable: the participating field values must themselves support hashing. It is not by itself a thread-safety guarantee.

## Try it yourself

Define a dataclass for a delivery address with an independent list of notes. Then make a small `RateProvider` implementation and explain what belongs in that service rather than in the address record.

??? question "Can you call a static method on an instance?"
    Yes. A static method does not receive an implicit `self` or `cls`, whether accessed through the class or an instance. Use it when the operation belongs near the class conceptually but needs neither instance nor class state.

[Next: The data model and magic methods →](data-model.md){ .md-button .md-button--primary }
