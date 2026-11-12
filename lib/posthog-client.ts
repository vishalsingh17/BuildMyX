import posthog from "posthog-js";
import {
  posthogDestination,
  posthogEventName,
  posthogOptions,
} from "./posthog-config";
import { siteConfig } from "./site-config";
import type { analyticsPayload } from "./analytics";
let initialized = false;

/** Lazy-loaded only when the owner has supplied a public token and matching host. */
export function capturePosthog(payload: ReturnType<typeof analyticsPayload>) {
  if (
    typeof window === "undefined" ||
    navigator.doNotTrack === "1" ||
    (navigator as Navigator & { globalPrivacyControl?: boolean })
      .globalPrivacyControl
  )
    return;
  const destination = posthogDestination(
    siteConfig.posthogToken,
    siteConfig.posthogHost,
  );
  if (!destination) return;
  if (!initialized) {
    posthog.init(
      destination.token,
      posthogOptions(destination.host, window.location.origin),
    );
    initialized = true;
  }
  const { event, ...properties } = payload;
  posthog.capture(posthogEventName(event), properties);
}
