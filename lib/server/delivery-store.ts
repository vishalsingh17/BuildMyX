import { createHmac } from "node:crypto";
import type { DeliveryClaim, DeliveryStore } from "../delivery-protocol";

export function deliveryStoreConfig() {
  const siteUrl = process.env.ENQUIRY_CONVEX_SITE_URL?.trim();
  const secret = process.env.ENQUIRY_SERVICE_SECRET?.trim();
  if (!siteUrl || !secret || secret.length < 32) return null;
  try {
    const url = new URL(siteUrl);
    if (
      url.protocol !== "https:" ||
      !url.hostname.endsWith(".convex.site") ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      return null;
    return { url: `${url.origin}/enquiry-delivery`, secret };
  } catch {
    return null;
  }
}

export function deliveryHash(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function convexDeliveryStore(): DeliveryStore | null {
  const config = deliveryStoreConfig();
  if (!config) return null;
  const call = async (data: object): Promise<Record<string, unknown>> => {
    const timestamp = String(Date.now());
    const body = JSON.stringify(data);
    const signature = deliveryHash(`${timestamp}.${body}`, config.secret);
    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `HMAC ${signature}`,
        "x-buildmyx-timestamp": timestamp,
      },
      body,
      redirect: "error",
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Delivery records unavailable");
    const result: unknown = await response.json();
    if (!result || typeof result !== "object" || Array.isArray(result))
      throw new Error("Invalid delivery record response");
    return result as Record<string, unknown>;
  };
  const ok = async (data: object) => {
    const result = await call(data);
    if (typeof result.ok !== "boolean")
      throw new Error("Invalid delivery record acknowledgment");
    return result.ok;
  };
  return {
    ready: () => ok({ operation: "health" }),
    allow: (key) => ok({ operation: "allow", key }),
    claim: async (id, payloadHash, token): Promise<DeliveryClaim> => {
      const result = await call({ operation: "claim", id, payloadHash, token });
      if (
        result.tag === "acquired" &&
        typeof result.ownerAccepted === "boolean"
      )
        return { tag: "acquired", ownerAccepted: result.ownerAccepted };
      if (
        result.tag === "complete" &&
        typeof result.confirmationSent === "boolean"
      )
        return { tag: "complete", confirmationSent: result.confirmationSent };
      if (result.tag === "pending") return { tag: "pending" };
      if (result.tag === "conflict") return { tag: "conflict" };
      if (result.tag === "expired") return { tag: "expired" };
      throw new Error("Invalid delivery claim");
    },
    acceptOwner: (id, token, providerId) =>
      ok({ operation: "acceptOwner", id, token, providerId }),
    complete: (id, token, confirmationSent) =>
      ok({ operation: "complete", id, token, confirmationSent }),
    uncertain: (id, token) => ok({ operation: "uncertain", id, token }),
  };
}
