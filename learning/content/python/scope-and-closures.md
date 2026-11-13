---
title: Scope, nested functions and closures
description: Understand local and global names, retain state with a closure, and choose nonlocal deliberately.
course: Python
lesson: CHAPTER 05 OF 15
---

# Scope, nested functions and closures

A name's **scope** determines where Python looks for its binding. A nested function can use names from an enclosing function, but assignment introduces an important distinction: reading an outer binding and rebinding it are different operations.

## Local, enclosing, global, built-in {#scope}

For ordinary function name lookup, remember **LEGB**: local function scope, enclosing function scopes, module globals, then built-ins. This is a useful starting model; class bodies and comprehensions have additional rules.

```python
zone = "module"

def outer_label():
    zone = "outer"
    def inner_label():
        zone = "inner"
        return zone
    return inner_label(), zone

assert outer_label() == ("inner", "outer")
assert zone == "module"
```

Each assignment above affects its own scope. Avoid naming a variable `list`, `str` or `sum` when you still need the corresponding built-in function; such a binding shadows the built-in.

## Nested functions and closures {#closures}

A nested function is a function defined inside another function. It becomes a **closure** when it retains access to bindings from its enclosing scope. Calling the outer function can create a specialized function without a global configuration variable.

```python
def make_prefixer(prefix):
    def add_prefix(code):
        return f"{prefix}-{code}"
    return add_prefix

east_label = make_prefixer("E")
west_label = make_prefixer("W")
assert east_label("42") == "E-42"
assert west_label("42") == "W-42"
```

The returned function still accesses its enclosing binding after the outer call has finished. Closures retain bindings, not automatically frozen copies of values. This matters when creating functions in a loop: bind the current value explicitly if each function should keep a different one.

```python
functions = [lambda value, factor=factor: value * factor for factor in (2, 3)]
assert [function(5) for function in functions] == [10, 15]
```

The default argument captures the current factor at each function definition. Without that binding technique, the closures would look up the same later loop binding.

## Rebind enclosing state with nonlocal {#nonlocal}

`nonlocal` tells Python that assignment refers to an existing binding in an enclosing function scope. It does not mean “create any name outside this function.”

```python
def make_counter(start=0):
    count = start
    def increment():
        nonlocal count
        count += 1
        return count
    return increment

counter = make_counter(10)
assert counter() == 11
assert counter() == 12
other = make_counter()
assert other() == 1
```

Without `nonlocal`, `count += 1` would make `count` local to `increment`, then try to read that local before assigning it, causing `UnboundLocalError`. Mutating an existing outer list with `.append()` does not itself rebind the name; assigning a new list does.

## Rebind module state with global {#global}

`global` refers to the current module's namespace, not a universal variable shared by every module. Keep global mutation small and explicit because it makes calls harder to reason about and test independently.

```python
processed_count = 0

def record_processed():
    global processed_count
    processed_count += 1

record_processed()
assert processed_count == 1
```

Returning a value, passing state as an argument or using an object is often clearer than changing a global. A closure can be useful for a small amount of private state; a class can be clearer when you need several related operations.

## Try it yourself

Create a function factory that returns a running-average function. Decide which values need `nonlocal`, and check that two separately created averages do not share state.

??? question "Why is mutating an outer list different from assigning a new list?"
    Calling `.append()` changes the object already referenced by the outer name. Assignment changes which object a name refers to. Python uses the assignment to determine that the name is local unless you declare an enclosing or global binding.

[Next: Type hints →](type-hints.md){ .md-button .md-button--primary }
