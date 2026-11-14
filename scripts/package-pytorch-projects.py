"""Create the downloadable source bundle from the labelled teaching files."""

from pathlib import Path
import re
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "learning/content/pytorch"
FENCES = re.compile(r"^```python[^\n]*\n(.*?)^```[ \t]*$", re.M | re.S)

README = """# BuildMyX PyTorch teaching projects

These original projects use small synthetic fixtures. They do not establish
CIFAR-10 or IMDb benchmark performance. Python 3.12+ is required.

Create and activate a virtual environment, then install requirements-cpu.txt.
The explicit +cpu pins apply to Linux x86-64; other platforms use the matching
public torch version. See the official PyTorch installation selector if needed.

From this folder:

    python -m vision_project.train
    python -m text_project.train

These create local vision-artifact/ and text-artifact/ directories. They do not
start a public server. The course shows evaluation and in-process FastAPI tests.
Each serve.py exposes create_app(folder) for a separately configured server.

    python -c "from orchestration.common import train_candidate; print(train_candidate('vision', 'candidate-run-1'))"

The orchestration/prefect_pipeline.py and airflow_dags.py files are OPTIONAL
integration recipes, syntax-checked by the course tooling. They require a
separate Prefect 3 or Airflow 3 installation and runtime configuration. Running
a Prefect recipe starts its configured flow runtime; --schedule creates a served
deployment/schedule. An Airflow recipe belongs in its configured DAG environment.
No model promotion or notification integration is implemented by these recipes.

Read the lessons and complete source coverage at BuildMyX Learn:
https://build-my-x.vercel.app/learn/pytorch/

The source coverage checklist was inspired by the supplied Aman.ai PyTorch
primer, https://aman.ai/primers/pytorch/. Code and fixtures here are original.
"""


def project_files() -> dict[str, str]:
    result = {}
    for name in ("vision-project.md", "text-project.md", "orchestration.md"):
        for block in FENCES.findall((CONTENT / name).read_text(encoding="utf-8")):
            marker = re.match(r"# file: ([^\n]+)\n", block)
            if marker:
                filename = marker[1]
                if filename in result or Path(filename).is_absolute() or ".." in Path(filename).parts:
                    raise ValueError(f"Invalid or repeated project file: {filename}")
                compile(block, filename, "exec")
                result[filename] = block
    result["README.md"] = README
    requirements = (ROOT / "learning/requirements-pytorch.txt").read_text(encoding="utf-8").splitlines()
    base = (ROOT / "learning/requirements.txt").read_text(encoding="utf-8").splitlines()
    result["requirements-cpu.txt"] = "--extra-index-url https://download.pytorch.org/whl/cpu\n" + "\n".join(
        line for line in requirements + base if re.match(r"^(torch|fastapi|httpx|numpy)==", line)
    ) + "\n"
    return result


if __name__ == "__main__":
    destination = CONTENT / "assets/pytorch-projects.zip"
    destination.parent.mkdir(parents=True, exist_ok=True)
    files = project_files()
    with ZipFile(destination, "w", compression=ZIP_DEFLATED) as archive:
        for name, contents in sorted(files.items()):
            info = ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, contents.encode("utf-8"))
    print(f"Packaged {len(files)} source/README/requirements files in {destination.relative_to(ROOT)}.")
