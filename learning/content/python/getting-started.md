---
title: Get comfortable with Python
description: Set up Python, use notebooks and scripts, and understand names, indentation, input, output and readable code.
course: Python
lesson: CHAPTER 01 OF 15
---

# Get comfortable with Python

<div class="lesson-meta"><span>Start here</span><span>Python 3.12+</span><span>Read · run · change</span></div>

Python lets you describe a task in small, readable steps. A script can clean a text file, calculate a total or call a service. The same language also powers notebooks, web applications and data tools. Start by making small programs predictable; libraries become easier once the language makes sense.

## Choose a Python version {#versions}

These lessons target **Python 3.12 or newer** and use the standard library. Check your interpreter with `python --version` or `python3 --version`. The command name depends on your operating system. Use a supported Python 3 release from [python.org](https://www.python.org/downloads/), and check a project's stated version requirements before upgrading it.

Python 2 examples still appear online. Its `print` statement, `raw_input()`, `unicode`, `__cmp__` and `__nonzero__` are historical context, not instructions to install Python 2. This course explains their modern equivalents where relevant.

Create a virtual environment for each project so its dependencies do not interfere with another project's packages:

```bash
python3 -m venv .venv
# macOS/Linux:
source .venv/bin/activate
# Windows PowerShell instead:
# .venv\Scripts\Activate.ps1
python -m pip --version
```

Save code in `hello.py`, then run `python hello.py`. In the interactive interpreter, an expression's value is displayed automatically. In a script, use `print()` to show it. The examples include `assert` statements so you can check your prediction; a failed assertion means the stated condition was false.

## Notebooks: Jupyter and Colab {#notebooks}

A notebook combines code cells, written explanation and outputs. Jupyter can run locally; Colab offers a hosted notebook environment. Both are useful for experimenting with small pieces of code and inspecting data.

Cells share a live interpreter state. If cell 4 depends on a variable created in cell 2, running cell 4 first may fail. Editing cell 2 does not update old outputs automatically. **Restart the kernel/runtime and run all cells in order** before sharing a notebook. A result that only works after an undocumented sequence of clicks is difficult to reproduce.

Keep credentials out of notebook cells and saved outputs. For a reusable tool, move the main behavior into functions or a module and call that code from the notebook.

## Style and the Zen of Python {#style}

[PEP 8](https://peps.python.org/pep-0008/) provides conventions for readable Python: use descriptive `snake_case` names for variables and functions, `PascalCase` for classes, and `UPPER_CASE` for constants. Group imports clearly and keep lines short enough to review comfortably. Follow an existing project's conventions consistently.

`import this` displays the Zen of Python. Its practical lesson here is to make intent easy to see: prefer a straightforward loop or a well-named function over a clever expression that takes effort to decode. Formatting tools can enforce spacing, but they cannot choose a meaningful name for you.

## Indentation defines a block {#indentation}

Four spaces per indentation level is the usual convention. A colon introduces a block after statements such as `if`, `for`, `def` and `class`. Do not mix tabs and spaces.

```python
parcel_count = 4
if parcel_count > 0:
    message = "Ready to pack"
    print(message)
assert message == "Ready to pack"
```

The two indented statements belong to the `if`. The assertion after the block runs regardless of whether the condition was true. Incorrect indentation can change behavior or raise `IndentationError`; inconsistent tabs and spaces can raise `TabError`.

## Comments explain decisions {#comments}

Use `#` for a comment. Explain a reason or assumption that the code does not already communicate. A function's first string literal is its **docstring**, available through tools such as `help()`.

```python
def packing_slots(parcels):
    """Return the number of trays needed for groups of six parcels."""
    # Add five before division so a partly filled tray still counts.
    return (parcels + 5) // 6

assert packing_slots(7) == 2
assert "trays" in packing_slots.__doc__
```

Triple-quoted strings can span lines; they are not a special multi-line comment syntax. Prefer ordinary comments for notes that are not documentation strings.

## Variables are names bound to objects {#variables}

Assignment binds a name to an object. A name can later refer to a different object, but that does not change the original object's type. Using a name before it has a binding raises `NameError`.

```python
first = ["label"]
second = first
second.append("box")
assert first == ["label", "box"]  # Both names refer to the same list.
assert first is second
assert first == first.copy()
assert first is not first.copy()

missing_value = None
assert missing_value is None
```

`==` asks whether values are equal; `is` asks whether they are the same object. Use `is None` for a missing-value check. Do not use `is` to compare strings or numbers; interpreter reuse of some objects is an implementation detail.

## Print and input {#console-io}

`print()` writes a readable representation. `sep` chooses the separator between arguments; `end` chooses what follows them. `input()` reads one line and returns a **string**, even if the person types digits.

```python
print("packed", 3, "parcels", sep=" | ", end=".\n")
quantity_text = input("Number of parcels: ")  # Try entering 3.
assert isinstance(quantity_text, str)
quantity = int(quantity_text)
print(f"Trays required: {packing_slots(quantity)}")
```

`int()` can raise `ValueError` for an unsuitable string. We handle that case in the [exceptions chapter](exceptions.md). Python 2's `raw_input()` corresponds to Python 3's `input()`; Python 2's evaluating `input()` behavior should not be reproduced for user input.

## Operator precedence {#precedence}

Multiplication binds more tightly than addition; parentheses make a different grouping explicit. Exponentiation uses `**`. Assignment operators such as `+=` update a binding; Python does not have `++` or `--` increment/decrement operators.

```python
assert 6 + 2 * 5 == 16
assert (6 + 2) * 5 == 40
assert 2 ** 3 ** 2 == 512  # Exponentiation groups from the right.
assert -2 ** 2 == -4       # The exponentiation happens before unary minus.
count = 5
count += 1
assert count == 6
```

## Try it yourself

Change `packing_slots` to accept the tray size as a second argument. Then predict the result for zero parcels and for exactly one full tray.

??? question "Why can a notebook display a result that a script does not print?"
    A notebook usually displays the final expression in a cell. A script evaluates an expression without automatically displaying its value. Use `print()` when output is part of the script's behavior.

[Next: Values and strings →](values-and-strings.md){ .md-button .md-button--primary }
