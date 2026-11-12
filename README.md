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

## Convex development setup

BuildMyX is linked to the existing [Convex cloud development deployment `tacit-badger-38`](https://dashboard.convex.dev/t/vishal-singh-6dda1/buildmyx/tacit-badger-38). Its cloud URL is `https://tacit-badger-38.convex.cloud`; HTTP actions use `https://tacit-badger-38.convex.site`. The development settings are included in `.env.example` and selected locally in the ignored `.env.local`.

Run `npm run dev:convex` alongside the Next.js development server. To sync once with Convex's TypeScript checks enabled, run `npx convex dev --once --typecheck enable --tail-logs disable`. The generated bindings under `convex/_generated/` and the backend TypeScript configuration in `convex/tsconfig.json` are committed.

Convex stores delivery metadata in `enquiryDeliveries` and protected rate-limit keys in `enquiryRateKeys`. Internal mutations implement the delivery ledger; an HMAC-authenticated HTTP action is the server entry point. The official rate-limiter component enforces shared limits. Enquiry text stays in the browser/request and email provider; it is not stored in these tables. The Next.js endpoint orchestrates email sending. Production uses a production Convex deployment and its own private service secret. Convex account credentials stay outside the repository.

`npx convex ai-files install` installs the generated guidance at `convex/_generated/ai/guidelines.md` and project skills under `.agents/skills`. The generated `AGENTS.md` and `CLAUDE.md` direct coding agents to that guidance. Rerun the installer when updating Convex's AI instructions.

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

1. Deploy the Convex functions to the intended backend. The existing `tacit-badger-38` deployment is for development. Use a production deployment for the live website.
2. Generate a random service secret with at least 32 characters. Set `ENQUIRY_SERVICE_SECRET` in both that Convex deployment and Vercel's server environment. Set `ENQUIRY_CONVEX_SITE_URL` in Vercel to that deployment's `https://…convex.site` HTTP actions URL. Keep the secret out of public variables and Git.
3. Verify a Resend sender domain and configure server-only `RESEND_API_KEY`, `ENQUIRY_FROM` and `ENQUIRY_TO`. Example sender: `BuildMyX <enquiries@your-verified-domain>`.
4. Set `NEXT_PUBLIC_SITE_URL` to the actual production origin. Ensure the host overwrites forwarded-IP headers. An edge request limit remains useful before application processing; the Convex component supplies the shared application limit of five attempts per aligned ten-minute window, plus a cap on new rate keys.
5. Rebuild and verify with addresses you own before advertising sending. Automated checks simulate email responses and do not send mail. If Vercel should also deploy the backend on builds, configure its build command as `npx convex deploy --cmd 'npm run build'` with the intended deployment's private `CONVEX_DEPLOY_KEY` in the host's secrets.

`GET /api/enquiry` enables sending only when email settings and the signed metadata service are available. A backend outage returns 503 so the browser can retry discovery; absent configuration offers copying. Credentials and destinations are not exposed in the capability response. Configuration does not prove that the sender or inbox has been verified.

`POST /api/enquiry` enforces origin, media type, a 12 KB streamed limit, field validation and shared abuse controls. It claims the submission ID atomically, binding it to a keyed fingerprint of normalized fields. Concurrent claims cannot send another business message; an ID used with different content is rejected. Cached submissions return their original result. A 60-second lease lets an interrupted request resume; recorded owner acceptance skips the business send on retries. Uncertain owner sends are not automatically retried after 23 hours, before provider deduplication can expire. Delivery metadata is removed after 30 days by scheduled cleanup, so this is a bounded retention policy, not permanent duplicate detection.

Owner and receipt messages retain separate provider idempotency keys. A successful response is `{ delivered: true, reference, confirmationSent }` after provider acceptance of the business message. Receipt failure and metadata-update failure after known acceptance do not turn it into an unsuccessful enquiry. Store failures before sending fail closed. The client allows 45 seconds for bounded provider and ledger operations.

The draft, current operation, normalized retry identity and first-focus analytics latch live in the root provider across client navigation. Each operation owns its snapshot and draft revision; old completions cannot mark edited values submitted or show a missing prepared message. Copy/send feedback is mutually exclusive. Discovery times out after five seconds and can retry; clipboard permission times out after fifteen seconds into manual copying. Refresh starts a new draft; no browser storage is used.

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

## State transitions and verification

`lib/enquiry-machine.ts`, `lib/hero-machine.ts` and `lib/reporting-machine.ts` define typed transitions. Report Reset restores the sample and default explanation; stale outputs remain blocked from export and provenance. Hero run intent is separate from hover/focus suspension and motion preference. Explicit Resume can override reduced-motion stopping while CSS transitions remain disabled. FAQ and media controls retain their native browser behavior.

Run `npm test` for Node and Convex tests, `npm run build` for the production build, and `npm run test:browser` for the full browser journeys and delayed-response/navigation regressions. The original inventory and remediation mapping are in `docs/implicit-state-machines.md`.
