import assert from "node:assert/strict";
import { test } from "node:test";
import {
  posthogDestination,
  posthogEventName,
  posthogOptions,
  sanitizePosthogEvent,
} from "./posthog-config";
const id = "019a1234-1234-7123-8123-123456789abc";
const event = {
  uuid: id,
  event: "cta_click",
  properties: {
    token: "phc_example",
    distinct_id: id,
    $session_id: id,
    path: "/services/ai/",
    interest: "ai",
    placement: "hero",
  },
};
test("PostHog requires a public project token and its explicit cloud region", () => {
  assert.deepEqual(
    posthogDestination("phc_example", "https://eu.i.posthog.com"),
    { token: "phc_example", host: "https://eu.i.posthog.com" },
  );
  assert.equal(
    posthogDestination("phc_example", "https://us.i.posthog.com/")?.host,
    "https://us.i.posthog.com",
  );
  for (const token of [null, "", "phx_private-key"])
    assert.equal(posthogDestination(token, "https://eu.i.posthog.com"), null);
  for (const host of [
    null,
    "http://eu.i.posthog.com",
    "https://other.example",
    "https://eu.i.posthog.com/path",
    "https://eu.i.posthog.com?email=private",
    "https://user:password@eu.i.posthog.com",
  ])
    assert.equal(posthogDestination("phc_example", host), null);
});
test("outgoing SDK events preserve funnel labels and remove personal/default URL properties", () => {
  const result = sanitizePosthogEvent(
    {
      ...event,
      $set: { email: "private@example.com" },
      $set_once: { name: "Private Name" },
      properties: {
        ...event.properties,
        email: "private@example.com",
        description: "Private request",
        $initial_current_url: "https://example.com/?email=private@example.com",
        $referrer: "https://private.example/secret",
        $current_url: "https://example.com/?email=private@example.com",
      },
    },
    "https://build.example.com",
  );
  assert.deepEqual(result?.properties, {
    token: "phc_example",
    path: "/services/ai/",
    $pathname: "/services/ai/",
    $current_url: "https://build.example.com/services/ai/",
    $process_person_profile: false,
    interest: "ai",
    placement: "hero",
    distinct_id: id,
    $session_id: id,
  });
  assert.doesNotMatch(JSON.stringify(result), /Private|private|secret|\$set/);
});
test("page views map to the standard PostHog event and query strings stay excluded", () => {
  assert.equal(posthogEventName("page_view"), "$pageview");
  assert.equal(posthogEventName("enquiry_copy"), "enquiry_copy");
  const result = sanitizePosthogEvent(
    {
      ...event,
      event: "$pageview",
      properties: { ...event.properties, path: "/?email=private@example.com" },
    },
    "https://build.example.com",
  );
  assert.equal(result?.properties.path, "/other");
  assert.doesNotMatch(JSON.stringify(result), /private@example/);
});
test("autocapture, recordings, identification and non-anonymous IDs cannot pass the event guard", () => {
  for (const name of [
    "$autocapture",
    "$snapshot",
    "$identify",
    "$exception",
    "unknown",
  ])
    assert.equal(
      sanitizePosthogEvent(
        { ...event, event: name },
        "https://build.example.com",
      ),
      null,
    );
  assert.equal(
    sanitizePosthogEvent(
      {
        ...event,
        properties: { ...event.properties, distinct_id: "private@example.com" },
      },
      "https://build.example.com",
    ),
    null,
  );
});
test("SDK defaults preserve explicit-only collection and memory-only anonymous visits", () => {
  const config = posthogOptions(
    "https://eu.i.posthog.com",
    "https://build.example.com",
  );
  assert.equal(config.autocapture, false);
  assert.equal(config.capture_pageview, false);
  assert.equal(config.disable_session_recording, true);
  assert.equal(config.disable_external_dependency_loading, true);
  assert.equal(config.persistence, "memory");
  assert.equal(config.disable_persistence, true);
  assert.equal(config.person_profiles, "never");
  assert.equal(config.advanced_disable_flags, true);
  assert.equal(config.respect_dnt, true);
  assert.equal(config.ip, false);
});
