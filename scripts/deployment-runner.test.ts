import assert from "node:assert/strict";
import { test } from "node:test";
import { buildAndDeploy } from "./deployment-runner";
import { deploymentPlan } from "./deployment-plan";
const plan = () =>
  deploymentPlan({
    VERCEL_ENV: "preview",
    VERCEL_GIT_COMMIT_REF: "dev",
    CONVEX_DEPLOY_KEY: "dev:tacit-badger-38|test-only",
  });
test("a failed website build never invokes a backend deployment", () => {
  const calls: string[] = [];
  assert.equal(
    buildAndDeploy(plan(), (tool) => {
      calls.push(tool);
      return 1;
    }),
    1,
  );
  assert.deepEqual(calls, ["website"]);
});
test("both steps must pass and only the backend receives its deployment key", () => {
  for (const backendStatus of [0, 1]) {
    const calls: string[] = [];
    const status = buildAndDeploy(plan(), (tool, environment) => {
      calls.push(tool);
      assert.equal(
        environment.ENQUIRY_CONVEX_SITE_URL,
        "https://tacit-badger-38.convex.site",
      );
      assert.equal(Boolean(environment.CONVEX_DEPLOY_KEY), tool === "backend");
      return tool === "backend" ? backendStatus : 0;
    });
    assert.equal(status, backendStatus);
    assert.deepEqual(calls, ["website", "backend"]);
  }
});
