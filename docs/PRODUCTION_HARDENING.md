# WideOrder Production Hardening

## Status

- Overall status: `APPROVED AND COMPLETE`
- Pre-hardening rollback point: `e56a667` — `Phase 1-5: build and approve WideOrder website`
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
- Server-side validation, Cloudflare Turnstile verification, a hidden honeypot, and Resend delivery wiring are implemented.
- Safe baseline security headers are implemented in `next.config.ts`.
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
- Resend is wired server-side with a fixed subject and reply-to set from the validated visitor email.
- Missing required runtime configuration returns a controlled `service_unavailable` response instead of false success.
- Browser-visible responses use stable categories only and never expose provider stack traces or secrets.

## Environment variables

- `SITE_INDEXABLE=false`
- `RESEND_API_KEY=`
- `CONTACT_RECIPIENT_EMAIL=`
- `CONTACT_FROM_EMAIL=`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY=`
- `TURNSTILE_SECRET_KEY=`

## Intended production values

- `SITE_INDEXABLE=true`
- `CONTACT_RECIPIENT_EMAIL=hello@wideorder.net`
- `CONTACT_FROM_EMAIL=` approved verified `@wideorder.net` sender identity

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
  - `https://api.resend.com`
- Draft policy outline:
  - `default-src 'self'`
  - `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com`
  - `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`
  - `font-src 'self' https://fonts.gstatic.com`
  - `img-src 'self' data:`
  - `connect-src 'self' https://challenges.cloudflare.com https://api.resend.com`
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
- `hello@wideorder.net` mailbox creation
- Resend account/key
- Resend `wideorder.net` domain verification
- final `CONTACT_FROM_EMAIL` value
- Cloudflare Turnstile production keys
- platform-level rate limiting
- final CSP testing/enforcement
- HSTS after HTTPS verification
- `wideorder.net` DNS
- `www` redirect
- preview deployment QA
- production smoke testing
- legal-owner/copyright confirmation
