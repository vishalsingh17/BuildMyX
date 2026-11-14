import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvConfig } from "@next/env";
import { canIndexSite } from "../lib/launch";
import { learningPaths } from "../lib/learning";

async function main() {
  const root = process.cwd();
  loadEnvConfig(root, process.env.NODE_ENV !== "production");
  const { siteConfig } = await import("../lib/site-config");
  const run = (command: string, args: string[]) => {
    const result = spawnSync(command, args, { stdio: "inherit" });
    if (result.error || result.status !== 0)
      throw new Error("Learning build failed.", { cause: result.error });
  };
  run(process.execPath, ["scripts/setup-learning.mjs"]);
  const python = resolve(
    root,
    ".venv",
    process.platform === "win32" ? "Scripts/python.exe" : "bin/python",
  );
  const temporaryConfig = resolve(root, ".zensical-build.toml");
  run(python, ["scripts/check-python-content.py"]);
  run(python, ["scripts/check-pandas-content.py"]);
  run(python, ["scripts/check-pytorch-content.py"]);
  run(python, ["scripts/check-generative-ai.py"]);
  const canIndex = canIndexSite(
    siteConfig.canonicalUrl,
    siteConfig.launchApproved,
    process.env.VERCEL_ENV ||
      process.env.CONTEXT ||
      process.env.NODE_ENV ||
      "development",
  );
  const config = readFileSync("zensical.toml", "utf8")
    .replace(
      /^site_url = .+$/m,
      `site_url = ${JSON.stringify(new URL("/learn/", siteConfig.canonicalUrl).toString())}`,
    )
    .replace(/^indexing_allowed = false$/m, `indexing_allowed = ${canIndex}`);
  try {
    writeFileSync(temporaryConfig, config);
    rmSync(resolve(root, "public/learn"), { recursive: true, force: true });
    run(python, [
      "-m",
      "zensical",
      "build",
      "--strict",
      "--clean",
      "-f",
      temporaryConfig,
    ]);
    for (const path of learningPaths) {
      if (!existsSync(resolve(root, `public${path}index.html`)))
        throw new Error(`Missing learning page: ${path}`);
    }
    console.log(
      `Built ${learningPaths.length} learning pages; indexing ${canIndex ? "enabled" : "disabled"}.`,
    );
  } finally {
    rmSync(temporaryConfig, { force: true });
  }
  run(python, ["scripts/check-python-content.py", "--html"]);
  run(python, ["scripts/check-pandas-content.py", "--html"]);
  run(python, ["scripts/check-pytorch-content.py", "--html"]);
  run(python, ["scripts/check-generative-ai.py", "--html"]);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
