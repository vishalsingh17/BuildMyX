import { siteConfig } from "../site-config";
import { enquiryHeaders, enquiryJson, readEnquiry } from "../enquiry-request";
import { deploymentEnvironment, deploymentUrls } from "../deployment-config";

// Public HTTP actions URL. Credentials and notification settings stay in Convex.
const productionSiteUrl = deploymentUrls("production").site;
const developmentSiteUrl = deploymentUrls("development").site;
export function intakeConfig(
  environment: Record<string, string | undefined> = process.env,
) {
  if (environment.ENQUIRY_ENABLED === "false") return null;
  const stage = deploymentEnvironment(environment);
  const override =
    environment.ENQUIRY_CONVEX_SITE_URL?.trim().replace(/\/$/, "") || null;
  // Migrate the original development URL on Vercel production; previews stay isolated.
  const value =
    stage === "production" && (!override || override === developmentSiteUrl)
      ? productionSiteUrl
      : override || developmentSiteUrl;
  if (!value) return null;
  try {
    const url = new URL(value);
    if (stage === "development" && url.origin === productionSiteUrl)
      return null;
    if (
      url.protocol !== "https:" ||
      !url.hostname.endsWith(".convex.site") ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/"
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}
type Dependencies = { siteUrl?: string | null; fetch?: typeof fetch };
const origin = () => new URL(siteConfig.canonicalUrl).origin;

export async function intakeAvailable(dependencies: Dependencies = {}) {
  const siteUrl =
    dependencies.siteUrl === undefined ? intakeConfig() : dependencies.siteUrl;
  if (!siteUrl) return false;
  const response = await (dependencies.fetch ?? fetch)(
    `${siteUrl}/enquiries/health`,
    {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    },
  );
  const body: unknown = await response.json().catch(() => null);
  if (
    !response.ok ||
    !body ||
    typeof body !== "object" ||
    !("enabled" in body) ||
    body.enabled !== true
  )
    throw new Error("Enquiry storage unavailable");
  return true;
}

export async function handleEnquiryIntake(
  request: Request,
  dependencies: Dependencies = {},
) {
  const siteUrl =
    dependencies.siteUrl === undefined ? intakeConfig() : dependencies.siteUrl;
  if (!siteUrl)
    return enquiryJson(
      { error: "Sending is unavailable. Please use the copy option." },
      503,
    );
  const headerError = enquiryHeaders(request, new URL(request.url).origin);
  if (headerError) return headerError;
  const reference =
    request.headers.get("Idempotency-Key") ?? crypto.randomUUID();
  if (!/^[a-z0-9-]{16,80}$/i.test(reference))
    return enquiryJson({ error: "Invalid submission reference." }, 400);
  const body = await readEnquiry(request);
  if ("error" in body) return body.error;
  try {
    const response = await (dependencies.fetch ?? fetch)(
      `${siteUrl}/enquiries`,
      {
        method: "POST",
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
        headers: {
          "Content-Type": "application/json",
          Origin: origin(),
          "Idempotency-Key": reference,
        },
        body: JSON.stringify(body.values),
      },
    );
    if (!response.ok) {
      const status = [400, 409, 422, 429].includes(response.status)
        ? response.status
        : 503;
      return enquiryJson(
        {
          error:
            status === 429
              ? "Too many enquiries. Please try again later."
              : "Your enquiry could not be confirmed as saved. Please retry or copy your enquiry.",
        },
        status,
      );
    }
    const result: unknown = await response.json();
    if (
      !result ||
      typeof result !== "object" ||
      !("saved" in result) ||
      result.saved !== true ||
      !("reference" in result) ||
      result.reference !== reference
    )
      throw new Error("Unconfirmed storage");
    return enquiryJson({ saved: true, reference });
  } catch {
    return enquiryJson(
      {
        error:
          "Your enquiry could not be confirmed as saved. Your details are still here. Please retry or copy your enquiry.",
      },
      503,
    );
  }
}
