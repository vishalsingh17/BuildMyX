# BuildMyX

Next.js 16, React 19, TypeScript and Tailwind CSS 4. A conversion-focused website for reporting/AI development, practical learning and developer sourcing, with a real sample-data workflow and a server-side enquiry endpoint.

## Run and deploy

```sh
npm ci
cp .env.example .env.local
npm run dev
```

For production, set the hosting environment variables, then run `npm run build` and `npm start`, or deploy with a Next.js-compatible Node/Vercel host. **A static-only host cannot run the enquiry endpoint.** The application uses Next's standalone output; if packaging `.next/standalone` yourself, also copy `public` and `.next/static` into the corresponding standalone directories. `npm start` serves the regular production build.

Public settings are read at build time; rebuild when changing `NEXT_PUBLIC_*`. Email credentials are server-only and must be entered through the host's secret settings. Never commit `.env.local` or put a delivery key in a public variable.

## Pages and conversion paths

- `/`: benefit-led animated hero, three services, working-example link, scoped pilot, founder background, FAQ and shared enquiry form.
- `/services/ai/`: reporting automation, grounded assistants, integrations, pilot scope, acceptance and handover/support expectations.
- `/services/career/`: planned weekend learning, assignments, project reviews, career support and subject-interest registration. No invented course dates or availability.
- `/services/team/`: employer requirements, sourcing, assessment and supplied-developer engagement terms.
- `/projects/` and `/projects/reporting-pipeline/`: actual validation and calculations over editable fictional records, source tracing, downloadable output and a recording of the working demo.
- `/resources/reporting-readiness/` and `/resources/hiring-brief/`: practical worksheets with editable Markdown downloads.
- `/developers/`: a separate introduction route with realistic expectations.
- `/privacy/`: draft, email, clipboard, optional event collection and provider handling.

All enquiry CTAs preselect a single shared form. Deep links use `/?interest=ai#enquire`; the other values are `learning`, `hiring` and `developer`. Draft fields and the manual hero preference survive internal navigation in memory. No cookies, local storage or session storage are used; refresh or closing the tab clears the draft.

## Email delivery

The site is honest when unconfigured: it validates and copies a message, explicitly saying that it has not been sent. Clipboard failure reveals a selectable message. Verified email, booking and LinkedIn links render only when supplied.

To enable the included first-party endpoint:

1. Verify a sender domain with Resend, create a scoped sending key, and configure `RESEND_API_KEY`, `ENQUIRY_FROM` and `ENQUIRY_TO` in the hosting secret settings. Example sender syntax: `BuildMyX <enquiries@your-verified-domain>`.
2. Set `NEXT_PUBLIC_SITE_URL` to the actual HTTPS production origin. Add the verified public contact email, booking and LinkedIn destinations if available; rebuild.
3. On a trusted reverse proxy, configure an edge rate limit for `POST /api/enquiry`. The included per-instance backstop permits five attempts per ten minutes per forwarded IP (maximum 1,000 active counters); it is not a distributed quota. Ensure the host overwrites forwarded-IP headers. For multiple replicas, use an edge/shared limit.
4. Before advertising sending, submit one controlled test with addresses you own. Verify the business inbox, Reply-To, visitor receipt, failure message and provider delivery logs. Automated tests mock the provider and send no real email.

`GET /api/enquiry` reveals only whether the three private delivery settings are present. The browser then changes to “Send enquiry”. Credentials and addresses never leave through that capability response. Presence does not prove a sender is verified; actual submission checks the provider response.

`POST /api/enquiry` requires a same-origin JSON request and validates the six fields, their types, URL schemes and a 12 KB streamed body limit on the server. It sends the business notification first, then attempts the visitor receipt. A successful response is `{ delivered: true, reference, confirmationSent }` only after the provider accepts the business message. Acceptance is not final inbox delivery. A receipt failure still acknowledges the accepted enquiry and tells the visitor not to resubmit. Provider failure returns a non-2xx response without exposing provider details; the draft and copy fallback remain available. The client allows 30 seconds for the two provider calls.

The client reuses an `Idempotency-Key` for retries of unchanged values while the form stays mounted. Distinct owner/receipt suffixes let Resend deduplicate those calls within its idempotency retention window. A refresh begins a new submission; this is not permanent duplicate detection. There is no enquiry database or CRM. Inbox/provider retention settings apply to submitted messages; update the public privacy page if changing providers or adding storage.

An existing external backend can instead be supplied as `NEXT_PUBLIC_ENQUIRY_ENDPOINT`. It must implement the same JSON confirmation contract, validation and abuse controls. A cross-origin endpoint must allow the actual site origin, JSON content type and `Idempotency-Key` header via CORS. Do not point this setting at an untrusted service.

## Public launch and search

