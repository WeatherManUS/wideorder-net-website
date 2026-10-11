# Deployment Planning

## Production target

- Production domain: `https://wideorder.net`
- Canonical hostname: `wideorder.net`
- Future expected behavior: `www.wideorder.net` should redirect consistently to `https://wideorder.net`
- HTTPS: required

## Current status

- Hosting provider: pending decision
- Production DNS: pending Phase 7
- Preview deployment: required before first production release
- Production release: must use a build that has passed lint, typecheck, and production build checks
- Rollback: must be documented before initial production launch

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

## Phase 1 limits

- Do not select a provider simply because it is common.
- Do not configure Vercel, Cloudflare, GitHub Pages, or another host during Phase 1.
- No DNS changes during Phase 1.
