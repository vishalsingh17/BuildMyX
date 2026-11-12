import { interests } from "./site-config";

export type Enquiry = {
  name: string;
  email: string;
  interest: string;
  description: string;
  company: string;
  links: string;
};
export type EnquiryErrors = Partial<Record<keyof Enquiry, string>>;

/** Reusable by a delivery endpoint: never rely on browser validation alone. */
export function validateEnquiry(values: Enquiry): EnquiryErrors {
  const errors: EnquiryErrors = {};
  if (values.name.trim().length < 2)
    errors.name = "Please enter your name (at least 2 characters).";
  else if (values.name.length > 100)
    errors.name = "Please keep your name under 100 characters.";
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()) ||
    values.email.length > 254
  )
    errors.email = "Enter a valid email, such as name@company.com.";
  if (!interests.some((item) => item.value === values.interest))
    errors.interest = "Choose what you’d like to discuss.";
  if (values.description.trim().length < 20)
    errors.description = "Add a little more detail (at least 20 characters).";
  else if (values.description.length > 3000)
    errors.description = "Please keep your description under 3,000 characters.";
  if (values.company.length > 150)
    errors.company = "Please keep the company name under 150 characters.";
  if (
    values.links.trim() &&
    !values.links
      .trim()
      .split(/\s+/)
      .every((link) => {
        try {
          const url = new URL(link);
          return ["https:", "http:"].includes(url.protocol);
        } catch {
          return false;
        }
      })
  )
    errors.links =
      "Use complete http:// or https:// links, separated by spaces.";
  if (values.links.length > 1000)
    errors.links = "Please keep your links under 1,000 characters.";
  return errors;
}

export function prepareEnquiry(values: Enquiry): string {
  const interest =
    interests.find((item) => item.value === values.interest)?.label ??
    values.interest;
  return [
    "BuildMyX enquiry",
    `Interest: ${interest}`,
    `Name: ${values.name.trim()}`,
    `Email: ${values.email.trim()}`,
    ...(values.company.trim() ? [`Company: ${values.company.trim()}`] : []),
    "",
    values.description.trim(),
    ...(values.links.trim()
      ? [`\nRelevant links: ${values.links.trim()}`]
      : []),
  ].join("\n");
}

export async function deliverEnquiry(
  endpoint: string,
  values: Enquiry,
  submissionId: string = crypto.randomUUID(),
): Promise<{ reference?: string; confirmationSent: boolean }> {
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": submissionId,
      },
      body: JSON.stringify(values),
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    throw new Error(
      "Delivery couldn’t be confirmed. Your details are still here. Please try again or copy your enquiry below.",
    );
  }
  // The endpoint must confirm delivery explicitly, not merely return a 2xx page.
  const result: unknown = await response.json().catch(() => null);
  if (
    !response.ok ||
    !result ||
    typeof result !== "object" ||
    !("delivered" in result) ||
    result.delivered !== true
  )
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
