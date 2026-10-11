# WideOrder Production Hardening

## Status

- Overall status: `APPROVED AND COMPLETE`
- Pre-hardening rollback point: `e56a667` â€” `Phase 1-5: build and approve WideOrder website`
- Phase 6 implementation is approved and complete locally.
- No hosting, DNS, or deployment changes are part of this phase.

## Implemented in Phase 6B

- Production metadata is implemented in `src/app/layout.tsx`.
- Canonical URL is `https://wideorder.net`.
- Open Graph title, description, URL, and site name are implemented.
- Robots behavior is controlled by `SITE_INDEXABLE`.
- `src/app/robots.ts` and `src/app/sitemap.ts` are implemented.
- A compact `not-found` page is implemented in `src/app/not-found.tsx`.
- Utility favicon/app-icon assets derived from the approved `W` are integrated.
- The Contact form now submits to `POST /api/contact`.
- Server-side validation, Cloudflare Turnstile verification, a hidden honeypot, and Hostinger SMTP delivery wiring are implemented.
- Safe baseline security headers are implemented in `next.config.mjs`.
- No analytics or tracking scripts were added.

## Approved metadata

- Title: `WideOrder Resolve | Stop losing time to busy work.`
- Description: `WideOrder Resolve looks at the work consuming your team's time, understands why it happens, and finds a practical way to make it better.`
- Canonical: `https://wideorder.net`
- Open Graph title: `WideOrder Resolve | Stop losing time to busy work.`
- Open Graph description: `WideOrder Resolve looks at the work consuming your team's time, understands why it happens, and finds a practical way to make it better.`
- Open Graph URL: `https://wideorder.net`
- Site name: `WideOrder`

## Environment-controlled indexing

- `SITE_INDEXABLE=true` enables `index, follow` metadata and crawlable `robots.txt` output with sitemap disclosure.
- Missing, `false`, or any other value keeps the site `noindex, nofollow` and serves a blocking `robots.txt` response.
- Production must explicitly set `SITE_INDEXABLE=true`.
- Local and preview environments should remain non-indexable by default.

## Contact architecture

- Client behavior is isolated to `src/components/contact-form.tsx`.
- The homepage and broader section structure remain Server Components.
- The route handler is `src/app/api/contact/route.ts`.
- Validation covers name, company, email, phone, message, malformed JSON, and empty/whitespace message content.
- The honeypot field silently discards obvious automated fills.
- Cloudflare Turnstile is verified server-side and is not trusted client-side on its own.
- Hostinger SMTP is wired server-side with a fixed subject and reply-to set from the validated visitor email.
- Missing required runtime configuration returns a controlled `service_unavailable` response instead of false success.
- Browser-visible responses use stable categories only and never expose provider stack traces or secrets.

## Environment variables

- `SITE_INDEXABLE=false`
- `SMTP_HOST=smtp.hostinger.com`
- `SMTP_PORT=465`
- `SMTP_SECURE=true`
- `SMTP_USER=info@wideorder.net`
- `SMTP_PASSWORD=`
- `CONTACT_RECIPIENT_EMAIL=info@wideorder.net`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY=`
- `TURNSTILE_SECRET_KEY=`

## Intended production values

- `SITE_INDEXABLE=true`
- `CONTACT_RECIPIENT_EMAIL=info@wideorder.net`
- `SMTP_USER=info@wideorder.net`

## Security headers

- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Cross-Origin-Opener-Policy: same-origin`

## Proposed CSP for Phase 7 testing

- This policy is documented for later deployment testing only.
- Do not enable it blindly before hosting/platform behavior is verified.
- Candidate external origins currently required by implementation:
  - `https://fonts.googleapis.com`
  - `https://fonts.gstatic.com`
  - `https://challenges.cloudflare.com`


- Draft policy outline:
  - `default-src 'self'`
  - `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com`
  - `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`
  - `font-src 'self' https://fonts.gstatic.com`
  - `img-src 'self' data:`
  - `connect-src 'self' https://challenges.cloudflare.com`
  - `frame-src https://challenges.cloudflare.com`
  - `form-action 'self'`
  - `base-uri 'self'`
  - `frame-ancestors 'none'`

## Performance observations

- The homepage remains predominantly Server Components.
- Interactive islands remain limited to `ThemeToggle`, `MobileNavigation`, `ProofResultAnimator`, and the Contact form.
- No analytics bundle cost was introduced.
- The previous dual-image logo implementation risked downloading both theme assets; the current brand-mark treatment uses theme-aware CSS background selection to keep first-paint correctness while reducing unnecessary duplicate logo fetches.

## Accessibility observations

- Contact submission status uses a concise `aria-live` region.
- Field-level validation errors are attached to their associated controls.
- The honeypot is omitted from normal keyboard and screen-reader interaction.
- Turnstile is rendered with theme-aware behavior and remains isolated to the Contact form.
- The compact `not-found` page preserves clear keyboard navigation and a direct return path to `/`.

## Privacy draft

- `docs/PRIVACY_DRAFT.md` exists as an internal draft only.
- It is not linked from the public site and is not included in the sitemap.

## Explicit Phase 7 dependencies

- hosting provider selection/configuration
- `info@wideorder.net` SMTP mailbox access
- Hostinger SMTP credentials for `info@wideorder.net`
- `info@wideorder.net` inbox readiness
- production SMTP environment-variable configuration for launch
- Cloudflare Turnstile production keys
- platform-level rate limiting
- final CSP testing/enforcement
- HSTS after HTTPS verification
- `wideorder.net` DNS
- `www` redirect
- preview deployment QA
- production smoke testing
- legal-owner/copyright confirmation


## Phase 7B3 managed settings implementation

- A private `/admin/settings` route and supporting admin authentication flow are implemented for operational configuration review.
- The public homepage remains visually unchanged and the admin surface is not linked from public navigation or included in the sitemap.
- The contact form now obtains the Turnstile site key from `GET /api/contact-config` at runtime rather than assuming a permanent build-time public key.
- `POST /api/contact` now resolves SMTP and Turnstile configuration from managed storage first, then falls back to bootstrap environment defaults.
- SMTP sender identity remains derived from `SMTP_USER`, producing `WideOrder Website <info@wideorder.net>` for the approved launch mailbox.
- Secret settings are encrypted before persistence and audit entries record only the key/category, timestamp, and administrator identity.
- Final deployment, production indexing, `www` redirect, CSP, and HSTS remain intentionally deferred.

## Phase 7B4 managed admin credential review

- Administrator password management now supports first-run bootstrap followed by persistent server-side password rotation.
- The managed administrator credential is stored only as a one-way `scrypt` hash and is not recoverable from application storage.
- `WIDEORDER_ADMIN_PASSWORD_HASH` remains a bootstrap and break-glass recovery input only; once a managed password exists, normal login uses the managed hash.
- Administrator sessions remain server-side, durable, and hashed-at-rest in the configured SQLite/MySQL store rather than process memory.
- Password changes invalidate active sessions and force a fresh login.
- The runtime-managed SMTP and Turnstile settings remain unchanged in scope and continue to avoid rebuild/redeploy requirements for routine credential rotation.
- `SITE_INDEXABLE` remains deferred at `false`, and deployment, `www` redirect, CSP, and HSTS remain intentionally deferred.
