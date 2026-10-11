# Implementation Plan

## Phase 1 — Foundation

**Status:** Approved and complete

### Objectives

  repository foundation
  Next.js / React / TypeScript environment
  package management
  linting and typechecking
  brand asset intake
  asset fingerprinting
  project documentation
  brand documentation
  design system documentation
  design token foundation
  content source of truth scaffold
  security baseline
  deployment planning scaffold
  minimal buildable application

No final website design.

## Phase 2 — Content Recovery and Approval

**Status:** Approved and complete

### Objectives

  recover all relevant approved GreenLangton Resolve website content
  compare content against current WideOrder strategy
  preserve useful content and thinking
  replace GreenLangton Resolve identity with WideOrder Resolve where appropriate
  keep GreenLangton as parent company attribution
  verify proof metrics
  verify inSITU wording
  verify engagement model
  verify contact wording
  build the complete approved `docs/CONTENT.md`
  no substantial visual implementation until content is approved

## Phase 3 — Page and Component Architecture

**Status:** Approved and complete

### Objectives

  study approved light/dark references
  map approved content into the WideOrder layout language
  define homepage sections
  define component hierarchy
  define responsive behavior
  define theme behavior
  define animation behavior
  establish accessibility requirements
  produce detailed implementation plan before major visual coding

### Deliverables

  `docs/PAGE_ARCHITECTURE.md`
  `docs/COMPONENT_ARCHITECTURE.md`
  `docs/RESPONSIVE_BEHAVIOR.md`
  `docs/INTERACTION_SPEC.md`
  `docs/ACCESSIBILITY_SPEC.md`

### Approved architecture direction

  Keep the current Next.js app as a placeholder during Phase 3.
  Use a broad editorial homepage structure rather than a narrow central column.
  Keep the page order to: Header, Hero, The Challenge, Another Set of Eyes, How We Work, Core Principle, Philosophy / inSITU, Existing Environment, Proof, Engagement, Contact, Footer.
  Use Server Components by default.
  Reserve Client Components for `ThemeToggle`, `MobileNavigation`, and proof result animation logic.
  Maintain one shared layout across light and dark themes with static safe theme persistence via `localStorage` and a minimal pre paint script.
  Keep the mobile header architecture to `logo | theme toggle | menu button`, with nav and primary CTA inside a disclosure panel and no duplicate theme control.
  Treat Proof result animation as a Phase 5 enhancement; Phase 4 renders the approved final values statically.
  Use `Fraunces` and `Inter` as the approved Phase 4 font families.
  Preserve approved content exactly; do not rewrite it for layout convenience.

## Phase 4 — Website Implementation

**Status:** IMPLEMENTATION COMPLETE

### Objectives

  implement responsive homepage
  light/dark theme
  correct logo switching
  static safe theme persistence
  header/navigation
  required Skip to main content link
  hero
  Challenge
  How We Work
  Philosophy / inSITU
  Existing Environment parallel decision model
  Proof
  final proof values without numerical animation
  Engagement
  Contact
  non submitting contact form shell
  Footer
  reusable components
  accessibility foundation
  responsive behavior
  Next.js optimized `Fraunces` + `Inter` loading

## Phase 5 — Visual / Interaction QA

**Status:** APPROVED AND COMPLETE

### Objectives

  compare implementation directly with approved references
  desktop QA
  tablet QA
  mobile QA
  theme parity
  typography
  whitespace
  alignment
  card density
  interaction refinement
  proof animation
  reduced motion behavior
  keyboard behavior
  accessibility review
  proof animation
  final interaction polish

## Phase 6 — Production Hardening

**Status:** APPROVED AND COMPLETE

### Objectives

  SEO
  metadata
  canonical URLs
  sitemap
  robots.txt
  contact form production integration
  security review
  performance review
  asset optimization where approved
  404 behavior
  analytics decision
  production environment configuration
  final dependency audit

## Phase 7 — Deployment

**Status:** LIVE-DOMAIN PREVIEW DEPLOYED — PRODUCTION SERVICES AND FINAL ACTIVATION PENDING

### Objectives

- select/configure hosting if not already selected
- preview deployment
- validate preview
- configure `wideorder.net`
- configure `www` redirect
- HTTPS
- production deployment
- post-launch validation
- rollback documentation

### Current blocker

- Live-domain preview is working and remains intentionally crawl-blocked.
- Production contact services are still not verified end-to-end.
- Managed settings and `/admin/settings` are deployed, and the contact route uses managed Hostinger SMTP settings rather than hard-coded credentials.
- Production Turnstile is live; the browser fetches the runtime site key through `GET /api/contact-config`.
- The contact route now treats the internal enquiry as the primary SMTP delivery and a separate visitor copy as the secondary SMTP delivery.
- SMTP success now requires accepted primary delivery; secondary visitor-copy failure is logged separately and does not invalidate an accepted enquiry.
- Safe SMTP diagnostics and correlation headers now distinguish the two messages without exposing addresses, secrets, or message content.
- Live API validation for missing required fields and invalid email format remains in place, and honeypot silent discard remains in place.
- Direct inbox receipt for the internal enquiry and the visitor copy still requires a manual administrator-controlled live test.
- `www` redirect remains a later Phase 7 cutover item.

