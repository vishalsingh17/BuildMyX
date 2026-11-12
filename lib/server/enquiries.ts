import { randomUUID } from "node:crypto";
import { prepareEnquiry, validateEnquiry, type Enquiry } from "../enquiry";
import { siteConfig } from "../site-config";

type DeliveryConfig = { apiKey: string; from: string; to: string };
type Dependencies = {
  config?: DeliveryConfig | null;
  fetch?: typeof fetch;
  allowRequest?: (key: string) => boolean;
};
const requestWindows = new Map<string, { count: number; expires: number }>();
const MAX_BODY = 12_000;

export function deliveryConfig(): DeliveryConfig | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.ENQUIRY_FROM?.trim();
  const to = process.env.ENQUIRY_TO?.trim();
  return apiKey && from && to ? { apiKey, from, to } : null;
}

/** A per-instance backstop; the deployment should also enforce an edge rate limit. */
function allowRequest(key: string): boolean {
  const now = Date.now();
  for (const [entry, value] of requestWindows)
    if (value.expires <= now) requestWindows.delete(entry);
  const current = requestWindows.get(key);
  if (current && current.count >= 5) return false;
  if (!current && requestWindows.size >= 1000) return false;
  if (!current) {
    const expires = now + 10 * 60_000;
    const cleanup = setTimeout(() => {
      if (requestWindows.get(key)?.expires === expires)
        requestWindows.delete(key);
    }, expires - now);
    cleanup.unref();
  }
  requestWindows.set(key, {
    count: (current?.count ?? 0) + 1,
    expires: current?.expires ?? now + 10 * 60_000,
  });
  return true;
}

function json(data: object, status: number) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function handleEnquiry(
  request: Request,
  dependencies: Dependencies = {},
) {
  const config =
    dependencies.config === undefined ? deliveryConfig() : dependencies.config;
  if (!config)
    return json(
      { error: "Sending is not configured. Please use the copy option." },
      503,
    );
  const origin = request.headers.get("origin");
  const expected = siteConfig.canonicalUrl
    ? new URL(siteConfig.canonicalUrl).origin
    : new URL(request.url).origin;
  if (!origin || origin !== expected)
    return json({ error: "Please send your enquiry from the website." }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return json({ error: "Send a JSON enquiry." }, 415);
  const declaredSize = Number(request.headers.get("content-length") ?? 0);
  if (declaredSize > MAX_BODY)
    return json({ error: "Please keep your enquiry short." }, 413);
  const key = (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  ).slice(0, 100);
  if (!(dependencies.allowRequest ?? allowRequest)(key))
    return json(
      {
        error:
          "Too many attempts. Please wait and try again, or copy your enquiry.",
      },
      429,
    );
  let body: unknown;
  try {
    // Limit the stream before parsing; Content-Length is not trusted.
    const reader = request.body?.getReader();
    if (!reader) return json({ error: "Your enquiry is empty." }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY) {
        await reader.cancel();
        return json({ error: "Please keep your enquiry short." }, 413);
      }
      chunks.push(value);
    }
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return json(
      { error: "Your enquiry could not be read. Please try again." },
      400,
    );
  }
  if (!body || typeof body !== "object" || Array.isArray(body))
    return json({ error: "Please check the enquiry fields." }, 400);
  const record = body as Record<string, unknown>;
  if (record.website)
    return json({ error: "Please leave the website field empty." }, 400);
  const fields = [
    "name",
    "email",
    "interest",
    "description",
    "company",
    "links",
  ] as const;
  if (fields.some((field) => typeof record[field] !== "string"))
    return json({ error: "Please check the enquiry fields." }, 400);
  const values = Object.fromEntries(
    fields.map((field) => [field, (record[field] as string).trim()]),
  ) as Enquiry;
  const errors = validateEnquiry(values);
  if (Object.keys(errors).length)
    return json(
      { error: "Please check the highlighted fields.", fields: errors },
      422,
    );
  const submittedId = request.headers.get("idempotency-key");
  const id =
    submittedId && /^[a-z0-9-]{16,80}$/i.test(submittedId)
      ? submittedId
      : randomUUID();
  const send = async (message: object, suffix: string) => {
    const response = await (dependencies.fetch ?? fetch)(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `${id}-${suffix}`,
        },
        body: JSON.stringify(message),
        signal: AbortSignal.timeout(12_000),
      },
    );
    const result = (await response.json().catch(() => null)) as {
      id?: string;
    } | null;
    if (!response.ok || !result?.id)
      throw new Error("Email service did not accept the message.");
    return result.id;
  };
  try {
    await send(
      {
        from: config.from,
        to: [config.to],
        reply_to: values.email,
        subject: `BuildMyX enquiry: ${values.interest}`,
        text: `${prepareEnquiry(values)}\n\nReference: ${id}`,
      },
      "owner",
    );
  } catch {
    return json(
      {
        error:
          "Sending could not be confirmed. Your details are still here; please retry or copy your enquiry.",
      },
      502,
    );
  }
  let confirmationSent = false;
  try {
    await send(
      {
        from: config.from,
        to: [values.email],
        reply_to: siteConfig.contactEmail || config.to,
        subject: "Your BuildMyX enquiry",
        text: `Hello ${values.name},\n\nThank you for your enquiry. Your message has been submitted to BuildMyX.\n\n${prepareEnquiry(values)}\n\nReference: ${id}\n\nThis confirms submission. Project scope, availability and any engagement are agreed separately.`,
      },
      "receipt",
    );
    confirmationSent = true;
  } catch {
    /* The owner message succeeded. Do not invite a duplicate submission. */
  }
  return json({ delivered: true, reference: id, confirmationSent }, 200);
}
