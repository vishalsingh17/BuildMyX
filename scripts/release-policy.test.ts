import assert from "node:assert/strict";
import { test } from "node:test";
import { releaseIsProtected, releaseProtection } from "./release-policy";
test("a new production gate requires checks, a PR and administrator enforcement", () => {
  const policy = releaseProtection(null);
  assert.equal(policy.enforce_admins, true);
  assert.deepEqual(
    policy.required_status_checks.checks.map((check) => check.context),
    ["Quality checks", "Release source", "Vercel"],
  );
  assert.ok(policy.required_pull_request_reviews);
  assert.equal(policy.allow_force_pushes, false);
  assert.equal(policy.allow_deletions, false);
  assert.equal(releaseIsProtected(null), false);
});
test("adding the release gate preserves existing reviewers, required checks and actor restrictions", () => {
  const policy = releaseProtection({
    required_status_checks: {
      checks: [{ context: "Existing check", app_id: 123 }],
    },
    required_pull_request_reviews: {
      required_approving_review_count: 2,
      require_code_owner_reviews: true,
    },
    restrictions: {
      users: [{ login: "release-owner" }],
      teams: [{ slug: "maintainers" }],
    },
    required_linear_history: { enabled: true },
  });
  assert.equal(
    policy.required_pull_request_reviews.required_approving_review_count,
    2,
  );
  assert.equal(
    policy.required_pull_request_reviews.require_code_owner_reviews,
    true,
  );
  assert.deepEqual(policy.required_status_checks.checks[0], {
    context: "Existing check",
    app_id: 123,
  });
  assert.deepEqual(policy.restrictions, {
    users: ["release-owner"],
    teams: ["maintainers"],
    apps: [],
  });
  assert.equal(policy.required_linear_history, true);
});

test("legacy required status contexts survive an empty integration-check list", () => {
  const policy = releaseProtection({
    required_status_checks: { checks: [], contexts: ["Legacy check"] },
  });
  assert.ok(
    policy.required_status_checks.checks.some(
      (check) => check.context === "Legacy check",
    ),
  );
});
