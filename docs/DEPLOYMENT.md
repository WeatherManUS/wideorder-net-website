# Deployment Planning

Current indexing activation and crawler-diagnostic procedure: [Search indexing](SEARCH_INDEXING.md). The owner authorized production indexing on November 11, 2026; earlier pre-activation restrictions below are historical. The production environment change and live verification remain required. A Googlebot user-agent probe is not verified Google crawler evidence.

## Production target

- Production domain: `https://wideorder.net`
- Canonical hostname: `wideorder.net`
- Future expected behavior: `www.wideorder.net` should redirect consistently to `https://wideorder.net`
- HTTPS: required

## Current status

- Hosting provider: `Hostinger Cloud Startup`
- Live domain state: `https://wideorder.net` is attached earlier than originally planned
- Current deployment mode: live-domain preview / pre-production audit
- `SITE_INDEXABLE=false` remains mandatory until explicit production activation approval
- Production activation: has NOT occurred
- Production release: must use a build that has passed lint, typecheck, and production build checks
- Rollback: must be documented before initial production launch

## Hostinger deployment method

- Deployment source: GitHub repository `WeatherManUS/wideorder-net-website`
- Active branch: `main`
- Application type: Next.js Node.js web app
- Build command: `npm run build` (release-aware wrapper around the existing Next.js production build). Keep the traced `.release/release.json` alongside the framework artifacts (including standalone bundles). See [`../DEPLOYMENT_VERSIONING.md`](../DEPLOYMENT_VERSIONING.md) for automatic build IDs, public version/cache checks, GitHub Actions success observation, and tracked rollback.
- Preview-first intent remains in effect even though the apex domain was attached early
- The site must remain crawl-blocked and non-indexed until Phase 7 activation is explicitly approved
- Environment variables are supplied through Hostinger and must never be committed to Git
- `SITE_INDEXABLE` must remain `false` during the current live-domain preview state
- The production domain remains in pre-activation audit status despite being publicly reachable

## Security and configuration

- Secrets must not be committed.
- Environment variables must be supplied by hosting/environment configuration.
- Production activation must explicitly set `SITE_INDEXABLE=true`.
- Preview and local environments should remain `SITE_INDEXABLE=false` unless intentionally testing indexing behavior.
- Bootstrap deployment now requires `WIDEORDER_ADMIN_PASSWORD_HASH`, `WIDEORDER_CONFIG_ENCRYPTION_KEY`, and either `WIDEORDER_DATABASE_URL` or local fallback storage configuration.
- `CONTACT_RECIPIENT_EMAIL` remains approved as `info@wideorder.net`.
- `TRANSACTIONAL_FROM_EMAIL` should be set to `website@wideorder.net` for live website mail.

## Phase 6 hardening status

- SEO metadata, `robots.txt`, `sitemap.xml`, utility favicon assets, a branded `not-found` page, and baseline security headers are implemented locally.
- The Contact form now posts to `POST /api/contact` through a Next.js Route Handler using server-side validation, Cloudflare Turnstile verification, a hidden honeypot, and Resend transactional delivery wiring.
- Missing credentials/configuration produce controlled runtime errors rather than false success.

## Phase 7 deployment dependencies

- Hostinger Mail remains the business mailbox provider for `info@wideorder.net`.
- Resend is the production transactional delivery provider for website-generated contact mail.
- `website@wideorder.net` is the intended transactional From identity.
- Supply production Turnstile site/secret keys.
- Configure platform or WAF rate limiting for `POST /api/contact`.
- Finalize and test a restrictive CSP against the selected host.
- Enable HSTS only after HTTPS, domain routing, and `www` redirect behavior are confirmed.
- Configure hosting, DNS, apex/`www` redirect, and production smoke testing.
- Confirm the final legal-owner copyright line before public launch.

## Phase 7B production services review

- Verified on `2026-10-11` from this Codex session against the repository state and the live deployment where observable.
- The live site is deployed, remains intentionally crawl-blocked, and continues to require explicit activation before indexing is enabled.
- Production Turnstile is now treated as deployed and the contact form remains wired to fetch the public site key at runtime.
- Managed operational settings are deployed at `/admin/settings`; Resend delivery settings remain managed there rather than hard-coded in source.
- `info@wideorder.net` remains the monitored contact inbox.
- The approved contact-mail architecture now uses two separate transactional messages:
  - primary internal enquiry: `From` `WideOrder Website <website@wideorder.net>`, `To` the configured WideOrder contact recipient, `Reply-To` the validated visitor email
  - secondary visitor acknowledgement: `From` `WideOrder Website <website@wideorder.net>`, `To` the validated visitor email, `Reply-To` the configured WideOrder contact recipient
