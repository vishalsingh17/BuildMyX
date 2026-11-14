---
title: Decorators without the mystery
description: Wrap a function while preserving its result and metadata, understand decorator factories, and reason about stacking order.
course: Python
lesson: CHAPTER 09 OF 15
---

# Decorators without the mystery

A decorator receives a callable or class and returns the object that should replace it. Function decorators often return a wrapper that adds behavior before or after calling the original function. Decorators are useful for shared behavior such as logging, but they should leave the call's meaning understandable.

## Start with an ordinary wrapper {#wrapping}

```python
from functools import wraps

events = []

def record_call(function):
    @wraps(function)
    def wrapped(*args, **kwargs):
        events.append(function.__name__)
        return function(*args, **kwargs)
    return wrapped

def parcel_total(quantity, unit_price):
    """Calculate the total for one line."""
    return quantity * unit_price

tracked_total = record_call(parcel_total)
assert tracked_total(3, unit_price=4) == 12
assert events == ["parcel_total"]
assert tracked_total.__name__ == "parcel_total"
assert tracked_total.__doc__ == parcel_total.__doc__
```

`*args` and `**kwargs` forward the call's inputs, while `return` forwards its result. Omitting that return would silently turn a useful result into `None`. `functools.wraps` preserves important metadata and adds `__wrapped__` for tools that inspect the original function.

## The @ form is rebinding {#decorator-syntax}

```python
@record_call
def box_count(parcels, per_box=6):
    return (parcels + per_box - 1) // per_box

assert box_count(13) == 3
assert events[-1] == "box_count"
```

The decorated definition has the same basic effect as defining the function and then assigning `box_count = record_call(box_count)`. The decorator runs when the definition executes; the wrapper's body runs on each later call.

## Configurable decorators {#factories}

When a decorator needs configuration, an outer function accepts it and returns the actual decorator. The wrapper retains that configuration in a closure.

```python
def prefix_result(prefix):
    def decorate(function):
        @wraps(function)
        def wrapped(*args, **kwargs):
            return prefix + function(*args, **kwargs)
        return wrapped
    return decorate

@prefix_result("zone: ")
def zone_name():
    return "east"

assert zone_name() == "zone: east"
```

There are three stages: configure, decorate and call. Use different names and small functions to keep those stages visible.

## Stacking order matters {#stacking}

```python
@prefix_result("outer / ")
@prefix_result("inner / ")
def label_name():
    return "A"

assert label_name() == "outer / inner / A"
```

The function is passed to the bottom decorator first, then its result to the decorator above it. The outer wrapper is therefore entered first when the decorated function is called. Logging, caching and authorization decorators can behave very differently when their order changes.

## Keep behavior explicit

A decorator can replace a result, suppress an exception or change which arguments are accepted. Those powers are not always desirable. Preserve results and exceptions unless changing them is an intentional, documented part of the API. Be careful about shared mutable state in wrappers that may be called concurrently.

Class decorators such as `@dataclass` operate on a class definition. Method decorators such as `@classmethod`, `@staticmethod` and `@property` change how attributes are accessed. See [classes](classes.md) for examples of those forms.

## Try it yourself

Write a decorator that records a successful result's type without changing the result. Check a function with keyword arguments and one that raises an exception. Decide whether failed calls should create a record too.

??? question "Why use wraps rather than just renaming the wrapper?"
    Tools can inspect more than `__name__`. `wraps` copies useful metadata and exposes the wrapped callable through `__wrapped__`, helping documentation, debugging and introspection behave sensibly.

[Next: Files and streams →](files.md){ .md-button .md-button--primary }
