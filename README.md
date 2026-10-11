# WideOrder

Public-facing WideOrder website built with Next.js, React and TypeScript.

Managed operational settings are deployed, while final live contact-mail verification remains pending.

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
- Keep `SITE_INDEXABLE=false` by default for local, preview, and the current live pre-activation environment.
- Set `SITE_INDEXABLE=true` only after explicit production-activation approval.
- Production bootstrap configuration now consists of `WIDEORDER_ADMIN_PASSWORD_HASH`, `WIDEORDER_CONFIG_ENCRYPTION_KEY`, and a MySQL connection supplied through `WIDEORDER_DATABASE_URL` or `MYSQL_*` / `DB_*` variables.
- Local review may still use a persistent SQLite file via `WIDEORDER_LOCAL_CONFIG_DB_PATH` or the default `.data/wideorder-managed-config.sqlite` path.
- The approved live recipient mailbox is `info@wideorder.net`.
- The authenticated SMTP sender mailbox for launch is `info@wideorder.net`.
- The live contact flow now uses production Turnstile plus managed SMTP settings, but final two-message inbox verification remains pending.
- Routine contact settings are managed at runtime through `/admin/settings`, including the runtime-delivered Turnstile site key.
- The administrator password becomes a persistent managed credential after initialization; the bootstrap hash remains a recovery-only input.
- Contact mail uses two separate messages: the internal enquiry is primary, and a plain-text visitor copy is secondary.
- A dedicated transactional sender mailbox may be introduced later, but it is not required for launch.
- A branded HTML visitor acknowledgement remains a future refinement and must stay separate from the internal operational enquiry.

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

- `public/brand/` - approved production logos
- `public/icons/` - generated utility favicon/app-icon assets derived from the approved `W`
- `docs/references/` - approved visual/layout references
- `docs/CONTENT.md` - approved website content source
- `docs/BRAND.md` - brand source of truth
- `docs/DESIGN_SYSTEM.md` - design-system source of truth
- `docs/REFERENCE_USAGE.md` - reference-image interpretation rules
- `docs/SECURITY.md` - dependency and security notes
- `docs/PRODUCTION_HARDENING.md` - production-hardening record
- `docs/PRIVACY_DRAFT.md` - internal draft only, not publicly published
- `docs/IMPLEMENTATION_PLAN.md` - project phases
- `docs/DEPLOYMENT.md` - deployment planning
- `src/theme/tokens.ts` - active design-token source

## Notes

- The legacy static prototype and prior GitHub Pages workflow remain archived in `docs/archive/`.
- Deployment, hosting, DNS, HSTS and final CSP remain intentionally deferred.

## Managed operational settings

- `/admin/settings` is a private operational route and is not linked from the public site.
- Managed public settings: `CONTACT_RECIPIENT_EMAIL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, and `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
- Managed secret settings: `SMTP_PASSWORD` and `TURNSTILE_SECRET_KEY`.
- Managed values take precedence over bootstrap environment defaults.
- Secret values are encrypted at rest with `WIDEORDER_CONFIG_ENCRYPTION_KEY` and are never returned to the browser after storage.
- The managed admin password is stored only as a one-way `scrypt` hash and can be rotated from `/admin/settings`.
- Password rotation invalidates active admin sessions and requires a fresh sign-in.
- Recovery is explicit: if managed admin access is lost, reset the managed admin credential using root-of-trust access to the persistent store, then sign in with the bootstrap hash and initialize a new managed password.
- A dedicated transactional sender mailbox may still be introduced later, but `info@wideorder.net` remains sufficient for launch.