Phase 7 must not be advanced to `PRODUCTION SERVICES VERIFIED — FINAL CUTOVER PENDING` until the administrator verifies the two-message live inbox test end-to-end.
Do not begin any later phase automatically.

Each phase requires explicit approval.

### Phase 7C2 contact mail flow correction and visitor copy

**Status:** IMPLEMENTED FOR REVIEW

### Objectives

- preserve the internal enquiry as the operational contact message
- send a separate visitor acknowledgement/copy after accepted internal SMTP delivery
- treat internal delivery as primary and visitor copy as secondary
- reuse one SMTP transporter per request
- retain non-secret SMTP diagnostics and request correlation
- keep crawl blocking and deferred launch controls unchanged

### Current result

- `POST /api/contact` now creates one SMTP transporter per request and reuses it for both contact messages.
- The primary internal enquiry sends from the configured SMTP identity to the configured contact recipient with `Reply-To` set to the validated visitor email.
- The secondary visitor copy sends as a separate plain-text message to the validated visitor email with `Reply-To` set to the configured contact recipient.
- Both messages include non-secret correlation headers using the existing request id and a delivery-role marker.
- If primary delivery throws or resolves with `acceptedCount === 0`, the API returns `delivery_failed` and the browser does not show the success message.
- If the visitor copy throws or resolves with `acceptedCount === 0`, the lead remains successful and the acknowledgement failure is logged separately.
- A branded HTML visitor acknowledgement remains a future refinement and is not required for launch.

### Phase 7B3 managed settings layer

**Status:** IMPLEMENTED FOR REVIEW

### Objectives

- introduce a private `/admin/settings` operational interface
- reduce routine Hostinger environment changes to bootstrap-only concerns
- persist operational settings across restarts, rebuilds, and redeployments
- encrypt secret settings at rest
- deliver the Turnstile site key at runtime so rotation does not require a build
- keep the public website visually unchanged and non-indexable until separate approval

### Current result

- Runtime configuration now resolves with precedence `managed storage` -> `bootstrap environment`.
- Preferred production persistence is Hostinger-managed MySQL; local review falls back to a persistent SQLite file.
- SMTP credentials, Turnstile secrets, and related operational values can be rotated later without editing repository source.
- Phase 7 remains pre-deployment because live bootstrap secrets, managed database credentials, and production Turnstile keys are still pending configuration and review.

### Phase 7B4 managed settings security review and admin credential management

**Status:** IMPLEMENTED FOR REVIEW

### Objectives

- keep root-of-trust secrets isolated to Hostinger bootstrap configuration
- keep routine SMTP and Turnstile settings in managed persistent storage
- convert `WIDEORDER_ADMIN_PASSWORD_HASH` into bootstrap/recovery-only usage
- add persistent managed administrator password storage and rotation
- invalidate active sessions after password changes
- preserve the public site, crawl blocking, and deferred launch controls

### Current result

- Normal admin login now prefers the managed persistent password hash and only falls back to the bootstrap hash when no managed password has been initialized yet.
- The administrator password can be initialized or rotated from `/admin/settings` without source-code edits or redeploys.
- The managed administrator credential is stored as a one-way `scrypt` hash in persistent server-side storage.
- Password changes invalidate active admin sessions and require a fresh sign-in.
- Recovery remains explicit and root-of-trust controlled: reset the managed admin credential in the persistent store, then sign in with the bootstrap hash and initialize a new managed password.
- Phase 7 remains pre-deployment; `SITE_INDEXABLE` stays `false`, and deployment, `www` redirect, CSP, and HSTS remain deferred.

### Phase 7B5 pre-deployment managed settings corrections

**Status:** IMPLEMENTED FOR REVIEW

### Objectives

- require MySQL for production managed settings persistence with no silent SQLite fallback
- preserve SQLite for local review and development only
- strengthen new managed admin password hashes to `scrypt` `N=32768`, `r=8`, `p=3`, with an explicit `maxmem`
- preserve verification compatibility for previously encoded `scrypt` hashes
- keep `GET /api/contact-config` limited to `{ turnstileSiteKey }`
- preserve admin noindex/no-store controls and crawl blocking

### Current result

- Production runtime now errors if managed settings persistence is not backed by MySQL bootstrap configuration.
- Local review still uses the persistent SQLite store when MySQL bootstrap variables are intentionally absent.
- New managed admin password hashes include explicit work-factor parameters and an explicit memory bound.
- Existing older `scrypt` hashes without the newer encoded `maxmem` segment remain verifiable.
- `GET /api/contact-config` now returns only the runtime Turnstile site key.
- `SITE_INDEXABLE` remains `false`, SMTP delivery remains unverified from this repository session, and deployment/cutover controls remain deferred.
