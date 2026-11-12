import { v } from "convex/values";
import { RateLimiter, MINUTE } from "@convex-dev/rate-limiter";
import { internalMutation, type MutationCtx } from "./_generated/server";
import { components, internal } from "./_generated/api";

const limits = new RateLimiter(components.rateLimiter, {
  enquiries: { kind: "fixed window", rate: 5, period: 10 * MINUTE, start: 0 },
  newEnquiryKeys: {
    kind: "fixed window",
    rate: 1000,
    period: 10 * MINUTE,
    start: 0,
  },
});
const claimResult = v.union(
  v.object({ tag: v.literal("acquired"), ownerAccepted: v.boolean() }),
  v.object({ tag: v.literal("complete"), confirmationSent: v.boolean() }),
  v.object({
    tag: v.union(
      v.literal("pending"),
      v.literal("conflict"),
      v.literal("expired"),
    ),
  }),
);
const identity = { id: v.string(), token: v.string() };
const leaseMs = 60_000;
const retryWindowMs = 23 * 60 * MINUTE;
const retentionMs = 30 * 24 * 60 * MINUTE;

async function recordFor(ctx: MutationCtx, id: string) {
  return ctx.db
    .query("enquiryDeliveries")
    .withIndex("by_submissionId", (q) => q.eq("submissionId", id))
    .unique();
}

export const allow = internalMutation({
  args: { key: v.string() },
  returns: v.boolean(),
  handler: async (ctx, { key }) => {
    const record = await ctx.db
      .query("enquiryRateKeys")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    const expiresAt = Date.now() + 10 * MINUTE;
    if (record)
      await ctx.db.patch("enquiryRateKeys", record._id, { expiresAt });
    else {
      if (!(await limits.limit(ctx, "newEnquiryKeys")).ok) return false;
      await ctx.db.insert("enquiryRateKeys", { key, expiresAt });
    }
    return (await limits.limit(ctx, "enquiries", { key })).ok;
  },
});

export const claim = internalMutation({
  args: { ...identity, payloadHash: v.string() },
  returns: claimResult,
  handler: async (ctx, { id, payloadHash, token }) => {
    const now = Date.now();
    const record = await recordFor(ctx, id);
    if (record) {
      if (record.payloadHash !== payloadHash)
        return { tag: "conflict" } as const;
      if (record.phase === "submitted")
        return {
          tag: "complete",
          confirmationSent: record.confirmationSent === true,
        } as const;
      if (record.leaseUntil > now) return { tag: "pending" } as const;
      if (now - record._creationTime >= retryWindowMs) {
        // Never resend an uncertain owner message after provider deduplication may expire.
        if (record.phase !== "ownerAccepted")
          return { tag: "expired" } as const;
        await ctx.db.patch("enquiryDeliveries", record._id, {
          phase: "submitted",
          confirmationSent: false,
          leaseUntil: 0,
          leaseToken: "",
        });
        return { tag: "complete", confirmationSent: false } as const;
      }
      const ownerAccepted = record.phase === "ownerAccepted";
      await ctx.db.patch("enquiryDeliveries", record._id, {
        leaseToken: token,
        leaseUntil: now + leaseMs,
        phase: ownerAccepted ? "ownerAccepted" : "ownerPending",
      });
      return { tag: "acquired", ownerAccepted } as const;
    }
    await ctx.db.insert("enquiryDeliveries", {
      submissionId: id,
      payloadHash,
      phase: "ownerPending",
      leaseToken: token,
      leaseUntil: now + leaseMs,
      expiresAt: now + retentionMs,
    });
    return { tag: "acquired", ownerAccepted: false } as const;
  },
});

export const acceptOwner = internalMutation({
  args: { ...identity, providerId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, { id, token, providerId }) => {
    const record = await recordFor(ctx, id);
    if (
      !record ||
      record.leaseToken !== token ||
      record.phase !== "ownerPending"
    )
      return false;
    await ctx.db.patch("enquiryDeliveries", record._id, {
      phase: "ownerAccepted",
      ownerProviderId: providerId,
      leaseUntil: Date.now() + leaseMs,
    });
    return true;
  },
});

export const complete = internalMutation({
  args: { ...identity, confirmationSent: v.boolean() },
  returns: v.boolean(),
  handler: async (ctx, { id, token, confirmationSent }) => {
    const record = await recordFor(ctx, id);
    if (
      !record ||
      record.leaseToken !== token ||
      record.phase !== "ownerAccepted"
    )
      return false;
    await ctx.db.patch("enquiryDeliveries", record._id, {
      phase: "submitted",
      confirmationSent,
      leaseUntil: 0,
      leaseToken: "",
    });
    return true;
  },
});

export const uncertain = internalMutation({
  args: identity,
  returns: v.boolean(),
  handler: async (ctx, { id, token }) => {
    const record = await recordFor(ctx, id);
    if (
      !record ||
      record.leaseToken !== token ||
      record.phase !== "ownerPending"
    )
      return false;
    await ctx.db.patch("enquiryDeliveries", record._id, {
      phase: "ownerUnconfirmed",
      leaseUntil: 0,
      leaseToken: "",
    });
    return true;
  },
});

export const cleanup = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now();
    const deliveries = await ctx.db
      .query("enquiryDeliveries")
      .withIndex("by_expiresAt", (q) => q.lte("expiresAt", now))
      .take(100);
    for (const record of deliveries)
      await ctx.db.delete("enquiryDeliveries", record._id);
    const keys = await ctx.db
      .query("enquiryRateKeys")
      .withIndex("by_expiresAt", (q) => q.lte("expiresAt", now))
      .take(100);
    for (const record of keys) {
      await limits.reset(ctx, "enquiries", { key: record.key });
      await ctx.db.delete("enquiryRateKeys", record._id);
    }
    if (deliveries.length === 100 || keys.length === 100)
      await ctx.scheduler.runAfter(0, internal.enquiryDelivery.cleanup, {});
    return null;
  },
});
