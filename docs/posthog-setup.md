# Activate PostHog for BuildMyX

The website integration is implemented. Activation requires the owner's actual PostHog project; no account or dashboard has been fabricated.

## Connect the project

1. Sign in to PostHog in your own browser and select or create the BuildMyX project.
2. Open the project's web installation screen or project settings. Copy the **public project token**, usually beginning `phc_`. A personal/private API key is not needed.
3. Configure these public build variables in your host, or in the ignored `.env.local` for local use:

```dotenv
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=phc_your_public_project_token
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

Use `https://us.i.posthog.com` for a US project. The host must match the project region. Both values are required; blank or invalid values send no PostHog events. Rebuild/redeploy after changes because Next.js embeds public settings at build time.

4. Visit the deployed site, open a service, try the reporting demo and check PostHog's live activity. Match the event names and `path`/`interest` properties below. A copied enquiry should never count as submitted.
5. Verify actual sending separately after configuring Resend. Analytics cannot activate email delivery.

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
- No token/host means the PostHog SDK is not loaded. An optional legacy collector is used only when PostHog is unset; both are never sent the same event.

The wizard was attempted in the cloud workspace. Its localhost OAuth callback cannot be reached from a browser on another machine. The manual integration avoids that callback entirely; it needs only the public installation values above.

## Verify without polluting analytics

Automated browser tests intercept PostHog hosts and return mock ingestion responses. They never send test events to a real project. Run `npm test`, `npm run typecheck`, `npm run build` and `npm run test:browser`. The dedicated configured integration check is documented in the browser script and verifies outgoing fields, session correlation, refresh behavior, storage, Do Not Track and Global Privacy Control.

To exercise a configured integration without a live token:

```sh
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=phc_buildmyx_browser_test NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com npm run build
POSTHOG_EXPECT_ENABLED=1 npm run test:browser
npm run build
```

The final build restores the actual environment configuration. Do not deploy the mock-token build. The configured test simulates a regular visitor because PostHog intentionally filters browser automation; opt-out tests use the same visitor simulation so bot filtering cannot hide a privacy regression.
