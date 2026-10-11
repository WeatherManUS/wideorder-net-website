# Deployment Planning

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
- Preview-first intent remains in effect even though the apex domain was attached early
- The site must remain crawl-blocked and non-indexed until Phase 7 activation is explicitly approved
- Environment variables are supplied through Hostinger and must never be committed to Git
- `SITE_INDEXABLE` must remain `false` during the current live-domain preview state
- The production domain remains in pre-activation audit status despite being publicly reachable

## Security and configuration

- Secrets must not be committed.
- Environment variables must be supplied by hosting/environment configuration.
- Production must explicitly set `SITE_INDEXABLE=true`.
- Preview and local environments should remain `SITE_INDEXABLE=false` unless intentionally testing indexing behavior.
- Bootstrap deployment now requires `WIDEORDER_ADMIN_PASSWORD_HASH`, `WIDEORDER_CONFIG_ENCRYPTION_KEY`, and either `WIDEORDER_DATABASE_URL` or local fallback storage configuration.
- `CONTACT_RECIPIENT_EMAIL` is approved as `info@wideorder.net`.
- `SMTP_USER` should authenticate as `info@wideorder.net` for launch.

## Phase 6 hardening status

- SEO metadata, `robots.txt`, `sitemap.xml`, utility favicon assets, a branded `not-found` page, and baseline security headers are implemented locally.
- The Contact form now posts to `POST /api/contact` through a Next.js Route Handler using server-side validation, Cloudflare Turnstile verification, a hidden honeypot, and Hostinger SMTP delivery wiring.
- Missing credentials/configuration produce controlled runtime errors rather than false success.

## Phase 7 deployment dependencies

- The existing `info@wideorder.net` mailbox is approved for SMTP authentication, From identity, and contact receipt at launch.
- A dedicated transactional sender mailbox may be introduced later, but it is not required for launch.
- Supply production Turnstile site/secret keys.
- Configure platform or WAF rate limiting for `POST /api/contact`.
- Finalize and test a restrictive CSP against the selected host.
- Enable HSTS only after HTTPS, domain routing, and `www` redirect behavior are confirmed.
- Configure hosting, DNS, apex/`www` redirect, and production smoke testing.
- Confirm the final legal-owner copyright line before public launch.

## Phase 7B production services review

- Verified on `2026-10-11` from this Codex session against `https://wideorder.net`.
- `info@wideorder.net` SMTP mailbox status and inbox access could not be confirmed from this Codex session because no authenticated Hostinger mail access is available here.
- Public DNS for `wideorder.net` still exposes no MX records, no root TXT mail policy records, and no `_dmarc.wideorder.net` record, so public mailbox delivery should still be treated as not yet ready.
- No authenticated SMTP credentials are available in this Codex session, so SMTP authentication and delivery acceptance could not be inspected directly.
- This session has no Hostinger mailbox-management capability, so sender-mailbox existence or creation could not be verified directly.
- The intended production sender identity is `WideOrder Website <info@wideorder.net>`.
- The live homepage still exposes the Cloudflare Turnstile test site key rather than a production widget key.
- A controlled headless-browser submission through the live contact form included a non-empty Turnstile token, but the token was still the Cloudflare dummy test token and the form request returned `503 service_unavailable`.
- The repository now contains a Hostinger SMTP implementation for `POST /api/contact`, but it has not been deployed from this session because the final migration commit remains pending review.
- Because the SMTP migration has not been deployed and no authenticated mailbox access is available here, this session could not confirm SMTP delivery, inbox arrival at `info@wideorder.net`, or Reply-To behavior.
- Invalid field handling is working on the live API: missing required fields and invalid email format both return `400 validation_error` responses.
- Invalid Turnstile rejection could not be re-confirmed as a distinct live behavior because the route currently fails with `503 service_unavailable` before successful server-side verification can be exercised.
- Honeypot silent discard is still working: a filled honeypot field returns `200` with `{"ok":true}` and does not surface an end-user error.
- `SITE_INDEXABLE` remains effectively false in production behavior: the homepage still serves `noindex, nofollow` and `robots.txt` still returns `Disallow: /`.
- `https://www.wideorder.net` redirect configuration remains a later Phase 7C cutover item and should not be changed yet.
- CSP, HSTS, and production indexing remain deferred and should not be changed yet.
- Hostinger runtime logs are not accessible from this Codex session.
- Hostinger rate-limiting or WAF controls for `POST /api/contact` could not be inspected from this Codex session, so platform-level throttling remains pending review.
- The currently verified active protection layers are server-side validation, the hidden honeypot field, and Turnstile wiring with a non-production public key.
- Required user actions before final activation are:
  - confirm `info@wideorder.net` is the approved Hostinger SMTP mailbox for launch
  - set or verify Hostinger SMTP credentials for `info@wideorder.net` without exposing the password in source control
  - create a production Cloudflare Turnstile widget for `wideorder.net` and provide the production secret/site key pair
  - set or verify `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `CONTACT_RECIPIENT_EMAIL`, `TURNSTILE_SECRET_KEY`, and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in Hostinger
  - redeploy and re-run end-to-end contact testing before final production activation

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
- Do not deploy this admin/settings implementation until the bootstrap admin hash, encryption key, database connection, live SMTP password, and live Turnstile keys are configured and reviewed.

## Phase 7B4 managed admin credential review

- The administrator password can now be initialized and rotated from `/admin/settings` without source-code edits.
- A persistent managed password hash is stored server-side and takes precedence over `WIDEORDER_ADMIN_PASSWORD_HASH` after initialization.
- `WIDEORDER_ADMIN_PASSWORD_HASH` remains required as a bootstrap and break-glass recovery control, not as the routine login credential.
- Password rotation invalidates active administrator sessions and requires a fresh login.
- Recovery remains an explicit root-of-trust procedure: clear/reset the managed admin credential in the persistent store using Hostinger-controlled database access, then bootstrap a new managed password.
- Deployment remains blocked until the bootstrap secrets, production SMTP password, production Turnstile keys, and persistent production database configuration are in place and reviewed.

## Phase 7B5 managed settings corrections

- Production managed-settings persistence now requires MySQL bootstrap configuration and must not fall back silently to SQLite.
- Local review and development may still use `.data/wideorder-managed-config.sqlite` or `WIDEORDER_LOCAL_CONFIG_DB_PATH` when MySQL is intentionally absent.
- New persistent admin password hashes use stronger `scrypt` work factors plus an explicit memory limit, while older previously encoded hashes remain verifiable.
- `GET /api/contact-config` now exposes only `{ turnstileSiteKey }` to the browser.
- `SITE_INDEXABLE` remains `false`, and SMTP delivery/inbox behavior remains unverified until live credentials are deployed and tested.
