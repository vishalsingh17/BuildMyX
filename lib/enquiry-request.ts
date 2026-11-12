import {
  normalizeEnquiry,
  validateEnquiry,
  type Enquiry,
} from "./enquiry-fields";

export function enquiryJson(value: object, status = 200) {
  return Response.json(value, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
export function enquiryHeaders(request: Request, expectedOrigin: string) {
  if (request.headers.get("origin") !== expectedOrigin)
    return enquiryJson(
      { error: "Please send your enquiry from the website." },
      403,
    );
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return enquiryJson({ error: "Send a JSON enquiry." }, 415);
  if (Number(request.headers.get("content-length") ?? 0) > 12000)
    return enquiryJson({ error: "Please keep your enquiry short." }, 413);
  return null;
}
export async function readEnquiry(
  request: Request,
): Promise<{ values: Enquiry } | { error: Response }> {
  let body: unknown;
  try {
    const reader = request.body?.getReader();
    if (!reader)
      return { error: enquiryJson({ error: "Your enquiry is empty." }, 400) };
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 12000) {
        await reader.cancel();
        return {
          error: enquiryJson({ error: "Please keep your enquiry short." }, 413),
        };
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    body = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return {
      error: enquiryJson(
        { error: "Your enquiry could not be read. Please try again." },
        400,
      ),
    };
  }
  if (!body || typeof body !== "object" || Array.isArray(body))
    return {
      error: enquiryJson({ error: "Please check the enquiry fields." }, 400),
    };
  const record = body as Record<string, unknown>;
  if (record.website)
    return {
      error: enquiryJson(
        { error: "Please leave the website field empty." },
        400,
      ),
    };
  const fields = [
    "name",
    "email",
    "interest",
    "description",
    "company",
    "links",
  ] as const;
  if (fields.some((field) => typeof record[field] !== "string"))
    return {
      error: enquiryJson({ error: "Please check the enquiry fields." }, 400),
    };
  const values = normalizeEnquiry(
    Object.fromEntries(
      fields.map((field) => [field, record[field]]),
    ) as Enquiry,
  );
  const errors = validateEnquiry(values);
  if (Object.keys(errors).length)
    return {
      error: enquiryJson(
        { error: "Please check the highlighted fields.", fields: errors },
        422,
      ),
    };
  return { values };
}
