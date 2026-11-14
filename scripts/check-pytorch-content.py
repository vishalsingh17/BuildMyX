"""Check complete PyTorch topic coverage, source bundles and teaching programs."""

from __future__ import annotations

import argparse
from html.parser import HTMLParser
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess
import sys
from tempfile import TemporaryDirectory
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "learning/content/pytorch"
FENCES = re.compile(r"^```python([^\n]*)\n(.*?)^```[ \t]*$", re.M | re.S)


class Document(HTMLParser):
    def __init__(self, value):
        super().__init__()
        self.ids = set()
        self.parts = []
        self.feed(value)

    def handle_starttag(self, tag, attrs):
        identifier = dict(attrs).get("id")
        if identifier:
            self.ids.add(identifier)

    def handle_data(self, value):
        self.parts.append(value)


def bundle_files():
    spec = importlib.util.spec_from_file_location("package_pytorch", ROOT / "scripts/package-pytorch-projects.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    expected = module.project_files()
    with ZipFile(CONTENT / "assets/pytorch-projects.zip") as archive:
        if sorted(archive.namelist()) != sorted(expected):
            raise ValueError("The project download must contain exactly the documented source files.")
        for name, source in expected.items():
            if archive.read(name).decode("utf-8") != source:
                raise ValueError(f"Stale source bundle: {name}; run scripts/package-pytorch-projects.py")
    return expected


def check(*, html=False, execute=False):
    if sys.version_info < (3, 12):
        raise ValueError("PyTorch learning checks require Python 3.12 or newer.")
    inventory = json.loads((ROOT / "learning/pytorch-reference-topics.json").read_text(encoding="utf-8"))
    mapping = json.loads((ROOT / "learning/pytorch-topic-map.json").read_text(encoding="utf-8"))
    ids = [item["id"] for item in inventory["headings"]]
    if len(ids) != 252 or len(set(ids)) != 252:
        raise ValueError("Expected the 252 unique captured PyTorch headings.")
    if set(ids) != set(mapping):
        raise ValueError(f"Coverage mismatch: missing={set(ids) - set(mapping)}, extra={set(mapping) - set(ids)}")
    documents = {}
    if not html:
        import markdown
    targets = set(mapping.values()) | {item["target"] for item in inventory["unheaded_topics"]}
    for target in targets:
        filename, anchor = target.split("#", 1)
        if Path(filename).name != filename or not filename.endswith(".md"):
            raise ValueError(f"Invalid mapped lesson: {filename}")
        if filename not in documents:
            if html:
                source = ROOT / "public/learn/pytorch" / Path(filename).stem / "index.html"
                documents[filename] = Document(source.read_text(encoding="utf-8"))
            else:
                value = (CONTENT / filename).read_text(encoding="utf-8")
                documents[filename] = Document(markdown.markdown(value, extensions=["toc", "attr_list", "pymdownx.superfences"]))
        if anchor not in documents[filename].ids:
            raise ValueError(f"Missing {'rendered' if html else 'source'} PyTorch anchor: {target}")
    coverage = (CONTENT / "coverage.md").read_text(encoding="utf-8")
    for heading in inventory["headings"]:
        if f'{inventory["source_url"]}#{heading["id"]}' not in coverage or mapping[heading["id"]] not in coverage:
            raise ValueError(f"Public coverage index is missing {heading['id']}")
    for filename, terms in inventory["supplemental_terms"].items():
        value = "".join(documents[filename].parts) if html else (CONTENT / filename).read_text(encoding="utf-8")
        missing = [term for term in terms if term not in value]
        if missing:
            raise ValueError(f"Missing PyTorch API/subtopic in {filename}: {missing}")

    projects = bundle_files()
    for asset in ("assets/pytorch-projects.zip", "assets/hyperparameter-results.svg"):
        source = CONTENT / asset
        if not source.is_file():
            raise ValueError(f"Missing teaching asset: {asset}")
        if html and (ROOT / "public/learn/pytorch" / asset).read_bytes() != source.read_bytes():
            raise ValueError(f"Published teaching asset differs from source: {asset}")
    if html:
        print("PyTorch HTML: all 252 topic anchors, unheaded material, supplementary topics and teaching assets resolve.")
        return
    if execute:
        import torch
        if torch.__version__.split("+")[0] != inventory["validated_environment"]["torch"]:
            raise ValueError("Run PyTorch examples against the documented pinned version.")
    chapters, core_count, optional_count = [], 0, 0
    for source in sorted(CONTENT.glob("*.md")):
        value = source.read_text(encoding="utf-8")
        chapter = re.search(r"^lesson: CHAPTER (\d+) OF 20$", value, re.M)
        if not chapter:
            continue
        chapters.append(int(chapter[1]))
        if '??? question "Check your reasoning"' not in value:
            raise ValueError(f"Missing self-check in {source.name}")
        code, fixtures = [], {}
        for number, (options, block) in enumerate(FENCES.findall(value), 1):
            compile(block, f"{source.name}:example-{number}", "exec")
            if 'title="Optional:' in options:
                optional_count += 1
                continue
            core_count += 1
            marker = re.match(r"# file: ([^\n]+)\n", block)
            if marker:
                filename = Path(marker[1])
                if filename.is_absolute() or ".." in filename.parts:
                    raise ValueError(f"Fixture escapes its practice folder: {filename}")
                fixtures[str(filename)] = block
            else:
                code.append(f"# Example {number} from {source.name}\n{block}")
        if not code:
            raise ValueError(f"Missing runnable example in {source.name}")
        if not execute:
            continue
        with TemporaryDirectory(prefix="buildmyx-pytorch-") as directory:
            folder = Path(directory)
            # Chapter 20 explicitly reuses the complete source bundle.
            files = {**projects, **fixtures} if source.stem == "orchestration" else fixtures
            for filename, contents in files.items():
                target = folder / filename
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(contents, encoding="utf-8")
            prelude = "import sys\nfrom pathlib import Path\nsys.path.insert(0, str(Path.cwd()))\nimport torch\ntorch.set_num_threads(1)\ntorch.set_num_interop_threads(1)\n"
            program = folder / "practice.py"
            program.write_text(prelude + "\n\n".join(code), encoding="utf-8")
            environment = {"PATH": os.defpath, "LANG": "C.UTF-8", "LC_ALL": "C.UTF-8",
                "MPLBACKEND": "Agg", "MPLCONFIGDIR": directory, "XDG_CACHE_HOME": directory,
                "XDG_CONFIG_HOME": directory, "OMP_NUM_THREADS": "1", "MKL_NUM_THREADS": "1",
                "OPENBLAS_NUM_THREADS": "1", "CUDA_VISIBLE_DEVICES": "", "WANDB_MODE": "offline",
                "WANDB_CONFIG_DIR": directory, "WANDB_CACHE_DIR": directory, "WANDB_DATA_DIR": directory}
            result = subprocess.run([sys.executable, "-I", str(program)], cwd=folder, env=environment,
                capture_output=True, text=True, encoding="utf-8", timeout=90)
            if result.returncode:
                raise ValueError(f"Example failed in {source.name}:\n{result.stderr[-6000:]}")
            print(f"PASS PyTorch CPU: {source.name}", flush=True)
    if sorted(chapters) != list(range(1, 21)):
        raise ValueError(f"Expected chapters 1–20 exactly once; got {chapters}")
    terms = sum(len(items) for items in inventory["supplemental_terms"].values())
    mode = "CPU chapter programs passed" if execute else "syntax checked; CPU execution is required in CI"
    print(f"PyTorch content: 252 mapped headings, {terms} supplementary checks, {core_count} core blocks and {optional_count} explicit optional recipes across 20 chapters; {mode}.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--html", action="store_true", help="Check generated anchors and published assets.")
    mode.add_argument("--execute", action="store_true", help="Execute core teaching programs on the pinned CPU runtime.")
    args = parser.parse_args()
    try:
        check(html=args.html, execute=args.execute)
    except (ValueError, OSError, SyntaxError, subprocess.TimeoutExpired) as error:
        print(f"PyTorch learning validation failed: {error}", file=sys.stderr)
        sys.exit(1)
