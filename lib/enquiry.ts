import type { Enquiry, EnquirySubmissionResult } from "./enquiry-fields";
export {
  normalizeEnquiry,
  validateEnquiry,
  prepareEnquiry,
} from "./enquiry-fields";
export type {
  Enquiry,
  EnquiryErrors,
  EnquirySubmissionResult,
} from "./enquiry-fields";

export async function deliverEnquiry(
  endpoint: string,
  values: Enquiry,
  submissionId: string = crypto.randomUUID(),
  signal?: AbortSignal,
): Promise<EnquirySubmissionResult> {
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": submissionId,
      },
      body: JSON.stringify(values),
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(45000)])
        : AbortSignal.timeout(45000),
    });
  } catch {
    throw new Error(
      "Delivery couldn’t be confirmed. Your details are still here. Please try again or copy your enquiry below.",
    );
  }
  // Accept only explicit storage or legacy delivery confirmation, not an arbitrary 2xx page.
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok || !result || typeof result !== "object")
    throw new Error(
      "Your enquiry wasn’t confirmed. Your details are still here. Please try again or copy your enquiry below.",
    );
  if ("saved" in result && result.saved === true) {
    if (
      !("reference" in result) ||
      typeof result.reference !== "string" ||
      result.reference !== submissionId ||
      !/^[a-z0-9-]{16,80}$/i.test(result.reference)
    )
      throw new Error(
        "Your enquiry couldn’t be confirmed as saved. Please retry or copy your enquiry below.",
      );
    return {
      saved: true,
      reference: result.reference,
      confirmationSent:
        "confirmationSent" in result && result.confirmationSent === true,
    };
  }
  if (!("delivered" in result) || result.delivered !== true)
    throw new Error(
      "Your enquiry wasn’t confirmed as delivered. Your details are still here. Please try again or copy your enquiry below.",
    );
  return {
    reference:
      "reference" in result && typeof result.reference === "string"
        ? result.reference
        : undefined,
    confirmationSent:
      "confirmationSent" in result && result.confirmationSent === true,
  };
}
