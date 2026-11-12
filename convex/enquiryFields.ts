import { v } from "convex/values";
export const enquiryFields = {
  name: v.string(),
  email: v.string(),
  interest: v.union(
    v.literal("ai"),
    v.literal("learning"),
    v.literal("hiring"),
    v.literal("developer"),
  ),
  description: v.string(),
  company: v.string(),
  links: v.string(),
};
export const notificationStatus = v.union(
  v.literal("unconfigured"),
  v.literal("queueError"),
  v.literal("queued"),
  v.literal("sent"),
  v.literal("delivered"),
  v.literal("failed"),
);

export const enquiryRecord = {
  ...enquiryFields,
  reference: v.string(),
  payloadHash: v.string(),
  notificationStatus,
  notificationEmailId: v.optional(v.string()),
  notificationAttempts: v.number(),
  notificationCheckAt: v.number(),
  notificationLastError: v.optional(v.string()),
  expiresAt: v.number(),
};
