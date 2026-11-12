import { httpRouter } from "convex/server";
import { httpAction, env } from "./_generated/server";
import { internal } from "./_generated/api";

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
export default http;
