import { interests } from "./interests";

export type Enquiry = {
  name: string;
  email: string;
  interest: string;
  description: string;
  company: string;
  links: string;
};
export type EnquiryErrors = Partial<Record<keyof Enquiry, string>>;

/** Match server normalization so retries of the same message keep one identity. */
export function normalizeEnquiry(values: Enquiry): Enquiry {
  return {
    name: values.name.trim(),
    email: values.email.trim(),
    interest: values.interest,
    description: values.description.trim(),
    company: values.company.trim(),
    links: values.links.trim(),
  };
}

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

export type EnquirySubmissionResult =
  | { saved: true; reference: string; confirmationSent: boolean }
  | { saved?: false; reference?: string; confirmationSent: boolean };
