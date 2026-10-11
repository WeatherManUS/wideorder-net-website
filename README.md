# WideOrder

Public-facing WideOrder website built with Next.js, React and TypeScript.

Phase 6 production hardening is implemented locally and awaiting user review.

## Prerequisites

- Node.js `24.12.0` validated in the current environment
- npm `11.6.2` validated in the current environment
- A currently supported Node.js release compatible with the active Next.js foundation

## Package manager

- Use `npm` for all package management in this repository.

## Installation

```bash
npm install
```

## Environment

- Copy `.env.example` to `.env.local` for local contact-form testing.
- Keep `SITE_INDEXABLE=false` by default for local and preview environments.
- Set `SITE_INDEXABLE=true` only for the intended production build/runtime.
- Contact delivery requires server-only `RESEND_API_KEY`, `CONTACT_RECIPIENT_EMAIL`, `CONTACT_FROM_EMAIL`, and `TURNSTILE_SECRET_KEY`.
- The browser Turnstile widget requires `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.

## Development

```bash
npm run dev
```

## Lint

```bash
npm run lint
```

## Typecheck

```bash
npm run typecheck
```

## Production build

```bash
npm run build
```

## Production start

```bash
npm run start
```

## Important locations

- `public/brand/` — approved production logos
- `public/icons/` — generated utility favicon/app-icon assets derived from the approved `W`
- `docs/references/` — approved visual/layout references
- `docs/CONTENT.md` — approved website content source
- `docs/BRAND.md` — brand source of truth
- `docs/DESIGN_SYSTEM.md` — design-system source of truth
- `docs/REFERENCE_USAGE.md` — reference-image interpretation rules
- `docs/SECURITY.md` — dependency and security notes
- `docs/PRODUCTION_HARDENING.md` — Phase 6 production-hardening record
- `docs/PRIVACY_DRAFT.md` — internal draft only, not publicly published
- `docs/IMPLEMENTATION_PLAN.md` — project phases
- `docs/DEPLOYMENT.md` — deployment planning
- `src/theme/tokens.ts` — active design-token source

## Notes

- The legacy static prototype and prior GitHub Pages workflow remain archived in `docs/archive/`.
- Deployment, hosting, DNS, HSTS and final CSP remain intentionally deferred.
