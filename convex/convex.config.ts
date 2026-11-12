import { defineApp } from "convex/server";
import { v } from "convex/values";
import rateLimiter from "@convex-dev/rate-limiter/convex.config.js";

const app = defineApp({
  env: { ENQUIRY_SERVICE_SECRET: v.optional(v.string()) },
});
app.use(rateLimiter);
export default app;
