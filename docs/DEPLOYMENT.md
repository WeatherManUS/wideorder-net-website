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
- Contact delivery requires `RESEND_API_KEY`, `CONTACT_RECIPIENT_EMAIL`, `CONTACT_FROM_EMAIL`, `TURNSTILE_SECRET_KEY`, and `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
- `CONTACT_RECIPIENT_EMAIL` is intended to resolve to `hello@wideorder.net` before launch.
- `CONTACT_FROM_EMAIL` must use a verified sending identity once Resend/domain verification is complete.

## Phase 6 hardening status

- SEO metadata, `robots.txt`, `sitemap.xml`, utility favicon assets, a branded `not-found` page, and baseline security headers are implemented locally.
- The Contact form now posts to `POST /api/contact` through a Next.js Route Handler using server-side validation, Cloudflare Turnstile verification, a hidden honeypot, and Resend delivery wiring.
- Missing credentials/configuration produce controlled runtime errors rather than false success.

## Phase 7 deployment dependencies

- Provision the real `hello@wideorder.net` mailbox.
- Verify the sending domain and final `CONTACT_FROM_EMAIL` identity with Resend.
- Supply production Turnstile site/secret keys.
- Configure platform or WAF rate limiting for `POST /api/contact`.
- Finalize and test a restrictive CSP against the selected host.
- Enable HSTS only after HTTPS, domain routing, and `www` redirect behavior are confirmed.
- Configure hosting, DNS, apex/`www` redirect, and production smoke testing.
- Confirm the final legal-owner copyright line before public launch.

## Phase 7B production services review

- Verified on `2026-10-11` from this Codex session against `https://wideorder.net`.
- `hello@wideorder.net` mailbox status still could not be confirmed from this Codex session because no authenticated mailbox access is available here.
- Public DNS for `wideorder.net` still exposes no MX records, no root TXT mail policy records, and no `_dmarc.wideorder.net` record, so public mailbox delivery should still be treated as not yet ready.
- No authenticated Resend access is available in this Codex session, so Resend dashboard delivery status could not be inspected directly.
- Public DNS still does not expose identifiable Resend verification records, so Resend domain verification should still be treated as pending until confirmed in the Resend dashboard.
- The intended production sender identity remains `WideOrder Website <hello@wideorder.net>` once mailbox provisioning and Resend verification are complete.
- The live homepage still exposes the Cloudflare Turnstile test site key rather than a production widget key.
- A controlled headless-browser submission through the live contact form included a non-empty Turnstile token, but the token was still the Cloudflare dummy test token and the form request returned `503 service_unavailable`.
- A structurally valid direct `POST /api/contact` submission also still returns `503 service_unavailable`, so server-side Turnstile verification is still not succeeding and the live contact pipeline is not yet operational.
- Because the API never returned success, this session could not confirm successful Resend delivery, inbox arrival at `hello@wideorder.net`, or Reply-To behavior.
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
  - confirm or create `hello@wideorder.net` in Hostinger Mail
  - add `wideorder.net` in Resend, complete the provider-supplied DNS verification, and create a restricted sending API key
  - create a production Cloudflare Turnstile widget for `wideorder.net` and provide the production secret/site key pair
  - set or verify `RESEND_API_KEY`, `CONTACT_RECIPIENT_EMAIL`, `CONTACT_FROM_EMAIL`, `TURNSTILE_SECRET_KEY`, and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in Hostinger
  - redeploy and re-run end-to-end contact testing before final production activation

## Phase 1 limits

- Do not select a provider simply because it is common.
- Do not configure Vercel, Cloudflare, GitHub Pages, or another host during Phase 1.
- No DNS changes during Phase 1.

