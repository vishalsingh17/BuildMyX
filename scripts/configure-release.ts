import { spawnSync } from "node:child_process";
import { releaseProtection, releaseIsProtected } from "./release-policy";

const repository = "vishalsingh17/BuildMyX";
const mode = process.argv[2] ?? "--check";
if (!["--check", "--apply"].includes(mode))
  throw new Error("Use --check or --apply.");
function github(path: string, method = "GET", body?: object) {
  const response = spawnSync(
    "gh",
    ["api", path, "--method", method, ...(body ? ["--input", "-"] : [])],
    {
      encoding: "utf8",
      input: body ? JSON.stringify(body) : undefined,
    },
  );
  if (response.error)
    throw new Error(
      "Install GitHub CLI and authenticate with repository Administration and Contents access.",
    );
  if (response.status !== 0) {
    if (
      response.stderr.includes("HTTP 404") &&
      method === "GET" &&
      path.endsWith("/protection")
    )
      return null;
    if (response.stderr.includes("HTTP 403"))
      throw new Error(
        "GitHub denied this account/token access to branch protection. Repository Administration permission is required; no protection was changed.",
      );
    throw new Error(
      `GitHub ${method} failed for ${path}. ${response.stderr.trim()}`,
    );
  }
  return JSON.parse(response.stdout);
}
try {
  const path = `repos/${repository}/branches/main/protection`;
  const current = github(path);
  if (mode === "--apply") {
    github(`repos/${repository}/branches/dev`);
    const updated = github(path, "PUT", releaseProtection(current));
    if (!releaseIsProtected(updated))
      throw new Error("GitHub did not confirm the required release gate.");
    console.log(
      "main now requires a release PR, Quality checks, Release source and Vercel. Admins must follow the gate too.",
    );
  } else {
    if (!releaseIsProtected(current)) {
      console.error(
        "The production gate is not active. Authenticate with Administration access and run npm run release:protect.",
      );
      process.exitCode = 1;
    } else
      console.log(
        "The production branch requires passing development checks and a manually merged release PR.",
      );
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
