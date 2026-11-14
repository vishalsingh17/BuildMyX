"""Package the original chapter programs and fictional capstone fixtures."""
from pathlib import Path
import json
import re
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "learning/content/generative-ai"
FENCES = re.compile(r'^```python[^\n]*\n(.*?)^```[ \t]*$', re.M | re.S)

def project_files():
    curriculum = json.loads((ROOT / "learning/generative-ai-curriculum.json").read_text())
    files = {}
    for chapter in curriculum["chapters"]:
        source = (CONTENT / f'{chapter["slug"]}.md').read_text()
        code = "\n\n".join(FENCES.findall(source))
        files[f'labs/{chapter["order"]:02d}-{chapter["slug"]}.py'] = f'# BuildMyX Generative AI: {chapter["title"]}\n# Original CPU teaching example; run with Python 3.12+.\n\n{code}\n'
    for name in ("capstone_assistant.py", "test_capstone.py"):
        files[name] = (ROOT / "learning/projects/generative-ai" / name).read_text()
    files["curriculum.json"] = json.dumps(curriculum, indent=2) + "\n"
    files["README.md"] = '''# BuildMyX Generative AI labs

Use Python 3.12 or newer. The core examples use only the standard library.
Run a chapter program in a fresh process, for example:

    python3 labs/05-attention.py
    python3 capstone_assistant.py
    python3 -m unittest test_capstone.py

The 32 chapter programs contain their documented calculations and assertions.
The capstone is a deterministic extractive prototype with fictional workshop
records. It demonstrates retrieval, evidence references, abstention, response
validation and a bounded run. A hosted or local language-model adapter is a
separate extension requiring its own integration and evaluation.

The `role` argument simulates a trusted caller for an exercise. Real applications
must derive access scope from authoritative authentication/authorization;
untrusted input cannot confer staff permission.

These scripts do not call model services, send notifications, control hardware
or establish production model quality. Tests cover only the teaching fixtures.

Course: https://build-my-x.vercel.app/learn/generative-ai/
Source reading: https://build-my-x.vercel.app/learn/generative-ai/sources/

The explanations and programs are original BuildMyX teaching material.
The linked primers and research papers remain the work of their authors.
The archive contains no source-article copies, model weights or API keys.
'''
    return files

if __name__ == "__main__":
    destination = CONTENT / "assets/generative-ai-labs.zip"
    destination.parent.mkdir(parents=True, exist_ok=True)
    files = project_files()
    with ZipFile(destination, "w", compression=ZIP_DEFLATED) as archive:
        for name, contents in sorted(files.items()):
            info = ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
            info.compress_type = ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            archive.writestr(info, contents.encode())
    print(f"Packaged {len(files)} original Generative AI teaching files.")
