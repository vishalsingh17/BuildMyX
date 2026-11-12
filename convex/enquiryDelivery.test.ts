/// <reference types="vite/client" />
import { beforeEach, afterEach, expect, test, vi } from "vitest";
import { convexTest } from "convex-test";
import rateLimiterTest from "@convex-dev/rate-limiter/test";
import schema from "./schema";
import { internal } from "./_generated/api";

const modules = import.meta.glob("./**/*.ts");
const id = "11111111-1111-4111-8111-111111111111";
const token = "22222222-2222-4222-8222-222222222222";
const nextToken = "33333333-3333-4333-8333-333333333333";
const payloadHash = "a".repeat(64);
const secret = "convex-test-secret-with-32-characters-minimum";
function setup() {
  const t = convexTest(schema, modules);
  rateLimiterTest.register(t);
  return t;
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-12T12:01:00Z"));
  vi.stubEnv("ENQUIRY_SERVICE_SECRET", secret);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

test("one claim owns delivery, and reusing an ID with changed content is rejected", async () => {
  const t = setup();
  expect(
    await t.mutation(internal.enquiryDelivery.claim, {
      id,
      payloadHash,
      token,
    }),
  ).toEqual({ tag: "acquired", ownerAccepted: false });
  expect(
    await t.mutation(internal.enquiryDelivery.claim, {
      id,
      payloadHash,
      token: nextToken,
    }),
  ).toEqual({ tag: "pending" });
  expect(
    await t.mutation(internal.enquiryDelivery.claim, {
      id,
      payloadHash: "b".repeat(64),
      token: nextToken,
    }),
  ).toEqual({ tag: "conflict" });
});
test("accepted owner state survives a lease timeout and is never sent again", async () => {
  const t = setup();
  await t.mutation(internal.enquiryDelivery.claim, { id, payloadHash, token });
  expect(
    await t.mutation(internal.enquiryDelivery.acceptOwner, {
      id,
      token,
      providerId: "owner-accepted",
    }),
  ).toBe(true);
  vi.advanceTimersByTime(60_001);
  expect(
    await t.mutation(internal.enquiryDelivery.claim, {
      id,
      payloadHash,
      token: nextToken,
    }),
  ).toEqual({ tag: "acquired", ownerAccepted: true });
  expect(
    await t.mutation(internal.enquiryDelivery.complete, {
      id,
      token,
      confirmationSent: true,
    }),
  ).toBe(false);
  expect(
    await t.mutation(internal.enquiryDelivery.complete, {
      id,
      token: nextToken,
      confirmationSent: false,
    }),
  ).toBe(true);
  expect(
    await t.mutation(internal.enquiryDelivery.claim, {
      id,
      payloadHash,
      token,
    }),
  ).toEqual({ tag: "complete", confirmationSent: false });
});
test("uncertain owner delivery preserves its ID and stops automatic replay after the provider window", async () => {
  const t = setup();
  await t.mutation(internal.enquiryDelivery.claim, { id, payloadHash, token });
  await t.mutation(internal.enquiryDelivery.uncertain, { id, token });
  expect(
    await t.mutation(internal.enquiryDelivery.claim, {
      id,
      payloadHash,
      token: nextToken,
    }),
  ).toEqual({ tag: "acquired", ownerAccepted: false });
  await t.mutation(internal.enquiryDelivery.uncertain, {
    id,
    token: nextToken,
  });
  vi.advanceTimersByTime(23 * 60 * 60_000);
  expect(
    await t.mutation(internal.enquiryDelivery.claim, {
      id,
      payloadHash,
      token,
    }),
  ).toEqual({ tag: "expired" });
});
test("an accepted owner remains a successful submission after a long receipt interruption", async () => {
  const t = setup();
  await t.mutation(internal.enquiryDelivery.claim, { id, payloadHash, token });
  await t.mutation(internal.enquiryDelivery.acceptOwner, {
    id,
    token,
    providerId: "owner-accepted",
  });
  vi.advanceTimersByTime(24 * 60 * 60_000);
  expect(
    await t.mutation(internal.enquiryDelivery.claim, {
      id,
      payloadHash,
      token: nextToken,
    }),
  ).toEqual({ tag: "complete", confirmationSent: false });
});
test("the shared component rejects the sixth request and releases a new fixed window", async () => {
  const t = setup();
  for (let count = 0; count < 6; count++)
    expect(
      await t.mutation(internal.enquiryDelivery.allow, { key: payloadHash }),
    ).toBe(count < 5);
  vi.advanceTimersByTime(10 * 60_000);
  expect(
    await t.mutation(internal.enquiryDelivery.allow, { key: payloadHash }),
  ).toBe(true);
});
test("cleanup removes expired metadata and inactive key tracking in bounded batches", async () => {
  const t = setup();
  await t.mutation(internal.enquiryDelivery.claim, { id, payloadHash, token });
  await t.mutation(internal.enquiryDelivery.allow, { key: payloadHash });
  vi.advanceTimersByTime(31 * 24 * 60 * 60_000);
  await t.mutation(internal.enquiryDelivery.cleanup, {});
  expect(
    await t.run((ctx) => ctx.db.query("enquiryDeliveries").take(1)),
  ).toEqual([]);
  expect(await t.run((ctx) => ctx.db.query("enquiryRateKeys").take(1))).toEqual(
    [],
  );
});

async function signed(body: string, timestamp = String(Date.now())) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${body}`),
  );
  const signature = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return {
    "Content-Type": "application/json",
    Authorization: `HMAC ${signature}`,
    "x-buildmyx-timestamp": timestamp,
  };
}
test("unsigned, tampered and expired HTTP requests cannot access delivery records", async () => {
  const t = setup();
  const body = JSON.stringify({ operation: "health" });
  expect(
    (await t.fetch("/enquiry-delivery", { method: "POST", body })).status,
  ).toBe(401);
  expect(
    (
      await t.fetch("/enquiry-delivery", {
        method: "POST",
        body,
        headers: await signed(body, String(Date.now() - 300_001)),
      })
    ).status,
  ).toBe(401);
  expect(
    (
      await t.fetch("/enquiry-delivery", {
        method: "POST",
        body: JSON.stringify({ operation: "allow", key: payloadHash }),
        headers: await signed(body),
      })
    ).status,
  ).toBe(401);
  expect(
    await t.run((ctx) => ctx.db.query("enquiryDeliveries").take(1)),
  ).toEqual([]);
});
test("signed service requests validate arguments without exposing service credentials", async () => {
  const t = setup();
  const health = JSON.stringify({ operation: "health" });
  const response = await t.fetch("/enquiry-delivery", {
    method: "POST",
    body: health,
    headers: await signed(health),
  });
  expect(await response.json()).toEqual({ ok: true });
  const body = JSON.stringify({ operation: "claim", id, token, payloadHash });
  const claim = await t.fetch("/enquiry-delivery", {
    method: "POST",
    body,
    headers: await signed(body),
  });
  expect(await claim.json()).toEqual({ tag: "acquired", ownerAccepted: false });
  const invalid = JSON.stringify({
    operation: "claim",
    id: "invalid",
    token,
    payloadHash,
  });
  expect(
    (
      await t.fetch("/enquiry-delivery", {
        method: "POST",
        body: invalid,
        headers: await signed(invalid),
      })
    ).status,
  ).toBe(400);
});

test("an absent or weak service key disables the HTTP service", async () => {
  vi.stubEnv("ENQUIRY_SERVICE_SECRET", "short");
  const t = setup();
  const body = JSON.stringify({ operation: "health" });
  expect(
    (
      await t.fetch("/enquiry-delivery", {
        method: "POST",
        body,
        headers: await signed(body),
      })
    ).status,
  ).toBe(503);
});
