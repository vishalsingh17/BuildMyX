import type { CaptureResult, PostHogConfig } from "posthog-js";
import {
  analyticsPayload,
  isAnalyticsEvent,
  type AnalyticsEvent,
} from "./analytics";

/** Only public cloud ingestion hosts are accepted; no credentials belong here. */
export function posthogDestination(token: string | null, host: string | null) {
  if (!token || !/^phc_[a-z0-9_-]+$/i.test(token) || !host) return null;
  try {
    const url = new URL(host);
    if (
      !["https://us.i.posthog.com", "https://eu.i.posthog.com"].includes(
        url.origin,
      ) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/"
    )
      return null;
    return { token, host: url.origin };
  } catch {
    return null;
  }
}

/** Strip SDK URL/referrer defaults, person properties and all unapproved events. */
export function sanitizePosthogEvent(
  event: CaptureResult,
  origin: string,
): CaptureResult | null {
  const name = event.event === "$pageview" ? "page_view" : event.event;
  if (!isAnalyticsEvent(name)) return null;
  const token = event.properties.token;
  if (typeof token !== "string" || !/^phc_[a-z0-9_-]+$/i.test(token))
    return null;
  const payload = analyticsPayload(
    name,
    String(event.properties.path ?? "/other"),
    event.properties,
  );
  const properties: Record<string, unknown> = {
    token,
    path: payload.path,
    $pathname: payload.path,
    $current_url: `${origin}${payload.path}`,
    $process_person_profile: false,
  };
  for (const key of ["interest", "placement", "resource"] as const)
    if (key in payload) properties[key] = payload[key as keyof typeof payload];
  // SDK-generated, tab-memory identifiers support a funnel within the open visit.
  for (const key of [
    "distinct_id",
    "$device_id",
    "$session_id",
    "$window_id",
  ]) {
    const value = event.properties[key];
    if (typeof value === "string" && /^[a-f0-9-]{32,40}$/i.test(value))
      properties[key] = value;
  }
  if (!properties.distinct_id) return null;
  return {
    uuid: event.uuid,
    event: event.event,
    timestamp: event.timestamp,
    properties,
  };
}

export function posthogOptions(
  host: string,
  origin: string,
): Partial<PostHogConfig> {
  return {
    api_host: host,
    defaults: "2026-08-30",
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    capture_dead_clicks: false,
    capture_exceptions: false,
    capture_heatmaps: false,
    capture_performance: false,
    disable_session_recording: true,
    disable_surveys: true,
    disable_product_tours: true,
    disable_conversations: true,
    save_referrer: false,
    save_campaign_params: false,
    request_batching: false,
    disable_compression: true,
    disable_external_dependency_loading: true,
    advanced_disable_flags: true,
    persistence: "memory",
    disable_persistence: true,
    person_profiles: "never",
    internal_or_test_user_hostname: null,
    respect_dnt: true,
    ip: false,
    before_send: (event) => {
      if (
        typeof navigator !== "undefined" &&
        (navigator.doNotTrack === "1" ||
          (navigator as Navigator & { globalPrivacyControl?: boolean })
            .globalPrivacyControl)
      )
        return null;
      return sanitizePosthogEvent(event, origin);
    },
  };
}

export function posthogEventName(event: AnalyticsEvent) {
  return event === "page_view" ? "$pageview" : event;
}
