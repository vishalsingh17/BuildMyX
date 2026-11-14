import { spawnSync } from "node:child_process";

// A failed documentation build must stop before Next or a backend deployment.
for (const args of [
  ["node_modules/tsx/dist/cli.mjs", "scripts/build-learn.ts"],
  ["node_modules/next/dist/bin/next", "build", "--webpack"],
]) {
  const result = spawnSync(process.execPath, args, {
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "production" },
  });
  if (result.error || result.status !== 0) process.exit(result.status || 1);
}
