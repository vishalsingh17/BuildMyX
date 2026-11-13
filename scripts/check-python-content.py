"""Validate the primer inventory, lesson anchors and executable teaching examples."""

from __future__ import annotations

import argparse
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import subprocess
import sys
from tempfile import TemporaryDirectory

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "learning/content/python"
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
        raise ValueError("Python lesson validation requires Python 3.12 or newer.")
    inventory = json.loads((ROOT / "learning/python-reference-topics.json").read_text(encoding="utf-8"))
    mapping = json.loads((ROOT / "learning/python-topic-map.json").read_text(encoding="utf-8"))
    heading_ids = [item["id"] for item in inventory["headings"]]
    if len(heading_ids) != 160 or len(set(heading_ids)) != 160:
        raise ValueError("The captured primer inventory must contain its 160 unique heading IDs.")
    if set(heading_ids) != set(mapping):
        raise ValueError(f"Coverage mismatch: missing={set(heading_ids) - set(mapping)}, extra={set(mapping) - set(heading_ids)}")

    documents: dict[str, Document] = {}
    if not html:
        import markdown
    for target in set(mapping.values()):
        filename, anchor = target.split("#", 1)
        if filename not in documents:
            source = CONTENT / filename
            if not source.is_file():
                raise ValueError(f"Missing mapped lesson: {filename}")
            if html:
                output = ROOT / "public/learn/python" / source.stem / "index.html"
                documents[filename] = Document(output.read_text(encoding="utf-8"))
            else:
                documents[filename] = Document(markdown.markdown(source.read_text(encoding="utf-8"), extensions=["toc", "attr_list", "fenced_code"]))
        if anchor not in documents[filename].ids:
            raise ValueError(f"Missing {'rendered' if html else 'source'} topic anchor: {target}")

    coverage = (CONTENT / "coverage.md").read_text(encoding="utf-8")
    for heading in inventory["headings"]:
        if f'{inventory["source_url"]}#{heading["id"]}' not in coverage or mapping[heading["id"]] not in coverage:
            raise ValueError(f"Public coverage index is missing {heading['id']}")
    for filename, terms in inventory["supplemental_terms"].items():
        text = "".join(documents[filename].text_parts) if html else (CONTENT / filename).read_text(encoding="utf-8")
        missing = [term for term in terms if term not in text]
        if missing:
            raise ValueError(f"Missing table/API topics in {filename}: {missing}")

    if html:
        print("Python coverage: all 160 reference headings and supplementary API tables resolve in generated HTML.")
        return

    chapters = []
    block_count = 0
    for source in sorted(CONTENT.glob("*.md")):
        content = source.read_text(encoding="utf-8")
        chapter = re.search(r"^lesson: CHAPTER (\d+) OF 15$", content, re.M)
        if not chapter:
            continue
        chapters.append(int(chapter[1]))
        blocks = list(FENCES.finditer(content))
        if not blocks:
            raise ValueError(f"No runnable examples in {source.name}")
        with TemporaryDirectory(prefix="buildmyx-python-") as folder:
            working = Path(folder)
            statements = ["import sys\nfrom pathlib import Path\nsys.path.insert(0, str(Path.cwd()))\n"]
            for number, block in enumerate(blocks, 1):
                code = block[1]
                compile(code, f"{source.name}:example-{number}", "exec")
                file_marker = re.match(r"# file: ([^\n]+)\n", code)
                if file_marker:
                    relative = Path(file_marker[1])
                    if relative.is_absolute() or ".." in relative.parts:
                        raise ValueError(f"Example fixture escapes its practice folder: {relative}")
                    destination = working / relative
                    destination.parent.mkdir(parents=True, exist_ok=True)
                    destination.write_text(code, encoding="utf-8")
                else:
                    statements.append(f"\n# Example {number} from {source.name}\n{code}\n")
            program = working / "practice.py"
            program.write_text("\n".join(statements), encoding="utf-8")
            result = subprocess.run(
                [sys.executable, "-I", str(program)],
                cwd=working,
                input="3\n",
                text=True,
                encoding="utf-8",
                capture_output=True,
                timeout=10,
                # Teaching examples never receive application credentials.
                env={"PATH": os.defpath, "LANG": "C.UTF-8", "LC_ALL": "C.UTF-8"},
            )
            if result.returncode:
                raise ValueError(f"Example failed in {source.name}:\n{result.stderr[-6000:]}")
            block_count += len(blocks)
    if sorted(chapters) != list(range(1, 16)):
        raise ValueError(f"Expected chapters 1 through 15 exactly once; got {chapters}")
    print(f"Python content: 160 mapped headings, supplementary API tables and {block_count} code blocks across 15 chapters passed.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--html", action="store_true", help="Validate generated Zensical anchors after the build.")
    args = parser.parse_args()
    try:
        check(args.html)
    except (ValueError, OSError, subprocess.TimeoutExpired, SyntaxError) as error:
        print(f"Python learning validation failed: {error}", file=sys.stderr)
        sys.exit(1)
