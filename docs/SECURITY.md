# Security Baseline

## Restricted Hostinger recovery update

The owner approved optional hardware keys and explicitly enabled, time-limited Hostinger recovery. Two tested credentials in independent recovery groups remain required. `WIDEORDER_ADMIN_RECOVERY` plus the temporarily restored bootstrap hash permits password verification for restricted replacement enrollment only. The hash alone does not restore password login. See [the recovery runbook](PASSKEY_SECURITY.md) for the exact setup, time limits, cleanup, and hosting-MFA requirement. No recovery setting is enabled by this deployment.

## Phase 0.3 authentication checkpoint

The [passkey architecture and recovery runbook](PASSKEY_SECURITY.md) supersedes historical password-reset guidance after passkey cutover. Never restore password authentication or a pre-cutover database to recover access. The owner confirms both authenticator tests passed and both temporary Hostinger recovery variables are absent. The origin-port correction is deployed in commit `4f21d47b1c2b`; publication is independently verified as v0.4.0001, and the closeout review records remaining administrative-status verification. Initial transitional deployment descriptions below are historical, not current recovery instructions.

WebAuthn uses pinned `@simplewebauthn/server@14.1.0` and `@simplewebauthn/browser@14.0.0`. The November 11, 2026 production dependency audit (`npm audit --omit=dev`) reported zero vulnerabilities. Historical findings below describe earlier checkpoints.

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

### Durable release policy — 2026-11-10

- Policy-managed builds read the public, allowlisted release-history ledger for version and publication metadata. They reject the legacy publication callback, so an ephemeral local marker cannot override the durable counter.
- The trusted main-branch publication workflow uses its short-lived repository `GITHUB_TOKEN` with `contents: write` solely to append Git commits on `release-history`; it does not persist credentials in checkout or pass tokens to the website. No npm dependency is required by the workflow scripts. Git ref updates require fast-forward and never use force.
- Runtime ledger reads use a fixed public GitHub repository/branch, bounded timeouts, validated public fields and immutable artifact bindings. No write credential is needed in Hostinger. Public history intentionally includes release Git commits/build IDs and no private deployment configuration.

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

Historical pre-passkey behavior only. The password-reset procedure in this section must not be used after cutover; follow PASSKEY_SECURITY.md instead.

- `WIDEORDER_ADMIN_PASSWORD_HASH` is no longer the normal long-term login source; it is the bootstrap and break-glass recovery credential only.
- If no managed administrator password exists, login may use the bootstrap hash and the administrator can initialize the persistent managed password through `/admin/settings`.
- Once a managed administrator password exists, normal login authenticates only against the managed hash stored in persistent server-side storage.
- The managed administrator password is stored only as a one-way `scrypt` hash and is never encrypted reversibly.
- Changing the administrator password invalidates active admin sessions and requires a fresh sign-in.
- Admin session records store only hashed session identifiers plus minimal timing and identity metadata in persistent SQLite/MySQL storage.
- Recovery is explicit and documented: use root-of-trust database access to clear/reset the managed admin credential, then sign in with the bootstrap hash and create a new managed password.

## v0.1.0004 inquiry and SMTP foundation

- The native inquiry workflow supersedes the earlier Resend-only requirement. Resend reference code/settings remain dormant; active submissions use encrypted durable MySQL capture and configured SMTP only.
- Nodemailer updated to 10.1.4 or later to fix the address-parser advisories. `npm audit --omit=dev` reports zero runtime vulnerabilities at this checkpoint; full development audit findings remain separate.
- SMTP usernames and passwords are secret fields, encrypted at rest and never returned by Settings. Previously public managed SMTP usernames migrate to encrypted storage on read. Blank fields retain existing secrets.
- SMTP requires certificate-validated TLS, a server-controlled hostname allowlist, public-IP checks and DNS pinning. Tests require authentication, origin validation and persistent limits, and send only to the configured recipient.
- Inquiry data is encrypted before persistence; queue leases prevent concurrent sends. Unknown delivery outcomes are quarantined. Provider errors, credentials and inquiry bodies are never written to logs by the new workflow.
- Details and operational limits: [INQUIRY_OPERATIONS.md](INQUIRY_OPERATIONS.md).
