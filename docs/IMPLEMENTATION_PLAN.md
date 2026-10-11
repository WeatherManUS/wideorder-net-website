# Implementation Plan

## Phase 1 — Foundation

**Status:** Approved and complete

### Objectives

- repository foundation
- Next.js / React / TypeScript environment
- package management
- linting and typechecking
- brand asset intake
- asset fingerprinting
- project documentation
- brand documentation
- design-system documentation
- design-token foundation
- content source-of-truth scaffold
- security baseline
- deployment planning scaffold
- minimal buildable application

No final website design.

## Phase 2 — Content Recovery and Approval

**Status:** Approved and complete

### Objectives

- recover all relevant approved GreenLangton Resolve website content
- compare content against current WideOrder strategy
- preserve useful content and thinking
- replace GreenLangton Resolve identity with WideOrder Resolve where appropriate
- keep GreenLangton as parent-company attribution
- verify proof metrics
- verify inSITU wording
- verify engagement model
- verify contact wording
- build the complete approved `docs/CONTENT.md`
- no substantial visual implementation until content is approved

## Phase 3 — Page and Component Architecture

**Status:** Approved and complete

### Objectives

- study approved light/dark references
- map approved content into the WideOrder layout language
- define homepage sections
- define component hierarchy
- define responsive behavior
- define theme behavior
- define animation behavior
- establish accessibility requirements
- produce detailed implementation plan before major visual coding

### Deliverables

- `docs/PAGE_ARCHITECTURE.md`
- `docs/COMPONENT_ARCHITECTURE.md`
- `docs/RESPONSIVE_BEHAVIOR.md`
- `docs/INTERACTION_SPEC.md`
- `docs/ACCESSIBILITY_SPEC.md`

### Approved architecture direction

- Keep the current Next.js app as a placeholder during Phase 3.
- Use a broad editorial homepage structure rather than a narrow central column.
- Keep the page order to: Header, Hero, The Challenge, Another Set of Eyes, How We Work, Core Principle, Philosophy / inSITU, Existing Environment, Proof, Engagement, Contact, Footer.
- Use Server Components by default.
- Reserve Client Components for `ThemeToggle`, `MobileNavigation`, and proof-result animation logic.
- Maintain one shared layout across light and dark themes with static-safe theme persistence via `localStorage` and a minimal pre-paint script.
- Keep the mobile header architecture to `logo | theme toggle | menu button`, with nav and primary CTA inside a disclosure panel and no duplicate theme control.
- Treat Proof result animation as a Phase 5 enhancement; Phase 4 renders the approved final values statically.
- Use `Fraunces` and `Inter` as the approved Phase 4 font families.
- Preserve approved content exactly; do not rewrite it for layout convenience.

## Phase 4 — Website Implementation

**Status:** IMPLEMENTATION COMPLETE

### Objectives

- implement responsive homepage
- light/dark theme
- correct logo switching
- static-safe theme persistence
- header/navigation
- required Skip to main content link
- hero
- Challenge
- How We Work
- Philosophy / inSITU
- Existing Environment parallel decision model
- Proof
- final proof values without numerical animation
- Engagement
- Contact
- non-submitting contact form shell
- Footer
- reusable components
- accessibility foundation
- responsive behavior
- Next.js optimized `Fraunces` + `Inter` loading

## Phase 5 — Visual / Interaction QA

**Status:** APPROVED AND COMPLETE

### Objectives

- compare implementation directly with approved references
- desktop QA
- tablet QA
- mobile QA
- theme parity
- typography
- whitespace
- alignment
- card density
- interaction refinement
- proof animation
- reduced-motion behavior
- keyboard behavior
- accessibility review
- proof animation
- final interaction polish

## Phase 6 — Production Hardening

**Status:** APPROVED AND COMPLETE

### Objectives

- SEO
- metadata
- canonical URLs
- sitemap
- robots.txt
- contact-form production integration
- security review
- performance review
- asset optimization where approved
- 404 behavior
- analytics decision
- production environment configuration
- final dependency audit

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
- A controlled browser submission on `2026-10-11` still returned `503 service_unavailable` from `POST /api/contact`.
- The live site still exposes the Cloudflare Turnstile test site key rather than a production widget key, and the browser currently receives a Turnstile dummy test token.
- Server-side Turnstile verification success, Resend delivery success, inbox arrival at `hello@wideorder.net`, and Reply-To behavior could not be confirmed because the live contact request still does not complete successfully.
- Live API validation for missing required fields and invalid email format is working, and honeypot silent discard is still working.
- `hello@wideorder.net` mailbox status could not be confirmed from this Codex session.
- `www` redirect remains a later Phase 7 cutover item.

Phase 7 must not be advanced to `PRODUCTION SERVICES VERIFIED — FINAL CUTOVER PENDING` until the live site uses a production Turnstile key and the live contact flow returns success end-to-end.

Do not begin any later phase automatically.

Each phase requires explicit approval.

