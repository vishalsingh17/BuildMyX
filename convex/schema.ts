import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  enquiryDeliveries: defineTable({
    submissionId: v.string(),
    payloadHash: v.string(),
    phase: v.union(
      v.literal("ownerPending"),
      v.literal("ownerUnconfirmed"),
      v.literal("ownerAccepted"),
      v.literal("submitted"),
    ),
    leaseToken: v.string(),
    leaseUntil: v.number(),
    ownerProviderId: v.optional(v.string()),
    confirmationSent: v.optional(v.boolean()),
    expiresAt: v.number(),
  })
    .index("by_submissionId", ["submissionId"])
    .index("by_expiresAt", ["expiresAt"]),
  enquiryRateKeys: defineTable({ key: v.string(), expiresAt: v.number() })
    .index("by_key", ["key"])
    .index("by_expiresAt", ["expiresAt"]),
});
