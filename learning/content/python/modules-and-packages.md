---
title: Modules, packages and entry points
description: Organize code into importable modules and packages, understand import behavior and run a package with python -m.
course: Python
lesson: CHAPTER 14 OF 15
---

# Modules, packages and entry points

A module gives a group of definitions a namespace. A package organizes related modules. Structure follows useful responsibilities: a small application does not become better merely by splitting every function into a separate file.

## Import forms and namespaces {#imports}

```python
import math
import math as calculations
from math import ceil, floor

assert math.sqrt(81) == calculations.sqrt(81) == 9
assert ceil(3.2) == 4 and floor(3.8) == 3
assert isinstance(ceil(3.2), int)
assert "sqrt" in dir(math)
```

`import math` keeps names under `math`. `from math import ceil` binds `ceil` directly in your namespace. An alias changes the local binding, not the imported module's behavior.

Avoid `from module import *` in ordinary application code: it can shadow names and makes it harder to see where a function originated. Avoid naming a local file `math.py`, `typing.py` or another library name you intend to import.

## A module is a Python file {#modules}

Create a file named `label_tools.py`:

```python
# file: label_tools.py
def normalize_label(value):
    """Normalize a label for comparison."""
    return value.strip().casefold()

def main():
    print(normalize_label(" EAST "))

if __name__ == "__main__":
    main()
```

Then import it from a sibling script:

```python
import label_tools
from label_tools import normalize_label

assert label_tools.normalize_label(" West ") == "west"
assert normalize_label(" EAST ") == "east"
```

Python normally executes a module's top-level code on its first import and caches the module in `sys.modules`. Repeated imports usually reuse it; they are not a promise to rerun initialization. Avoid surprising file writes, network calls or command-line work at import time.

When run directly, a module's `__name__` is `"__main__"`. The guard above allows command-line behavior without performing it during an ordinary import. It does not prevent the rest of the module's top-level definitions from executing.

## Packages organize modules {#packages}

A regular package is a directory with `__init__.py`. Namespace packages can work without that file, but use a regular package for this first example.

```text
practice/
├── check_labels.py
└── parcel_tools/
    ├── __init__.py
    ├── __main__.py
    └── labels.py
```

```python
# file: parcel_tools/labels.py
def normalize(value):
    return value.strip().casefold()
```

```python
# file: parcel_tools/__init__.py
from .labels import normalize
```

```python
# file: parcel_tools/__main__.py
from . import normalize

def main():
    print(normalize(" NORTH "))

if __name__ == "__main__":
    main()
```

```python
import parcel_tools
from parcel_tools.labels import normalize

assert parcel_tools.normalize(" SOUTH ") == "south"
assert normalize(" NORTH ") == "north"
```

The leading dot in `from .labels` is a relative import within the package. An absolute path such as `from parcel_tools.labels import normalize` names the package explicitly. Nested package paths follow the same idea, for example `package.subpackage.module`.

## Running a package {#entry-points}

From the parent directory, use the module entry point:

```bash
python -m parcel_tools
# north
```

`__init__.py` participates in package import; `__main__.py` provides its `python -m` behavior. For this layout, running `python parcel_tools/__main__.py` directly loses the intended package context for the relative import. Prefer the documented `-m` invocation.

You can check the entry point programmatically as well:

```python
from contextlib import redirect_stdout
from io import StringIO
import runpy

output = StringIO()
with redirect_stdout(output):
    runpy.run_module("parcel_tools", run_name="__main__")
assert output.getvalue().strip() == "north"
```

The course's example checker writes the labelled `# file:` blocks into a temporary practice folder before running these imports. When working manually, create the files shown in the tree first.

## Try it yourself

Move a small formatting helper into a module, import it from another script, then add a package entry point. Verify that importing the package does not run the command-line demonstration.

??? question "What is the difference between __init__.py and __main__.py?"
    A regular package's `__init__.py` establishes its import-time package namespace. `__main__.py` defines what happens when that package is executed with `python -m package_name`. They serve different entry paths.

[Next: Useful built-ins →](builtins.md){ .md-button .md-button--primary }
