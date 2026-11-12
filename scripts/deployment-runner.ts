import type { deploymentPlan } from "./deployment-plan";

export function buildAndDeploy(
  plan: ReturnType<typeof deploymentPlan>,
  execute: (
    tool: "website" | "backend",
    environment: NodeJS.ProcessEnv,
  ) => number,
) {
  // Build failures must not change database functions. Vercel only publishes after both steps pass.
  const { CONVEX_DEPLOY_KEY: _key, ...websiteEnvironment } = plan.environment;
  const buildStatus = execute("website", websiteEnvironment);
  if (buildStatus !== 0) return buildStatus;
  return execute("backend", plan.environment);
}
