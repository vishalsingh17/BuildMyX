# BuildMyX

A public-facing website built with Next.js 16, React 19, TypeScript and Tailwind CSS 4. Pages are statically exported. No accounts, analytics or server-side enquiry storage are included.

## Pages

- `/`: the complete landing page, changing wordmark, selectable reporting example and shared enquiry form.
- `/services/ai/`: AI offers, an illustrative pilot brief, scope, acceptance criteria and support expectations.
- `/services/career/`: planned weekend learning, reviewed projects, career support and subject-interest registration.
- `/services/team/`: employer requirements, sourcing, assessment, introductions and engagement coordination.
- `/developers/`: a separate developer-interest route with clear expectations about introductions.
- `/privacy/`: how the current enquiry flow handles drafts, copying and delivery.
- A custom 404 page with routes back to the services and enquiry form.

All enquiry CTAs lead to the single homepage form and preselect the appropriate interest. Shareable links use `/?interest=ai#enquire`, with `learning`, `hiring` and `developer` as the other valid values. Draft fields survive navigation through the site's Next.js links using an in-memory provider in the shared layout. No cookies or browser storage are used; refreshing or closing the page clears the draft.

## Develop and verify

```sh
npm ci
npm run dev
npm run typecheck
npm test
npm run build
npm run test:browser
```

The normal application entry point is `app/page.tsx`. The production page is exported to `out/`. Use a static host for that directory; `next start` does not serve a static export. All font assets are self-hosted with their open font licences under `public/fonts/`.

`test:browser` starts a temporary loopback HTTP server for `out/`, runs real Chromium checks and closes both browser and server. It uses `/usr/bin/chromium` when available; otherwise install the Playwright Chromium runtime with `npx playwright install chromium`, or supply `CHROMIUM_EXECUTABLE_PATH`. Screenshots and the report go to the ignored `work/browser-qa/` folder; set `QA_OUTPUT` to change that destination.

## Editable settings and copy

- `lib/site-config.ts`: verified contact email, booking URL, LinkedIn URL, canonical URL, submission endpoint, working service names and hero copy.
- `lib/content.ts`: FAQ answers.
- `lib/services.ts`: detail-page descriptions, scope, process, FAQs and calls to action.
- `components/landing.tsx`: service descriptions, founder background and example workflows.
- `components/reporting-example.tsx`: the illustrative, selectable reporting workflow. It does not call an AI service or process real data.
- `app/globals.css`: colour tokens, typography, responsive layouts and motion preferences.

The names follow BuildMy + X: BuildMyAI, BuildMyCareer and BuildMyTeam. They remain working names. Complete naming clearance before public publication. The page currently has `noindex, nofollow` metadata; remove that restriction in `app/layout.tsx` only when the names and public launch are ready. Configure the canonical URL at the same time.

## Enquiries: copy fallback is active

**No delivery destination was supplied. This page does not send enquiries.** The button validates the form, prepares a plain-text message and copies it using the Clipboard API. It confirms only a successful copy. A selectable message is displayed on both success and failure, with manual-copy guidance when clipboard access is unavailable. Values stay in the form after validation or delivery errors and when changing service interests. Values are kept in memory only.

Contact, booking and LinkedIn links render only when verified destinations are entered in `lib/site-config.ts`. No placeholder contacts are used.

### Activate live delivery

1. Supply a real HTTPS `enquiryEndpoint` in `lib/site-config.ts` and rebuild. Keep credentials on the server; do not put secrets in this public configuration.
2. Implement server-side validation for the six fields. Reuse the rules in `lib/enquiry.ts`; handle untrusted/missing/non-string JSON fields before invoking `validateEnquiry`. Limit request size, rate-limit submissions, constrain allowed origins and protect the delivery credentials. If the endpoint is cross-origin, configure its CORS policy for the actual website origin.
3. Accept JSON: `{ name, email, interest, description, company, links }`. The only permitted `interest` values are `ai`, `learning`, `hiring`, `developer`. A successful delivery must return JSON `{ "delivered": true }` with a 2xx response **only after the downstream delivery service confirms acceptance**. Return a non-2xx response for validation or delivery failures. The client has a 15-second timeout and retains all values on failure. It also offers copying as a fallback.
4. Add the verified business email, booking and LinkedIn destinations as available, a real canonical URL, and appropriate privacy information for the chosen delivery/storage provider. Run success, rejection and network-failure checks against the actual endpoint before activating it.

There is deliberately no fake server route and no unverified destination. The delivery contract is covered by unit tests; a configured live endpoint still requires end-to-end verification.

## Hero and navigation

The server and first browser render show X. Only the suffix changes. Automatic rotation holds each state for 3.9 seconds with a 230 ms transition, and reserves space for Career. Manual selection stops rotation and updates the relevant enquiry interest; the selection and pause preference survive client navigation through the site. Resume is explicit. Hover/focus on the selector controls or hero CTAs pauses rotation. Reduced-motion users start with rotation stopped and transitions disabled. The accessible heading remains stable.

Navigation is an ordinary mobile disclosure, not a modal: opening it focuses the first link; Escape closes it and returns focus; Tab can leave the menu naturally. Selecting a link closes it; cross-page navigation moves focus to the new main content. The header and footer are shared across all routes.
