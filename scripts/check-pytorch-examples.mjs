import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const python = resolve(
  root,
  ".venv",
  process.platform === "win32" ? "Scripts/python.exe" : "bin/python",
);
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
  if (result.error || result.status !== 0) {
    throw new Error("PyTorch teaching checks failed.", { cause: result.error });
  }
}

// The web host needs only Zensical. Local/CI execution installs the CPU runtime
// explicitly, in the same ignored project-local virtual environment.
run(process.execPath, ["scripts/setup-learning.mjs"]);
const requirements = resolve(root, "learning/requirements-pytorch.txt");
const digest = createHash("sha256")
  .update(readFileSync(requirements))
  .update(readFileSync(resolve(root, "learning/requirements.txt")))
  .digest("hex");
const marker = resolve(root, ".venv/.pytorch-requirements");
if (!existsSync(marker) || readFileSync(marker, "utf8") !== digest) {
  run(python, [
    "-m",
    "pip",
    "install",
    "--disable-pip-version-check",
    "--no-cache-dir",
    "-r",
    requirements,
  ]);
  writeFileSync(marker, digest);
}
run(python, ["scripts/check-pytorch-content.py", "--execute"]);
