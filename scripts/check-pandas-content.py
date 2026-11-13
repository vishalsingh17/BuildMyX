"""Check pandas reference coverage, executable examples and published lesson anchors."""

from __future__ import annotations

import argparse
import ast
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import subprocess
import sys
from tempfile import TemporaryDirectory

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "learning/content/pandas"
FENCES = re.compile(r"^```python(?:[ \t]+[^\n]*)?\n(.*?)^```[ \t]*$", re.M | re.S)


class Document(HTMLParser):
    def __init__(self, value: str):
        super().__init__()
        self.ids: set[str] = set()
        self.text_parts: list[str] = []
        self.feed(value)

    def handle_starttag(self, tag, attrs):
        identifier = dict(attrs).get("id")
        if identifier:
            self.ids.add(identifier)

    def handle_data(self, value):
        self.text_parts.append(value)


def check(html: bool) -> None:
    if sys.version_info < (3, 12):
        raise ValueError("Pandas lesson validation requires Python 3.12 or newer.")
    inventory = json.loads((ROOT / "learning/pandas-reference-topics.json").read_text(encoding="utf-8"))
    mapping = json.loads((ROOT / "learning/pandas-topic-map.json").read_text(encoding="utf-8"))
    heading_ids = [item["id"] for item in inventory["headings"]]
    if len(heading_ids) != 117 or len(set(heading_ids)) != 117:
        raise ValueError("The captured pandas inventory must contain 117 unique heading IDs.")
    if set(heading_ids) != set(mapping):
        raise ValueError(f"Coverage mismatch: missing={set(heading_ids) - set(mapping)}, extra={set(mapping) - set(heading_ids)}")

    documents: dict[str, Document] = {}
    if not html:
        import markdown
    for target in set(mapping.values()):
        filename, anchor = target.split("#", 1)
        if Path(filename).name != filename or not filename.endswith(".md"):
            raise ValueError(f"Invalid mapped chapter: {filename}")
        if filename not in documents:
            source = CONTENT / filename
            if html:
                output = ROOT / "public/learn/pandas" / source.stem / "index.html"
                documents[filename] = Document(output.read_text(encoding="utf-8"))
            else:
                documents[filename] = Document(markdown.markdown(source.read_text(encoding="utf-8"), extensions=["toc", "attr_list", "fenced_code"]))
        if anchor not in documents[filename].ids:
            raise ValueError(f"Missing {'rendered' if html else 'source'} pandas anchor: {target}")

    coverage = (CONTENT / "coverage.md").read_text(encoding="utf-8")
    for heading in inventory["headings"]:
        if f'{inventory["source_url"]}#{heading["id"]}' not in coverage or mapping[heading["id"]] not in coverage:
            raise ValueError(f"Public coverage index is missing {heading['id']}")
    for filename, terms in inventory["supplemental_terms"].items():
        text = "".join(documents[filename].text_parts) if html else (CONTENT / filename).read_text(encoding="utf-8")
        missing = [term for term in terms if term not in text]
        if missing:
            raise ValueError(f"Missing pandas API topics in {filename}: {missing}")

    sample = CONTENT / "data/workshop-enrolments.csv"
    figure = CONTENT / "assets/workshop-seats.svg"
    if not sample.is_file() or not figure.is_file():
        raise ValueError("The downloadable dataset and original plotting figure must exist.")
    if html:
        for asset in (sample, figure):
            generated = ROOT / "public/learn/pandas" / asset.relative_to(CONTENT)
            if generated.read_bytes() != asset.read_bytes():
                raise ValueError(f"Published pandas asset differs from source: {asset.name}")
        print("Pandas HTML: all 117 topic anchors, supplementary API topics, dataset and plot resolve.")
        return

    import pandas as pd
    if pd.__version__ != inventory["validated_environment"]["pandas"]:
        raise ValueError("Pandas examples must run against the documented pinned version.")
    chapters = []
    block_count = 0
    for source in sorted(CONTENT.glob("*.md")):
        content = source.read_text(encoding="utf-8")
        chapter = re.search(r"^lesson: CHAPTER (\d+) OF 15$", content, re.M)
        if not chapter:
            continue
        chapters.append(int(chapter[1]))
        blocks = list(FENCES.finditer(content))
        if not blocks or '??? question "Check your reasoning"' not in content:
            raise ValueError(f"Missing examples or self-check in {source.name}")
        code = []
        for number, block in enumerate(blocks, 1):
            compile(block[1], f"{source.name}:example-{number}", "exec")
            code.append(f"# Example {number} from {source.name}\n{block[1]}")
        program = "\n\n".join(code)
        if source.name == "project.md":
            fixtures = [node.value.value for node in ast.walk(ast.parse(program)) if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == "sample" for t in node.targets) and isinstance(node.value, ast.Constant)]
            if fixtures != [sample.read_text(encoding="utf-8")]:
                raise ValueError("The project's inline fixture must match the downloadable CSV.")
        with TemporaryDirectory(prefix="buildmyx-pandas-") as folder:
            working = Path(folder)
            script = working / "practice.py"
            script.write_text(program, encoding="utf-8")
            result = subprocess.run(
                [sys.executable, "-I", str(script)],
                cwd=working,
                text=True,
                encoding="utf-8",
                capture_output=True,
                timeout=30,
                # Only trusted course examples run, with no application credentials,
                # desktop clipboard or interactive plotting requirement.
                env={"PATH": os.defpath, "LANG": "C.UTF-8", "LC_ALL": "C.UTF-8", "MPLBACKEND": "Agg", "MPLCONFIGDIR": folder, "XDG_CACHE_HOME": folder},
            )
            if result.returncode:
                raise ValueError(f"Example failed in {source.name}:\n{result.stderr[-6000:]}")
        block_count += len(blocks)
    if sorted(chapters) != list(range(1, 16)):
        raise ValueError(f"Expected pandas chapters 1 through 15 exactly once; got {chapters}")
    terms = sum(len(terms) for terms in inventory["supplemental_terms"].values())
    print(f"Pandas content: 117 mapped headings, {terms} supplementary API checks and {block_count} code blocks across 15 chapters passed.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--html", action="store_true", help="Validate generated lesson anchors and assets.")
    args = parser.parse_args()
    try:
        check(args.html)
    except (ValueError, OSError, subprocess.TimeoutExpired, SyntaxError) as error:
        print(f"Pandas learning validation failed: {error}", file=sys.stderr)
        sys.exit(1)
