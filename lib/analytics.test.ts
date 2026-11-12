import assert from "node:assert/strict";
import { test } from "node:test";
import { analyticsPayload } from "./analytics";
test("analytics excludes drafts, URLs, query strings and unapproved keys", () => {
  const payload = analyticsPayload("cta_click", "/?email=visitor@example.com", {
    interest: "ai",
    placement: "hero",
    ...{
      email: "visitor@example.com",
      description: "Private request",
      resource: "https://private.example/path",
    },
  });
  assert.deepEqual(payload, {
    event: "cta_click",
    path: "/other",
    interest: "ai",
    placement: "hero",
  });
});
