---
title: Exceptions and recovery
description: Handle specific failures, preserve useful exception causes, define custom errors and clean up reliably.
course: Python
lesson: CHAPTER 13 OF 15
---

# Exceptions and recovery

An exception interrupts the normal path and searches outward for a suitable handler. Catch an exception where you can recover, add useful context or translate it into the interface your caller expects. Catching everything and continuing can conceal an incorrect result.

## Specific handlers and multiple except clauses {#handling}

```python
def parse_ratio(raw):
    try:
        return 10 / int(raw)
    except ValueError:
        return "not an integer"
    except ZeroDivisionError:
        return "zero has no reciprocal"

assert parse_ratio("2") == 5
assert parse_ratio("x") == "not an integer"
assert parse_ratio("0") == "zero has no reciprocal"
```

Keep the `try` block small so a handler does not accidentally catch a similar error from unrelated code. Place subclass handlers before their base classes; `except OSError` would also catch `FileNotFoundError`. Use `except (TypeError, ValueError)` when those failures have the same recovery behavior.

An exception instance exposes its arguments through `.args`; `str(error)` produces a readable message. Use bare `raise` inside a handler to propagate the active exception without creating a new one.

## Custom exceptions and explicit causes {#custom-errors}

```python
class InvalidParcelCount(ValueError):
    pass

def positive_count(raw):
    try:
        count = int(raw)
    except ValueError as error:
        raise InvalidParcelCount("Parcel count must be an integer") from error
    if count <= 0:
        raise InvalidParcelCount("Parcel count must be positive")
    return count

try:
    positive_count("many")
except InvalidParcelCount as error:
    assert isinstance(error.__cause__, ValueError)
    assert error.args == ("Parcel count must be an integer",)
```

Subclass `Exception` or a suitable existing exception for ordinary application errors. Choose a useful domain name. `raise NewError(...) from original` preserves an explicit cause; `from None` suppresses automatic context display when that is the deliberate user-facing behavior.

## Else for success; finally for cleanup {#else-finally}

The `else` block runs when the `try` suite finishes normally, with no exception or early control-flow exit. Put work there if you do not want its failures handled by the preceding `except` clauses. `finally` runs as the block exits through ordinary return or exception propagation.

```python
events = []
try:
    count = int("4")
except ValueError:
    events.append("invalid")
else:
    events.append(f"accepted {count}")
finally:
    events.append("finished")
assert events == ["accepted 4", "finished"]
```

Avoid returning from `finally`: it can replace a return value or suppress a pending exception. Use cleanup there, or prefer a resource's context-manager interface.

## With is structured resource handling {#with}

```python
from contextlib import contextmanager

@contextmanager
def working_notes():
    notes = []
    try:
        yield notes
    finally:
        notes.clear()

with working_notes() as notes:
    notes.append("temporary calculation")
    assert len(notes) == 1
assert notes == []
```

A real file's `with` block uses the same resource-lifetime idea. An exception from the body still triggers cleanup. A context manager can choose to suppress an exception, so understand its exit contract.

## Nested failures and exception chaining {#nested-errors}

Recovery can fail too. Preserve the relationship between the first failure and a failed fallback rather than losing whichever error matters to the caller.

```python
def load_with_fallback():
    try:
        raise OSError("primary source unavailable")
    except OSError as primary:
        try:
            raise ValueError("fallback content invalid")
        except ValueError as fallback:
            raise primary from fallback

try:
    load_with_fallback()
except OSError as error:
    assert isinstance(error.__cause__, ValueError)
```

Bare `raise` re-raises the exception currently being handled. Saving an exception and later using `raise saved` can add a traceback frame. If you deliberately need a saved traceback, modern Python supports `exception.with_traceback(saved_traceback)`; old Python 2 syntax such as `raise type, value, traceback` is not valid Python 3.

Inside a handler, `sys.exc_info()` returns the active exception's `(type, value, traceback)` tuple. Keep that information only as long as necessary: retaining tracebacks can retain their frames and local objects too.

## Built-in exception reference {#built-in-errors}

These are the exception families mentioned in the reference, with modern distinctions:

| Exception | What it signals |
| --- | --- |
| `AssertionError` | An `assert` condition failed; do not use assertions as external-input validation because optimized execution can disable them |
| `AttributeError` | An attribute lookup or supported attribute operation failed |
| `EOFError` | An input operation such as `input()` reached EOF without a line |
| `FloatingPointError` | A reported floating-point failure; ordinary float operations often use other outcomes, and this is uncommon in basic Python |
| `GeneratorExit` | A generator is being closed; not an ordinary application error |
| `ImportError` | An import could not be completed; `ModuleNotFoundError` is a more specific subclass |
| `IndexError` | A sequence index is outside the supported range |
| `KeyError` | A mapping does not contain the requested key |
| `KeyboardInterrupt` | An interrupt request, commonly Ctrl+C |
| `MemoryError` | An allocation could not obtain sufficient memory |
| `NameError` | A name has no accessible binding |
| `NotImplementedError` | A deliberately unimplemented operation was called; distinct from the `NotImplemented` sentinel |
| `OSError` | An operating-system operation failed; `IOError` is an alias in Python 3 |
| `OverflowError` | A particular operation cannot represent an arithmetic result; Python integers themselves are not fixed-width |
| `ReferenceError` | A weak-reference proxy's target is no longer available |
| `RuntimeError` | A runtime condition has no more specific category, such as some invalid state transitions |
| `StopIteration` | An iterator has no next value |
| `SyntaxError` | Source cannot be parsed as valid Python |
| `IndentationError` | Invalid indentation; a subclass of `SyntaxError` |
| `TabError` | Inconsistent tabs/spaces; a subclass of `IndentationError` |
| `SystemError` | An internal interpreter/API error was detected |
| `SystemExit` | An exit was requested, such as through `sys.exit()` |
| `TypeError` | An operation received an unsuitable type or argument pattern |
| `UnboundLocalError` | A local binding was read before a value was assigned; a subclass of `NameError` |
| `UnicodeDecodeError` | Bytes could not be decoded with the selected encoding |
| `ValueError` | The type is acceptable but the value is not |
| `ZeroDivisionError` | A division/modulo operation has a zero divisor |

`except Exception` does not catch every `BaseException` subclass: `KeyboardInterrupt`, `SystemExit` and `GeneratorExit` sit outside the ordinary `Exception` branch. Avoid a bare `except:` unless that broad behavior is genuinely required and promptly re-raises or cleans up appropriately.

`dir(builtins)` can help explore names, but use the official [exception hierarchy](https://docs.python.org/3/library/exceptions.html) to understand inheritance rather than guessing from a list.

## Try it yourself

Wrap a configuration parser with a domain-specific exception while retaining the original parsing error as its cause. Check which code belongs inside `try` and which belongs in `else`.

??? question "Can an except block inside a fallback accidentally hide the first failure?"
    Yes. Nested failures need an intentional error contract. You may raise the fallback failure from the original, or re-raise the original from the fallback, depending on which error the caller should handle. Preserve the other failure as useful context.

[Next: Modules and packages →](modules-and-packages.md){ .md-button .md-button--primary }
