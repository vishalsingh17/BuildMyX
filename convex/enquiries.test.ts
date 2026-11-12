/// <reference types="vite/client" />
import { beforeEach, afterEach, expect, test, vi } from "vitest";
import { convexTest } from "convex-test";
import rateLimiterTest from "@convex-dev/rate-limiter/test";
import resendTest from "@convex-dev/resend/test";
import { Resend, type EmailId } from "@convex-dev/resend";
import schema from "./schema";
import { internal, components } from "./_generated/api";

const modules = import.meta.glob("./**/*.ts");
const reference = "11111111-1111-4111-8111-111111111111";
const fields = {
  name: "Example Visitor",
  email: "visitor@example.com",
  interest: "learning" as const,
  description:
    "I would like to learn data engineering with practical projects.",
  company: "Example",
  links: "https://example.com/portfolio",
};
const origin = "https://build-my-x.vercel.app";
function setup() {
  const t = convexTest(schema, modules);
  rateLimiterTest.register(t);
  resendTest.register(t);
  return t;
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-12T12:01:00Z"));
  for (const name of [
    "RESEND_API_KEY",
    "ENQUIRY_FROM",
    "ENQUIRY_TO",
    "RESEND_WEBHOOK_SECRET",
  ])
    vi.stubEnv(name, "");
  vi.stubEnv("ENQUIRY_ALLOWED_ORIGIN", origin);
  vi.stubEnv("ENQUIRY_EMAIL_TEST_MODE", "true");
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

test("saves complete enquiry without email configuration and retries are idempotent", async () => {
  const t = setup();
  const save = () =>
    t.mutation(internal.enquiries.save, { ...fields, reference });
  expect(await save()).toEqual({ saved: true, reference });
  expect(await save()).toEqual({ saved: true, reference });
  const record = await t.query(internal.enquiries.byReference, { reference });
  expect(record).toMatchObject({
    ...fields,
    reference,
    notificationStatus: "unconfigured",
    notificationAttempts: 0,
  });
  const count = await t.run(
    async (ctx) => (await ctx.db.query("enquiries").take(10)).length,
  );
  expect(count).toBe(1);
  expect(record!.expiresAt - record!._creationTime).toBe(
    30 * 24 * 60 * 60 * 1000,
  );
  expect(
    await t.mutation(internal.enquiries.save, {
      ...fields,
      reference,
      description: fields.description + " Extra.",
    }),
  ).toEqual({ error: "conflict" });
});
test("validation and shared rate limits also protect the internal storage boundary", async () => {
  const t = setup();
  expect(
    await t.mutation(internal.enquiries.save, {
      ...fields,
      reference,
      email: "invalid",
    }),
  ).toEqual({ error: "invalid" });
  for (let i = 0; i < 5; i++)
    expect(
      await t.mutation(internal.enquiries.save, {
        ...fields,
        reference: `test-reference-000${i}`,
      }),
    ).toMatchObject({ saved: true });
  expect(
    await t.mutation(internal.enquiries.save, {
      ...fields,
      email: "VISITOR@example.com",
      reference,
    }),
  ).toEqual({ error: "rateLimited" });
  // A retry of an already saved submission must still succeed after the rate limit.
  expect(
    await t.mutation(internal.enquiries.save, {
      ...fields,
      reference: "test-reference-0000",
    }),
  ).toMatchObject({ saved: true });
});
test("enqueue failure preserves the enquiry and records a retryable notification status", async () => {
  const t = setup();
  vi.stubEnv("RESEND_API_KEY", "test-only-key");
  vi.stubEnv("ENQUIRY_FROM", "site@example.com");
  vi.stubEnv("ENQUIRY_TO", "delivered@resend.dev");
  vi.spyOn(Resend.prototype, "sendEmail").mockRejectedValue(
    new Error("enqueue unavailable"),
  );
  expect(
    await t.mutation(internal.enquiries.save, { ...fields, reference }),
  ).toEqual({ saved: true, reference });
  expect(
    await t.query(internal.enquiries.byReference, { reference }),
  ).toMatchObject({
    ...fields,
    notificationStatus: "queueError",
    notificationAttempts: 1,
  });
});
test("configuring email later queues the saved enquiry once with reply-to and the selected recipient", async () => {
  const t = setup();
  await t.mutation(internal.enquiries.save, { ...fields, reference });
  vi.stubEnv("RESEND_API_KEY", "test-only-key");
  vi.stubEnv("ENQUIRY_FROM", "BuildMyX <site@example.com>");
  vi.stubEnv("ENQUIRY_TO", "delivered@resend.dev");
  vi.advanceTimersByTime(5 * 60 * 1000);
  await t.mutation(internal.enquiryNotifications.reconcile, {});
  const record = await t.query(internal.enquiries.byReference, { reference });
  expect(record).toMatchObject({
    notificationStatus: "queued",
    notificationAttempts: 1,
  });
  expect(record!.notificationEmailId).toBeTruthy();
  await t.mutation(internal.enquiryNotifications.enqueue, {
    enquiryId: record!._id,
  });
  const again = await t.query(internal.enquiries.byReference, { reference });
  expect(again!.notificationEmailId).toBe(record!.notificationEmailId);
  expect(again!.notificationAttempts).toBe(1);
  const email = await t.run((ctx) =>
    new Resend(components.resend).get(
      ctx,
      record!.notificationEmailId as EmailId,
    ),
  );
  expect(email).toMatchObject({
    to: ["delivered@resend.dev"],
    replyTo: [fields.email],
  });
  // No scheduled provider calls are executed; these tests never send email.
});
test("webhook callbacks cannot downgrade delivered status with a late sent event", async () => {
  const t = setup();
  await t.mutation(internal.enquiries.save, { ...fields, reference });
  const record = await t.query(internal.enquiries.byReference, { reference });
  await t.run((ctx) =>
    ctx.db.patch("enquiries", record!._id, {
      notificationStatus: "queued",
      notificationEmailId: "component-email-id",
    }),
  );
  const data = {
    email_id: "provider-email-id",
    from: "site@example.com",
    to: ["delivered@resend.dev"],
    subject: "New BuildMyX enquiry",
    created_at: "2026-11-12T12:01:00Z",
  };
  for (const type of ["email.delivered", "email.sent"] as const)
    await t.mutation(internal.enquiryNotifications.onEmailEvent, {
      id: "component-email-id" as EmailId,
      event: { type, created_at: data.created_at, data },
    });
  expect(
    (await t.query(internal.enquiries.byReference, { reference }))!
      .notificationStatus,
  ).toBe("delivered");
});
test("expired enquiries are deleted by scheduled cleanup", async () => {
  const t = setup();
  await t.mutation(internal.enquiries.save, { ...fields, reference });
  vi.advanceTimersByTime(30 * 24 * 60 * 60 * 1000 + 1);
  await t.mutation(internal.enquiries.cleanup, {});
  expect(
    await t.query(internal.enquiries.byReference, { reference }),
  ).toBeNull();
});
test("notification enqueue failures stop retrying after five attempts while preserving the enquiry", async () => {
  const t = setup();
  vi.stubEnv("RESEND_API_KEY", "test-only-key");
  vi.stubEnv("ENQUIRY_FROM", "site@example.com");
  vi.stubEnv("ENQUIRY_TO", "delivered@resend.dev");
  const send = vi
    .spyOn(Resend.prototype, "sendEmail")
    .mockRejectedValue(new Error("unavailable"));
  await t.mutation(internal.enquiries.save, { ...fields, reference });
  for (let i = 0; i < 6; i++) {
    vi.advanceTimersByTime(5 * 60 * 1000);
    await t.mutation(internal.enquiryNotifications.reconcile, {});
  }
  expect(send).toHaveBeenCalledTimes(5);
  expect(
    await t.query(internal.enquiries.byReference, { reference }),
  ).toMatchObject({
    ...fields,
    notificationStatus: "failed",
    notificationAttempts: 5,
  });
});
test("deleting an enquiry cancels a queued email and tolerates stale send status", async () => {
  const t = setup();
  vi.stubEnv("RESEND_API_KEY", "test-only-key");
  vi.stubEnv("ENQUIRY_FROM", "site@example.com");
  vi.stubEnv("ENQUIRY_TO", "delivered@resend.dev");
  await t.mutation(internal.enquiries.save, { ...fields, reference });
  const record = await t.query(internal.enquiries.byReference, { reference });
  await t.mutation(internal.enquiries.remove, { enquiryId: record!._id });
  const status = await t.run((ctx) =>
    new Resend(components.resend).status(
      ctx,
      record!.notificationEmailId as EmailId,
    ),
  );
  expect(status!.status).toBe("cancelled");
  await t.mutation(internal.enquiries.save, {
    ...fields,
    reference: "another-test-reference",
  });
  const another = await t.query(internal.enquiries.byReference, {
    reference: "another-test-reference",
  });
  vi.spyOn(Resend.prototype, "status").mockResolvedValue({
    ...status!,
    status: "sent",
  });
  await expect(
    t.mutation(internal.enquiries.remove, { enquiryId: another!._id }),
  ).resolves.toBeNull();
});
test("public HTTP intake validates requests and returns only a saved reference", async () => {
  const t = setup();
  const headers = {
    Origin: origin,
    "Content-Type": "application/json",
    "Idempotency-Key": reference,
  };
  expect((await t.fetch("/enquiries/health")).status).toBe(200);
  expect(
    (
      await t.fetch("/enquiries", {
        method: "POST",
        headers,
        body: JSON.stringify(fields),
      })
    ).status,
  ).toBe(200);
  const retry = await t.fetch("/enquiries", {
    method: "POST",
    headers,
    body: JSON.stringify(fields),
  });
  expect(await retry.json()).toEqual({ saved: true, reference });
  expect(
    (
      await t.fetch("/enquiries", {
        method: "POST",
        headers: { ...headers, Origin: "https://other.example" },
        body: JSON.stringify(fields),
      })
    ).status,
  ).toBe(403);
  expect(
    (
      await t.fetch("/enquiries", {
        method: "POST",
        headers,
        body: JSON.stringify({ ...fields, description: "too short" }),
      })
    ).status,
  ).toBe(422);
  expect((await t.fetch("/enquiries", { method: "GET" })).status).toBe(404);
  expect(
    (await t.fetch("/resend-webhook", { method: "POST", body: "{}" })).status,
  ).toBe(503);
});
