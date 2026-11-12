import assert from "node:assert/strict";
import { test } from "node:test";
import {
  collectorDestination,
  posthogDestination,
} from "./analytics-destination";
test("an invalid PostHog destination can select a valid HTTPS alternative", () => {
  assert.equal(
    posthogDestination("private-key", "https://us.i.posthog.com"),
    null,
  );
  assert.equal(
    collectorDestination("https://collector.example/events"),
    "https://collector.example/events",
  );
  for (const value of [
    "http://collector.example/events",
    "https://user:secret@collector.example",
    "javascript:alert(1)",
    "https://collector.example/#fragment",
  ])
    assert.equal(collectorDestination(value), null);
});
