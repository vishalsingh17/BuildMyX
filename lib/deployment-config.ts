/** Public deployment identities. Each environment owns its own data and secrets. */
export const deployments = {
  development: { name: "tacit-badger-38", keyType: "dev" },
  production: { name: "kindhearted-hippopotamus-469", keyType: "prod" },
} as const;

export type DeploymentEnvironment = keyof typeof deployments;

export function deploymentEnvironment(
  environment: Record<string, string | undefined>,
): DeploymentEnvironment {
  if (environment.VERCEL_ENV === "production") return "production";
  if (environment.VERCEL_ENV) return "development";
  return environment.APP_ENV === "production" ? "production" : "development";
}

export function deploymentUrls(environment: DeploymentEnvironment) {
  const { name } = deployments[environment];
  return {
    cloud: `https://${name}.convex.cloud`,
    site: `https://${name}.convex.site`,
  };
}
