# Security Baseline

## Audit checkpoint

- Date: `2026-10-10`
- Status: Phase 1 audit findings reviewed and accepted temporarily.
- Command: `npm audit`

## Affected packages

1. `eslint-config-next@16.4.0`
2. `@next/eslint-plugin-next@16.4.0`
3. `fast-glob@3.3.1`
4. `micromatch@4.0.8`
5. `braces@3.0.3`

## Scope of findings

- All five current high-severity findings are confined to development-only ESLint tooling.
- The production/runtime dependency tree is not affected by the accepted findings.
- `npm` currently proposes remediation only through an inappropriate major toolchain downgrade.
- These findings are accepted temporarily for Phase 1.
- Review them again during future dependency maintenance and before production launch.

## Security rules

- Never commit credentials or secrets.
- Environment secrets must be supplied through environment configuration rather than source control.
- Review this document before making dependency or security-tooling changes.

## Release identity checkpoint — 2026-11-10

- The lockfile/install were synchronized to the already declared `next@16.4.1`; no new npm dependency was added. This removes the prior package/lock mismatch from deployment inputs.
- `npm audit --omit=dev` after synchronization reports one existing moderate `nodemailer` advisory and no high/critical runtime findings. The historical zero-runtime-finding target above remains a target, not the current audit result; remediate the remaining mail-library finding in dependency maintenance.
- Production publication confirmation uses short-lived GitHub OIDC tokens, fixed official signing-key discovery, immutable repository/owner IDs, an exact `main` workflow identity, source/artifact binding and a public-response probe. The callback never accepts an anonymous timestamp or derives publication from application startup. Public release responses use an explicit field allowlist.

## Phase 6 hardening implementation

- Contact form protection now consists of server-side validation, Cloudflare Turnstile verification, a hidden honeypot, and controlled server-side Resend transactional delivery wiring.
- Missing contact-provider or Turnstile configuration returns a controlled runtime error instead of false success.
- Minimal operational logging avoids full message content, Turnstile tokens, and secret values.

## Baseline headers implemented

- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Cross-Origin-Opener-Policy: same-origin`

## Explicitly deferred items

- Final restrictive `Content-Security-Policy`
- `Strict-Transport-Security`
- Platform-level rate limiting for `POST /api/contact`
- Hosting/WAF-specific production hardening

## Current audit posture

- `npm audit --omit=dev` must remain `0` runtime/production vulnerabilities.
- Full `npm audit` may still show the previously accepted development-only ESLint-tooling findings until upstream packages are updated.


## Phase 7B3 managed settings controls

- `/admin/settings` is protected by a single-administrator login boundary tied to `info@wideorder.net`.
- Authentication uses a server-side session, an HTTP-only cookie, `SameSite=Strict`, secure cookies in production, session expiry, explicit logout, and conservative persistent login throttling.
- Admin POST handlers verify same-origin `Origin`/`Referer` headers before mutating state.
- Admin pages and admin API routes are marked `no-store` and `noindex`.
- Secret operational settings are encrypted at rest with AES-256-GCM using `WIDEORDER_CONFIG_ENCRYPTION_KEY`.
- Secret values are never returned to the browser after they are stored.
- Routine runtime configuration now resolves with precedence `managed storage` -> `bootstrap environment`.
- The managed Resend API key follows the same encrypted-at-rest secret-storage path and is never exposed through public config endpoints.
- Hostinger SMTP settings may remain stored temporarily for rollback/reference, but production contact delivery must fail closed rather than silently falling back from Resend.

## Phase 7B4 administrator credential boundary

- `WIDEORDER_ADMIN_PASSWORD_HASH` is no longer the normal long-term login source; it is the bootstrap and break-glass recovery credential only.
- If no managed administrator password exists, login may use the bootstrap hash and the administrator can initialize the persistent managed password through `/admin/settings`.
- Once a managed administrator password exists, normal login authenticates only against the managed hash stored in persistent server-side storage.
- The managed administrator password is stored only as a one-way `scrypt` hash and is never encrypted reversibly.
- Changing the administrator password invalidates active admin sessions and requires a fresh sign-in.
- Admin session records store only hashed session identifiers plus minimal timing and identity metadata in persistent SQLite/MySQL storage.
- Recovery is explicit and documented: use root-of-trust database access to clear/reset the managed admin credential, then sign in with the bootstrap hash and create a new managed password.
