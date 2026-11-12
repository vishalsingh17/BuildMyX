import { siteConfig, type Interest } from "./site-config";
import {
  collectorDestination,
  posthogDestination,
} from "./analytics-destination";

export type AnalyticsEvent =
  | "page_view"
  | "service_view"
  | "cta_click"
  | "enquiry_start"
  | "enquiry_submitted"
  | "enquiry_copy"
  | "booking_click"
  | "example_run"
  | "resource_download";
type Props = { interest?: Interest; placement?: string; resource?: string };
const events: AnalyticsEvent[] = [
  "page_view",
  "service_view",
  "cta_click",
  "enquiry_start",
  "enquiry_submitted",
  "enquiry_copy",
  "booking_click",
  "example_run",
  "resource_download",
];

const allowedLabels: Record<string, readonly string[]> = {
  interest: ["ai", "learning", "hiring", "developer"],
  placement: ["hero", "home_service", "service", "contact"],
  resource: [
    "reporting_pipeline",
    "checked_report",
    "sample_inputs",
    "employer_brief",
    "reporting_readiness",
  ],
};
const allowedPaths = new Set([
  "/",
  "/services/ai/",
  "/services/career/",
  "/services/team/",
  "/developers/",
  "/privacy/",
  "/projects/",
  "/projects/reporting-pipeline/",
  "/resources/hiring-brief/",
  "/resources/reporting-readiness/",
]);

export function isAnalyticsEvent(value: string): value is AnalyticsEvent {
  return events.includes(value as AnalyticsEvent);
}

/** No input values or URL query strings enter the event properties. */
export function analyticsPayload(
  event: AnalyticsEvent,
  path: string,
  props: Props = {},
) {
  return {
    event,
    path: allowedPaths.has(path) ? path : "/other",
    ...Object.fromEntries(
      Object.entries(props).filter(
        ([key, value]) =>
          typeof value === "string" && !!allowedLabels[key]?.includes(value),
      ),
    ),
  };
}

function privacyBlocked() {
  return (
    navigator.doNotTrack === "1" ||
    !!(navigator as Navigator & { globalPrivacyControl?: boolean })
      .globalPrivacyControl
  );
}
function collect(payload: ReturnType<typeof analyticsPayload>) {
  const endpoint = collectorDestination(siteConfig.analyticsEndpoint);
  if (!endpoint || !siteConfig.analyticsEnabled || privacyBlocked()) return;
  void fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "omit",
    referrerPolicy: "no-referrer",
    keepalive: true,
    body: JSON.stringify(payload),
  }).catch(() => {});
}
export function track(event: AnalyticsEvent, props: Props = {}) {
  if (
    typeof window === "undefined" ||
    !events.includes(event) ||
    privacyBlocked()
  )
    return;
  const payload = analyticsPayload(event, window.location.pathname, props);
  window.dispatchEvent(
    new CustomEvent("buildmyx:analytics", { detail: payload }),
  );
  if (!siteConfig.analyticsEnabled) return;
  if (posthogDestination(siteConfig.posthogToken, siteConfig.posthogHost)) {
    void import("./posthog-client")
      .then(({ capturePosthog }) => capturePosthog(payload))
      .catch(() => collect(payload));
    return;
  }
  collect(payload);
}
