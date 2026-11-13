import { spawnSync } from "node:child_process";
import { deploymentPlan } from "./deployment-plan";
import { buildAndDeploy } from "./deployment-runner";

const plan = deploymentPlan(process.env);
console.log(
  `Target: ${plan.stage} (${plan.name}). Building the website, then deploying its backend before publishing.`,
);
process.exitCode = buildAndDeploy(plan, (tool, environment) => {
  const args =
    tool === "website"
      ? ["node_modules/next/dist/bin/next", "build", "--webpack"]
      : ["node_modules/convex/bin/main.js", "deploy", "--typecheck", "enable"];
  const result = spawnSync(process.execPath, args, {
    stdio: "inherit",
    env: environment,
  });
  return result.error ? 1 : (result.status ?? 1);
});
