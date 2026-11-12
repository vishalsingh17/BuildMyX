import { httpRouter } from "convex/server";
import { httpAction, env } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  enquiryHeaders,
  enquiryJson,
  readEnquiry,
} from "../lib/enquiry-request";
import { emailClient } from "./enquiryNotifications";

const http = httpRouter();
const json = (data: object, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
const validId = (value: unknown): value is string =>
  typeof value === "string" && /^[a-z0-9-]{16,80}$/i.test(value);
const validHash = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{64}$/.test(value);

http.route({
  path: "/enquiry-delivery",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = env.ENQUIRY_SERVICE_SECRET;
    if (!secret || secret.length < 32)
      return json({ error: "Service unavailable" }, 503);
    const timestamp = request.headers.get("x-buildmyx-timestamp") ?? "";
    const signature =
      request.headers.get("authorization")?.replace(/^HMAC /, "") ?? "";
    if (
      !/^\d{13}$/.test(timestamp) ||
      Math.abs(Date.now() - Number(timestamp)) > 300_000 ||
      !validHash(signature)
    )
      return json({ error: "Unauthorized" }, 401);
    const reader = request.body?.getReader();
    if (!reader) return json({ error: "Invalid request" }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) {
        await reader.cancel();
        return json({ error: "Request too large" }, 413);
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const body = new TextDecoder().decode(bytes);
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const signatureBytes = new Uint8Array(
      signature.match(/../g)!.map((pair) => parseInt(pair, 16)),
    );
    const authorized = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      new TextEncoder().encode(`${timestamp}.${body}`),
    );
    if (!authorized) return json({ error: "Unauthorized" }, 401);
    let value: unknown;
    try {
      value = JSON.parse(body);
    } catch {
      return json({ error: "Invalid request" }, 400);
    }
    if (!value || typeof value !== "object" || Array.isArray(value))
      return json({ error: "Invalid request" }, 400);
    const data = value as Record<string, unknown>;
    if (data.operation === "health") return json({ ok: true });
    if (data.operation === "allow" && validHash(data.key))
      return json({
        ok: await ctx.runMutation(internal.enquiryDelivery.allow, {
          key: data.key,
        }),
      });
    if (!validId(data.id) || !validId(data.token))
      return json({ error: "Invalid request" }, 400);
    const identity = { id: data.id, token: data.token };
    if (data.operation === "claim" && validHash(data.payloadHash))
      return json(
        await ctx.runMutation(internal.enquiryDelivery.claim, {
          ...identity,
          payloadHash: data.payloadHash,
        }),
      );
    if (
      data.operation === "acceptOwner" &&
      typeof data.providerId === "string" &&
      data.providerId.length > 0 &&
      data.providerId.length <= 256
    )
      return json({
        ok: await ctx.runMutation(internal.enquiryDelivery.acceptOwner, {
          ...identity,
          providerId: data.providerId,
        }),
      });
    if (
      data.operation === "complete" &&
      typeof data.confirmationSent === "boolean"
    )
      return json({
        ok: await ctx.runMutation(internal.enquiryDelivery.complete, {
          ...identity,
          confirmationSent: data.confirmationSent,
        }),
      });
    if (data.operation === "uncertain")
      return json({
        ok: await ctx.runMutation(internal.enquiryDelivery.uncertain, identity),
      });
    return json({ error: "Invalid request" }, 400);
  }),
});
http.route({
  path: "/enquiries/health",
  method: "GET",
  handler: httpAction(async () => enquiryJson({ enabled: true })),
});
http.route({
  path: "/enquiries",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const origin =
      env.ENQUIRY_ALLOWED_ORIGIN ?? "https://build-my-x.vercel.app";
    const headerError = enquiryHeaders(request, origin);
    if (headerError) return headerError;
    const reference =
      request.headers.get("Idempotency-Key") ?? crypto.randomUUID();
    if (!validId(reference))
      return enquiryJson({ error: "Invalid submission reference." }, 400);
    const body = await readEnquiry(request);
    if ("error" in body) return body.error;
    try {
      const result = await ctx.runMutation(internal.enquiries.save, {
        ...body.values,
        interest: body.values.interest as
          "ai" | "learning" | "hiring" | "developer",
        reference,
      });
      if ("error" in result) {
        const status =
          result.error === "rateLimited"
            ? 429
            : result.error === "conflict"
              ? 409
              : 422;
        const message =
          result.error === "rateLimited"
            ? "Too many enquiries. Please try again later."
            : result.error === "conflict"
              ? "This reference belongs to another enquiry. Edit your details before trying again."
              : "Please check your enquiry fields.";
        return enquiryJson({ error: message }, status);
      }
      return enquiryJson(result);
    } catch {
      return enquiryJson(
        {
          error:
            "Your enquiry could not be confirmed as saved. Please retry with the same reference.",
        },
        503,
      );
    }
  }),
});
http.route({
  path: "/resend-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!env.RESEND_WEBHOOK_SECRET)
      return enquiryJson({ error: "Webhook not configured." }, 503);
    return emailClient().handleResendEventWebhook(ctx, request);
  }),
});
export default http;
