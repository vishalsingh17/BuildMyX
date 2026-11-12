import assert from "node:assert/strict";
import { test } from "node:test";
import { deploymentPlan } from "./deployment-plan";

const development = {
  VERCEL_ENV: "preview",
  VERCEL_GIT_COMMIT_REF: "dev",
  CONVEX_DEPLOY_KEY: "dev:tacit-badger-38|test-only",
};
const production = {
  VERCEL_ENV: "production",
  VERCEL_GIT_COMMIT_REF: "main",
  CONVEX_DEPLOY_KEY: "prod:kindhearted-hippopotamus-469|test-only",
};

test("development deploys its backend and disables production analytics and indexing", () => {
  const plan = deploymentPlan({
    ...development,
    NEXT_PUBLIC_ANALYTICS_ENABLED: "true",
    NEXT_PUBLIC_LAUNCH_APPROVED: "true",
  });
  assert.equal(plan.stage, "development");
  assert.equal(
    plan.environment.ENQUIRY_CONVEX_SITE_URL,
    "https://tacit-badger-38.convex.site",
  );
  assert.equal(plan.environment.NEXT_PUBLIC_ANALYTICS_ENABLED, "false");
  assert.equal(plan.environment.NEXT_PUBLIC_LAUNCH_APPROVED, "false");
});
test("production deploys only main with the exact production credential", () => {
  const plan = deploymentPlan(production);
  assert.equal(plan.stage, "production");
  assert.equal(
    plan.environment.ENQUIRY_CONVEX_SITE_URL,
    "https://kindhearted-hippopotamus-469.convex.site",
  );
  assert.equal(plan.environment.NEXT_PUBLIC_ANALYTICS_ENABLED, "true");
});
test("missing, swapped, project-wide and unrelated deployment keys fail before deploying", () => {
  for (const CONVEX_DEPLOY_KEY of [
    undefined,
    "",
    production.CONVEX_DEPLOY_KEY,
    "dev:other-deployment|test-only",
    "project:team:project|test-only",
    "dev:tacit-badger-38|",
  ]) {
    assert.throws(
      () => deploymentPlan({ ...development, CONVEX_DEPLOY_KEY }),
      /deployment-scoped/,
    );
  }
  assert.throws(
    () =>
      deploymentPlan({
        ...production,
        CONVEX_DEPLOY_KEY: development.CONVEX_DEPLOY_KEY,
      }),
    /deployment-scoped/,
  );
});
test("arbitrary branches, unknown Vercel stages and local builds cannot mutate a backend", () => {
  for (const values of [
    { ...development, VERCEL_GIT_COMMIT_REF: "feature/test" },
    { ...production, VERCEL_GIT_COMMIT_REF: "dev" },
    { ...development, VERCEL_ENV: "development" },
    {},
  ]) {
    assert.throws(() => deploymentPlan(values));
  }
});
