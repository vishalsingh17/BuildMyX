import { deploymentUrls, deployments } from "../lib/deployment-config";

export function deploymentPlan(
  environment: Record<string, string | undefined>,
) {
  const production = environment.VERCEL_ENV === "production";
  const stage = production ? "production" : "development";
  if (!["production", "preview"].includes(environment.VERCEL_ENV ?? ""))
    throw new Error(
      "Deployment builds require VERCEL_ENV=preview or production. Use npm run build for local checks.",
    );
  const branch = environment.VERCEL_GIT_COMMIT_REF;
  if (branch !== (production ? "main" : "dev"))
    throw new Error("Only dev previews and approved main releases can deploy.");
  const target = deployments[stage];
  const key = environment.CONVEX_DEPLOY_KEY?.trim();
  const prefix = `${target.keyType}:${target.name}|`;
  if (!key?.startsWith(prefix) || key.length <= prefix.length)
    throw new Error(
      `Configure a deployment-scoped CONVEX_DEPLOY_KEY for ${stage} (${target.name}). No deployment was attempted.`,
    );
  const urls = deploymentUrls(stage);
  const buildEnvironment: NodeJS.ProcessEnv = {
    ...environment,
    NODE_ENV: "production",
    CONVEX_DEPLOY_KEY: key,
    APP_ENV: stage,
    CONVEX_DEPLOYMENT: `${target.keyType}:${target.name}`,
    NEXT_PUBLIC_CONVEX_URL: urls.cloud,
    NEXT_PUBLIC_CONVEX_SITE_URL: urls.site,
    ENQUIRY_CONVEX_SITE_URL: urls.site,
    NEXT_PUBLIC_ANALYTICS_ENABLED: production
      ? (environment.NEXT_PUBLIC_ANALYTICS_ENABLED ?? "true")
      : "false",
    NEXT_PUBLIC_LAUNCH_APPROVED: production
      ? (environment.NEXT_PUBLIC_LAUNCH_APPROVED ?? "true")
      : "false",
  };
  return {
    stage,
    name: target.name,
    environment: buildEnvironment,
  };
}
