import { defineApp } from "convex/server";
import { v } from "convex/values";
import rateLimiter from "@convex-dev/rate-limiter/convex.config.js";
import resend from "@convex-dev/resend/convex.config.js";

const app = defineApp({
  env: {
    ENQUIRY_SERVICE_SECRET: v.optional(v.string()),
    ENQUIRY_ALLOWED_ORIGIN: v.optional(v.string()),
    RESEND_API_KEY: v.optional(v.string()),
    RESEND_WEBHOOK_SECRET: v.optional(v.string()),
    ENQUIRY_FROM: v.optional(v.string()),
    ENQUIRY_TO: v.optional(v.string()),
    ENQUIRY_EMAIL_TEST_MODE: v.optional(v.string()),
  },
});
app.use(rateLimiter);
app.use(resend);
export default app;
