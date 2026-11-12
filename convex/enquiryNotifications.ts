import { Resend, vOnEmailEventArgs, type EmailId } from "@convex-dev/resend";
import { MINUTE } from "@convex-dev/rate-limiter";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import { env, internalMutation } from "./_generated/server";
import { prepareEnquiry } from "../lib/enquiry-fields";

export function emailClient(): Resend {
  return new Resend(components.resend, {
    apiKey: env.RESEND_API_KEY ?? "",
    webhookSecret: env.RESEND_WEBHOOK_SECRET ?? "",
    // Real recipients require an explicit false setting on the chosen deployment.
    testMode: env.ENQUIRY_EMAIL_TEST_MODE !== "false",
    onEmailEvent: internal.enquiryNotifications.onEmailEvent,
  });
}
export const enqueue = internalMutation({
  args: { enquiryId: v.id("enquiries") },
  returns: v.null(),
  handler: async (ctx, { enquiryId }) => {
    const record = await ctx.db.get("enquiries", enquiryId);
    if (!record || record.notificationEmailId || record.expiresAt <= Date.now())
      return null;
    if (
      !env.RESEND_API_KEY?.trim() ||
      !env.ENQUIRY_FROM?.trim() ||
      !env.ENQUIRY_TO?.trim()
    ) {
      await ctx.db.patch("enquiries", enquiryId, {
        notificationStatus: "unconfigured",
        notificationCheckAt: Date.now() + 5 * MINUTE,
        notificationLastError: undefined,
      });
      return null;
    }
    const emailId = await emailClient().sendEmail(ctx, {
      from: env.ENQUIRY_FROM,
      to: env.ENQUIRY_TO,
      subject: "New BuildMyX enquiry",
      text: `${prepareEnquiry(record)}\n\nReference: ${record.reference}\nSaved in your Convex enquiries table.`,
      replyTo: [record.email],
      idempotencyKey: `enquiry-notification:${record._id}`,
    });
    await ctx.db.patch("enquiries", enquiryId, {
      notificationStatus: "queued",
      notificationEmailId: emailId,
      notificationAttempts: record.notificationAttempts + 1,
      notificationCheckAt: Date.now() + 5 * MINUTE,
      notificationLastError: undefined,
    });
    return null;
  },
});

export const onEmailEvent = internalMutation({
  args: vOnEmailEventArgs,
  returns: v.null(),
  handler: async (ctx, { id, event }) => {
    const record = await ctx.db
      .query("enquiries")
      .withIndex("by_notificationEmailId", (q) =>
        q.eq("notificationEmailId", id),
      )
      .unique();
    if (!record) return null;
    if (
      event.type === "email.bounced" ||
      event.type === "email.complained" ||
      event.type === "email.failed"
    ) {
      await ctx.db.patch("enquiries", record._id, {
        notificationStatus: "failed",
        notificationLastError:
          "Owner email failed, bounced or was marked as spam.",
      });
    } else if (
      event.type === "email.delivered" &&
      record.notificationStatus !== "failed"
    ) {
      await ctx.db.patch("enquiries", record._id, {
        notificationStatus: "delivered",
        notificationLastError: undefined,
      });
    } else if (
      event.type === "email.sent" &&
      record.notificationStatus === "queued"
    ) {
      await ctx.db.patch("enquiries", record._id, {
        notificationStatus: "sent",
        notificationLastError: undefined,
      });
    }
    return null;
  },
});

export const reconcile = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now();
    for (const status of ["unconfigured", "queueError", "queued"] as const) {
      const records = await ctx.db
        .query("enquiries")
        .withIndex("by_notificationStatus_and_notificationCheckAt", (q) =>
          q.eq("notificationStatus", status).lte("notificationCheckAt", now),
        )
        .take(25);
      for (const record of records) {
        if (record.expiresAt <= now) continue;
        if (status === "queued" && record.notificationEmailId) {
          const result = await emailClient().status(
            ctx,
            record.notificationEmailId as EmailId,
          );
          const failed =
            !result ||
            result.failed ||
            result.bounced ||
            result.complained ||
            result.status === "failed" ||
            result.status === "bounced" ||
            result.status === "cancelled";
          const notificationStatus = failed
            ? "failed"
            : result.status === "delivered"
              ? "delivered"
              : result.status === "sent"
                ? "sent"
                : "queued";
          await ctx.db.patch("enquiries", record._id, {
            notificationStatus,
            notificationCheckAt: now + 5 * MINUTE,
            notificationLastError: failed
              ? "Owner email was not delivered. Review the email service status."
              : undefined,
          });
        } else if (record.notificationAttempts >= 5) {
          await ctx.db.patch("enquiries", record._id, {
            notificationStatus: "failed",
            notificationLastError:
              "Notification could not be queued after five attempts. The enquiry is saved.",
          });
        } else {
          try {
            await ctx.runMutation(internal.enquiryNotifications.enqueue, {
              enquiryId: record._id,
            });
          } catch {
            await ctx.db.patch("enquiries", record._id, {
              notificationStatus: "queueError",
              notificationAttempts: record.notificationAttempts + 1,
              notificationCheckAt: now + 5 * MINUTE,
              notificationLastError:
                "Notification could not be queued. Scheduled retry pending.",
            });
          }
        }
      }
    }
    return null;
  },
});

export const cancel = internalMutation({
  args: { enquiryId: v.id("enquiries") },
  returns: v.null(),
  handler: async (ctx, { enquiryId }) => {
    const record = await ctx.db.get("enquiries", enquiryId);
    if (record?.notificationEmailId && record.notificationStatus === "queued") {
      const emailId = record.notificationEmailId as EmailId;
      const status = await emailClient().status(ctx, emailId);
      if (status?.status === "waiting" || status?.status === "queued")
        await emailClient().cancelEmail(ctx, emailId);
    }
    return null;
  },
});

export const cleanupEmailCopies = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await ctx.runMutation(components.resend.lib.cleanupOldEmails, {
      olderThan: 7 * 24 * 60 * 60 * 1000,
    });
    await ctx.runMutation(components.resend.lib.cleanupAbandonedEmails, {
      olderThan: 30 * 24 * 60 * 60 * 1000,
    });
    return null;
  },
});
