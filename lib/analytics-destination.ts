/** Public PostHog project tokens and their cloud ingestion region. */
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

export function collectorDestination(endpoint: string | null) {
  if (!endpoint) return null;
  try {
    const url = new URL(endpoint);
    return url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.hash
      ? url.href
      : null;
  } catch {
    return null;
  }
}
