import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const python = resolve(
  root,
  ".venv",
  process.platform === "win32" ? "Scripts/python.exe" : "bin/python",
);
const requirements = resolve(root, "learning/requirements.txt");
const marker = resolve(root, ".venv/.learning-requirements");
const digest = createHash("sha256")
  .update(readFileSync(requirements))
  .digest("hex");
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
  if (result.error || result.status !== 0) {
    throw new Error(
      `Learning setup failed: ${command}. Install Python 3.11+ with venv/pip support, then run npm run setup:learn.`,
      { cause: result.error },
    );
  }
}
if (!existsSync(python))
  run(
    process.env.LEARNING_PYTHON ||
      (process.platform === "win32" ? "python" : "python3"),
    ["-m", "venv", resolve(root, ".venv")],
  );
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
run(python, ["-m", "zensical", "--version"]);
// Share the site's licensed local fonts with Zensical's standalone live preview.
cpSync(
  resolve(root, "public/fonts"),
  resolve(root, "learning/content/assets/fonts"),
  { recursive: true },
);
