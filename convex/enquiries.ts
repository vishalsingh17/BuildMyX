import { v } from "convex/values";
import { RateLimiter, MINUTE, DAY } from "@convex-dev/rate-limiter";
import { internalMutation, internalQuery } from "./_generated/server";
import { components, internal } from "./_generated/api";
import { enquiryFields, enquiryRecord } from "./enquiryFields";
import { normalizeEnquiry, validateEnquiry } from "../lib/enquiry-fields";
import type { Interest } from "../lib/interests";

const limits = new RateLimiter(components.rateLimiter, {
  enquiryEmail: {
    kind: "fixed window",
    rate: 5,
    period: 10 * MINUTE,
    start: 0,
  },
  enquiryTotal: { kind: "fixed window", rate: 200, period: DAY, start: 0 },
});
async function fingerprint(value: string) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(bytes), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

// Only the HTTP action can write submissions. No public query exposes contact details.
export const save = internalMutation({
  args: { ...enquiryFields, reference: v.string() },
  returns: v.union(
    v.object({ saved: v.literal(true), reference: v.string() }),
    v.object({
      error: v.union(
        v.literal("invalid"),
        v.literal("conflict"),
        v.literal("rateLimited"),
      ),
    }),
  ),
  handler: async (ctx, { reference, ...fields }) => {
    const values = normalizeEnquiry(fields);
    if (
      !/^[a-z0-9-]{16,80}$/i.test(reference) ||
      Object.keys(validateEnquiry(values)).length
    )
      return { error: "invalid" } as const;
    const payloadHash = await fingerprint(JSON.stringify(values));
    const existing = await ctx.db
      .query("enquiries")
      .withIndex("by_reference", (q) => q.eq("reference", reference))
      .unique();
    if (existing)
      return existing.payloadHash === payloadHash
        ? ({ saved: true, reference } as const)
        : ({ error: "conflict" } as const);

    const key = await fingerprint(values.email.toLowerCase());
    // Bound per-address rate-limit records by applying the global limit first.
    if (
      !(await limits.limit(ctx, "enquiryTotal")).ok ||
      !(await limits.limit(ctx, "enquiryEmail", { key })).ok
    )
      return { error: "rateLimited" } as const;
    const now = Date.now();
    const enquiryId = await ctx.db.insert("enquiries", {
      ...values,
      interest: values.interest as Interest,
      reference,
      payloadHash,
      notificationStatus: "unconfigured",
      notificationAttempts: 0,
      notificationCheckAt: now,
      expiresAt: now + 30 * DAY,
    });
    try {
      // The child mutation rolls back independently if enqueue fails; the enquiry stays saved.
      await ctx.runMutation(internal.enquiryNotifications.enqueue, {
        enquiryId,
      });
    } catch {
      await ctx.db.patch("enquiries", enquiryId, {
        notificationStatus: "queueError",
        notificationAttempts: 1,
        notificationCheckAt: now + 5 * MINUTE,
        notificationLastError:
          "Notification could not be queued. Scheduled retry pending.",
      });
    }
    return { saved: true, reference } as const;
  },
});

export const byReference = internalQuery({
  args: { reference: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      ...enquiryRecord,
      _id: v.id("enquiries"),
      _creationTime: v.number(),
    }),
  ),
  handler: async (ctx, { reference }) =>
    ctx.db
      .query("enquiries")
      .withIndex("by_reference", (q) => q.eq("reference", reference))
      .unique(),
});

// Administrator-only deletion, including cancellation of an unsent notification.
export const remove = internalMutation({
  args: { enquiryId: v.id("enquiries") },
  returns: v.null(),
  handler: async (ctx, { enquiryId }) => {
    await ctx.runMutation(internal.enquiryNotifications.cancel, { enquiryId });
    await ctx.db.delete("enquiries", enquiryId);
    return null;
  },
});

export const cleanup = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const expired = await ctx.db
      .query("enquiries")
      .withIndex("by_expiresAt", (q) => q.lte("expiresAt", Date.now()))
      .take(100);
    for (const record of expired)
      await ctx.runMutation(internal.enquiries.remove, {
        enquiryId: record._id,
      });
    if (expired.length === 100)
      await ctx.scheduler.runAfter(0, internal.enquiries.cleanup, {});
    return null;
  },
});