The owner has confirmed naming clearance for BuildMyX, BuildMyAI, BuildMyCareer and BuildMyTeam. `NEXT_PUBLIC_LAUNCH_APPROVED` defaults to true. Search indexing is enabled only with a real HTTPS canonical URL; Vercel previews/development and Netlify deploy/branch previews stay `noindex`. To pause indexing, set `NEXT_PUBLIC_LAUNCH_APPROVED=false` and rebuild. Other hosting platforms should use that override for previews.

The site includes route-specific metadata, canonical URLs, a generated social-share image, robots rules and a sitemap of real pages. The owner-verified production URL, `https://build-my-x.vercel.app`, is configured in `lib/site-config.ts`; `NEXT_PUBLIC_SITE_URL` can override it when moving to a custom domain. Development and Vercel previews stay `noindex`.

## Working example

`lib/reporting.ts` performs integer-pence arithmetic, excludes invalid or duplicate records and supplies exact row references. The 13-row sample has 10 accepted records, three review issues, £4,200 for Week 1 and £5,000 for Week 2. Editing an input invalidates the displayed output until checks are rerun. CSV output escapes punctuation and spreadsheet-formula prefixes. The demo runs in the browser, with no AI model, business-system access or data upload. It is clearly labelled as fictional, not a client result.

The walkthrough is a recording of this implementation, with captions and parallel written steps. `scripts/record-demo.mjs` can regenerate the assets with Chromium and FFmpeg after building. It starts a temporary production server and stops it after recording. Install the Playwright recording helper with `npx playwright install ffmpeg` if it is missing; FFmpeg must also be available on the system for MP4 encoding.

## PostHog analytics and sales follow-up

PostHog is integrated through the official `posthog-js` SDK. The owner-supplied public browser token and US ingestion host are configured in `lib/site-config.ts`, so the Git-connected Vercel deployment does not depend on an untracked `.env.local`. These are public browser settings, not personal API keys or email credentials. Set `NEXT_PUBLIC_ANALYTICS_ENABLED=false` and rebuild to disable external analytics. Optional `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` values override the defaults. See [the PostHog setup guide](docs/posthog-setup.md) for dashboard and deployment steps.

The SDK loads only when configured and the visitor has not enabled Do Not Track or Global Privacy Control. The existing event hooks feed PostHog directly; no collector adapter is needed. Automatic interaction capture, replay, surveys, exception capture, feature flags and external extension loading are disabled. A final event guard strips SDK URL/referrer defaults, form data, person properties and unapproved events. Clean page views appear as `$pageview`. Service views, CTA clicks, enquiry starts/submissions/copies, bookings, demo runs and downloads retain their existing names.

Anonymous identifiers are held in tab memory to connect actions within the open visit. Cookies, local storage, session storage, person profiles and IP enrichment are disabled. Refresh starts a new visit, so unique visitor and returning-user figures are deliberately limited. Do not enable extra collection without reviewing the configuration and updating the public privacy page.

`NEXT_PUBLIC_ANALYTICS_ENDPOINT` remains an optional alternative collector. Setting it suppresses the default PostHog project unless an explicit PostHog token override is also supplied. It accepts the documented JSON event/path/label payload without visitor identifiers. Do not put a PostHog ingestion URL into that setting: its protocol is different. PostHog takes precedence when both its settings are supplied, avoiding duplicate collection. Setting `NEXT_PUBLIC_ANALYTICS_ENABLED=false` prevents both integrations from sending events. The local `buildmyx:analytics` CustomEvent remains available for inspection.

Use a private copy of `docs/lead-tracker-template.csv` to record qualified enquiries, follow-ups and actual won/lost outcomes. Do not put customer records in this public repository.

## Verify

```sh
npm test
npm run typecheck
npm run build
npm run test:browser
```

The browser check starts the actual Next production server, uses Chromium, then closes both. It checks 320/390/768/1440 px, the fixed wordmark/variable suffix, motion preferences, navigation, keyboard/focus behavior, form validation, copy/manual-copy fallback, cross-page drafts, service routes, the editable demo, source references, CSV download, mock email confirmations, contrast, links and browser errors. No real emails are sent. It uses `/usr/bin/chromium` when present; otherwise install Playwright Chromium or supply `CHROMIUM_EXECUTABLE_PATH`. Artifacts go to ignored `work/browser-qa/`; override with `QA_OUTPUT`.

## Editing

- `lib/site-config.ts`, `.env.example`: business destinations, launch gate, hero names/copy and optional integrations.
- `lib/content.ts`, `lib/services.ts`: FAQ and service detail copy.
- `components/landing.tsx`, `components/pilot-package.tsx`: concise homepage and pilot offer.
- `components/reporting-demo.tsx`, `lib/reporting.ts`: interactive proof and calculation rules.
- `lib/server/enquiries.ts`: validated delivery handler; `app/api/enquiry/route.ts` exposes it.
- `app/globals.css`, `app/improvements.css`: warm ivory/forest visual system and responsive layouts.

Fonts are self-hosted with licences in `public/fonts/`. The initial accessible hero remains stable while only the visible suffix animates. Manual selection pauses rotation, Resume is explicit, hover/focus pauses and reduced motion starts paused.
