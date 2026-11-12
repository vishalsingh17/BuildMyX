# Activate PostHog for BuildMyX

BuildMyX's owner-supplied public project token and US ingestion host are configured in `lib/site-config.ts`. The production URL is `https://build-my-x.vercel.app`. The Git-connected Vercel build uses these public defaults even when no environment overrides have been set.

The project token is the public browser installation token. Personal API keys and server-side email credentials are never included in this file. No management API access or remote dashboard creation is implied.

## Production settings

- A push to the connected production branch triggers Vercel's normal deployment.
- `NEXT_PUBLIC_ANALYTICS_ENABLED=false` disables all external analytics after rebuilding.
- `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` optionally override the configured project. For this project the ingestion host is `https://us.i.posthog.com`.
- `NEXT_PUBLIC_SITE_URL` overrides the canonical production URL when moving to a custom domain.
- Production is indexable after the confirmed naming clearance. Development and Vercel previews remain `noindex`.
- On a fork or a different business's deployment, replace the public project configuration or disable collection.

Check PostHog's live activity after visiting a service or trying the reporting example. A copied enquiry never counts as submitted. Email sending requires separate Resend credentials, a verified business inbox and the signed Convex delivery-metadata service.

## Suggested dashboard

Create a dashboard called **BuildMyX conversions** with:

- Page views: `$pageview`, broken down by `path`.
- Service interest: `service_view`, broken down by `interest`.
- Enquiry funnel: `cta_click` → `enquiry_start` → `enquiry_submitted`; compare the `interest` values `ai`, `learning`, `hiring` and `developer`.
- Demo engagement: `example_run`, followed by an AI enquiry start/submission in the same visit.
- Copy fallback: `enquiry_copy`, shown separately from actual submissions.
- Downloads and booking intent: `resource_download` by `resource`, and `booking_click`. A booking click does not prove a completed booking.

These are setup instructions, not claims that remote dashboards have already been created. The integration needs no personal API key. Dashboard management can be done in PostHog's UI.

## Collection behavior

- Only approved events and fixed labels are sent; URLs contain a clean known path, without query strings, hash fragments or referrers.
- Names, email addresses, enquiry descriptions, company names, relevant links and SDK person properties are excluded by the final event guard.
- PostHog uses random tab-memory identifiers to connect actions within the open visit. Refresh/closing the page clears them. Returning-user attribution is therefore limited; analytics does not follow people across visits.
- Cookies, local/session storage, person profiles, session replay, autocapture, feature flags, surveys, exception/performance capture and IP enrichment are disabled.
- Do Not Track and Global Privacy Control prevent initialization and collection. Providers still handle network requests and may retain technical records under their own settings.
- Setting `NEXT_PUBLIC_ANALYTICS_ENABLED=false` prevents SDK loading and all external collection. An alternative collector suppresses the default PostHog project when no explicit project token is supplied. A valid explicit PostHog configuration takes precedence; the collector is a fallback for invalid configuration or import/initialization failure.

The browser-token integration does not require the wizard OAuth callback. In a remote workspace, a wizard localhost callback would need to return to that same remote machine.

## Verify without polluting analytics

Automated browser tests intercept PostHog hosts and return mock ingestion responses. They never send test events to a real project. Run `npm test`, `npm run typecheck`, `npm run build` and `npm run test:browser`. The dedicated configured integration check is documented in the browser script and verifies outgoing fields, session correlation, refresh behavior, storage, Do Not Track and Global Privacy Control.

To exercise a configured integration without a live token:

```sh
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=phc_buildmyx_browser_test NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com npm run build
POSTHOG_EXPECT_ENABLED=1 npm run test:browser
npm run build
```

To verify disabled collection, build with `NEXT_PUBLIC_ANALYTICS_ENABLED=false` and run `POSTHOG_EXPECT_ENABLED=0 npm run test:browser`, then rebuild normally.

The final build restores the actual environment configuration. Do not deploy the mock-token build. The configured test simulates a regular visitor because PostHog intentionally filters browser automation; opt-out tests use the same visitor simulation so bot filtering cannot hide a privacy regression.

## Event lifetimes

- `enquiry_start` is emitted once for the current in-memory draft, including client navigation away from and back to the form. A fresh document begins a new draft.
- `enquiry_submitted` describes a provider-confirmed attempt snapshot; changing the draft during that attempt does not change its event's interest. Reusing a cached accepted result emits no duplicate submission event.
- `resource_download` records a download action, not confirmation that the file reached the user's device. `booking_click` likewise records intent.
- Page effects emit once per pathname transition, including returning to a previous route. Query/hash-only changes do not add page views. Effect replay on the same path is deduplicated.
- Invalid PostHog configuration can fall back to a valid configured HTTPS collector. Import/initialization failure may also use that collector; this is an attempt fallback, not a guarantee of acknowledged ingestion. Privacy preferences are checked again before fallback.

Browser checks verify the normal PostHog-enabled build by default. For deliberately disabled or collector-only builds, set `POSTHOG_EXPECT_ENABLED=0`; use `POSTHOG_EXPECT_ENABLED=1` to explicitly require SDK ingestion checks. All ingestion remains intercepted.
