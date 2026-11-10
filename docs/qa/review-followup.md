# v0.1.0002 review follow-up — November 10, 2026

## Observed production baseline

- Direct HTTPS requests verified v0.1.0002, artifact `9452f306-27b0-4913-9e45-eac223820270`, published `2026-11-10T20:15:30.228Z` (2:15:30 PM CST).
- All 11 public content routes agreed with `/version.json` in initial HTML metadata and footer. No mixed release was reproduced with direct requests.
- JSON GET and HEAD returned 200, `Cache-Control: no-store, max-age=0`, `CDN-Cache-Control: no-store`, `Surrogate-Control: no-store`, `Pragma: no-cache`, `Expires: 0`. Hostinger reported `x-hcdn-cache-status: DYNAMIC`.
- Public HTML carries no-store application/CDN/surrogate directives. Content routes are dynamically rendered, not statically generated. Hashed framework assets retain normal caching.
- Crawler-user-agent requests returned HTTP 403 on all 11 public routes. `robots.txt` intentionally says `Disallow: /`; its static response is revalidated. The external browsing tool also failed retrieval. These restrictions limit crawler verification; they are not evidence of a broken JSON endpoint or stale application HTML. Existing indexing and hosting settings remain unchanged.

## Changes

- Publication now checks all 11 public content routes on their normal URLs, requiring matching metadata and visible server-rendered release footers before and after publication.
- The independent release checker checks each route and CDN cache directives, reporting crawler blocks explicitly.
- Existing shared footer now also appears on administrator and not-found pages; utility footers omit the tracking-preferences control because those pages do not load optional tracking.
- Homepage headline: “Solve the problems holding your business back.” The brand promise and broad business problem-solving positioning remain.
- Featured Retail Pricing story uses the existing full-time burden, approximately 20-minute outcome, and existing-ERP narrative. Accessible Before/After buttons compare existing narratives and use consent-gated, allowlisted interaction events.
- Theme selector and approved logos remain unchanged.

## Validation and limits

- `npm run lint`, `npm run typecheck`, and `npm run build` passed for the final application changes.
- New browser checks passed eight case-study keyboard/touch combinations, the featured comparison, responsive layout, utility-page initial HTML footers, and no browser errors. The configured analytics fixture also verified the comparison event identifier and type.
- Existing production appearance audit: 11 initial-HTML footers; 20 theme/viewport combinations; mouse hover, keyboard, touch, persistence, and JavaScript-disabled footer checks passed.
- 40 Node tests passed across release ledger/concurrency, footer formatting, contact workflow/delivery, and marketing consent/event validation.
- Marketing browser audit passed eight scenario groups, 40 theme/viewport checks, and metadata/image checks for 11 routes. Provider requests and submissions were intercepted, not delivered to vendors or mailboxes.
- Live contact form is deployed and invalid submission returns HTTP 400 with field errors. Public Turnstile configuration uses the documented test site key. The user explicitly requested retaining it for now; real abuse protection and end-to-end mailbox delivery are not confirmed. No real enquiry was sent.
- Live marketing configuration is disabled with empty provider IDs. Live vendor collection cannot be certified; configured-provider behavior is covered by intercepted browser tests.
- New comparison/browser checks are in `scripts/review-followup-qa.mjs`; release and appearance checks can be rerun against production using `QA_BASE_URL`.

Publication identity is read from the durable ledger and `/version.json`; this document does not preassign a success timestamp.
