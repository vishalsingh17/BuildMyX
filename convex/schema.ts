import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { enquiryRecord } from "./enquiryFields";

export default defineSchema({
  enquiries: defineTable(enquiryRecord)
    .index("by_reference", ["reference"])
    .index("by_notificationEmailId", ["notificationEmailId"])
    .index("by_notificationStatus_and_notificationCheckAt", [
      "notificationStatus",
      "notificationCheckAt",
    ])
    .index("by_expiresAt", ["expiresAt"]),
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