- The visitor copy is plain text for this phase, and a branded HTML acknowledgement remains a future refinement.
- The API now treats contact submission success as dependent on accepted primary transactional delivery only; a visitor-acknowledgement failure is logged separately and does not invalidate an accepted lead.
- Transactional delivery logging now records only safe metadata such as request correlation, provider message id, and provider status.
- Direct inbox-delivery verification for both messages remains pending manual confirmation by the administrator because this Codex session does not have mailbox access.
- `https://www.wideorder.net` redirect configuration remains a later Phase 7C cutover item and must not be changed yet.
- CSP, HSTS, and production indexing remain deferred and must not be changed yet.
- Final Phase 7C2 approval still depends on a manual live test that confirms:
  - website success only after accepted primary Resend delivery
  - internal enquiry arrival in the WideOrder inbox
  - separate visitor acknowledgement arrival in the external visitor mailbox
  - internal message `Reply-To` set to the visitor
  - visitor-copy `Reply-To` set to the WideOrder contact inbox
## Phase 1 limits

- Do not select a provider simply because it is common.
- Do not configure Vercel, Cloudflare, GitHub Pages, or another host during Phase 1.
- No DNS changes during Phase 1.



## Phase 7B3 managed settings layer

- A private runtime settings surface now exists at `/admin/settings` and remains intentionally absent from public navigation, sitemap output, and footer architecture.
- Production persistence is designed to prefer Hostinger-managed MySQL through `WIDEORDER_DATABASE_URL` or `MYSQL_*` / `DB_*` bootstrap variables.
- Local review falls back to a persistent SQLite file at `.data/wideorder-managed-config.sqlite` unless `WIDEORDER_LOCAL_CONFIG_DB_PATH` overrides it.
- Bootstrap environment configuration is now limited to administrator recovery/bootstrap, the master encryption key, and the database connection.
- Routine operational values can be updated later through `/admin/settings` without source edits or rebuilds.
- The Turnstile site key is now delivered at runtime through `GET /api/contact-config`, so key rotation does not require a new build.
- `SITE_INDEXABLE` must remain `false` until separate production activation approval.
- `/admin/settings` is deployed; continue using it for routine Resend, SMTP rollback-reference, and Turnstile updates without enabling indexing.

## Phase 7B4 managed admin credential review

- The administrator password can now be initialized and rotated from `/admin/settings` without source-code edits.
- A persistent managed password hash is stored server-side and takes precedence over `WIDEORDER_ADMIN_PASSWORD_HASH` after initialization.
- `WIDEORDER_ADMIN_PASSWORD_HASH` remains required as a bootstrap and break-glass recovery control, not as the routine login credential.
- Password rotation invalidates active administrator sessions and requires a fresh login.
- Recovery remains an explicit root-of-trust procedure: clear/reset the managed admin credential in the persistent store using Hostinger-controlled database access, then bootstrap a new managed password.
- Deployment remains blocked until the bootstrap secrets, production Turnstile keys, persistent production database configuration, Resend domain verification, and managed Resend API key configuration are in place and reviewed.

## Phase 7B5 managed settings corrections

- Production managed-settings persistence now requires MySQL bootstrap configuration and must not fall back silently to SQLite.
- Local review and development may still use `.data/wideorder-managed-config.sqlite` or `WIDEORDER_LOCAL_CONFIG_DB_PATH` when MySQL is intentionally absent.
- New persistent admin password hashes use stronger `scrypt` work factors plus an explicit memory limit, while older previously encoded hashes remain verifiable.
- `GET /api/contact-config` now exposes only `{ turnstileSiteKey }` to the browser.
- `SITE_INDEXABLE` remains `false`, and Resend transactional delivery remains pending live verification after domain setup and managed API-key configuration.

## v0.1.0004 update

The native inquiry system now uses the existing MySQL bootstrap and encryption key for durable capture and retries. `/admin/settings` supplies SMTP configuration and tests; new SMTP sender/recipient fields deliberately start blank. Production Hostinger credentials and inbox tests are administrator follow-up work. No hosting/DNS settings or indexing policy change is required. See [INQUIRY_OPERATIONS.md](INQUIRY_OPERATIONS.md) and [ROADMAP.md](ROADMAP.md). Earlier Resend-only operational notes are historical and superseded by the SMTP workflow.
