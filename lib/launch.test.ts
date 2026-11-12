import assert from "node:assert/strict";
import { test } from "node:test";
import { canIndexSite } from "./launch";
test("only a cleared HTTPS production destination can be indexed", () => {
  assert.equal(canIndexSite("https://example.com", true, "production"), true);
  for (const url of [
    null,
    "",
    "invalid",
    "http://localhost:3000",
    "https://localhost",
    "https://user:password@example.com",
  ])
    assert.equal(canIndexSite(url, true), false);
  assert.equal(canIndexSite("https://example.com", false), false);
  for (const stage of [
    "preview",
    "development",
    "deploy-preview",
    "branch-deploy",
  ])
    assert.equal(canIndexSite("https://example.com", true, stage), false);
});
