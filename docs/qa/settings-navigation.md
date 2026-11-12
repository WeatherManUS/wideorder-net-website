# v0.4.0001 Settings navigation batch

Baseline: v0.3.0003. Scope: reorganize existing administrator controls; no new branding, authentication, recovery, database, dependency or email behavior.

## Categories

| Category | Existing controls |
| --- | --- |
| General | Signed-in account, session expiration, version/publication/build information |
| Communications | SMTP configuration, mail diagnostics, tests, inquiry search, delivery queue and retry controls |
| Branding & Appearance | Coming in a future release |
| Security & Access | Existing passkey management, recovery readiness, cutover, sessions, security events and conditional transitional-password controls |
| Marketing & Social | Coming in a future release |
| Integrations | Existing Turnstile site-key and secret replacement controls |
| Advanced | Storage/persistence information and existing configuration audit history |

Desktop navigation uses a sidebar; tablets use a wrapping grid and phones a single-column list. Navigation uses category URLs, supports browser history and works without JavaScript. Existing section hashes remain supported when JavaScript is enabled. Saves, validation errors and SMTP operations return to the originating category through an allowlisted presentation parameter. Settings service validation, sensitive-action grants, authorization and mail handling remain unchanged.

Save changes before switching categories; navigation is not an autosave or draft system.

## Validation

- 83 automated tests passed, including existing access/recovery, inquiry/SMTP and release tests, plus category normalization and redirect-context tests.
- 112 category/theme/viewport combinations passed: seven categories, all four themes, widths 320, 390, 768 and 1440 pixels. Touch, keyboard, back/forward, legacy hashes, no-JavaScript navigation, category-preserving saves/errors/search, masked secrets and separate SMTP/Turnstile submissions passed.
- Rendered desktop/mobile screenshots were reviewed. Phone navigation was adjusted after review to keep labels readable without splitting words.
- Existing inquiry/admin browser regression passed: authorization, CSRF, SMTP masking and validation, durable local capture, replay rejection, protected inquiry details and diagnostic persistence. No real email sent.
- 20 signed WebAuthn scenario groups passed, including sensitive Settings/SMTP operations after passkey-only cutover. Restricted infrastructure recovery and subsequent passkey-only login passed in an isolated local fixture.
- Production authentication was inspected read-only before deployment: passkey login visible, password form absent. No production credentials, recovery configuration or inquiry data were changed by testing.

Lint, typecheck and the production build passed. Deployment success must be established independently through the release workflow, exact commit/build, initial HTML footers and `/version.json`; these local results do not assert publication.

## Changed files

- `.github/copilot-instructions.md`, `AGENTS.md`: persist the owner's requested framework.
- `src/app/admin/settings/page.tsx`, `src/components/settings-navigation.tsx`, `src/app/globals.css`: category layout and scoped responsive styling.
- `src/lib/settings-navigation.ts`, `src/app/api/admin/settings/route.ts`, `src/app/api/admin/smtp/route.ts`, `src/app/admin/inquiries/[id]/page.tsx`: preserve category context on existing actions and return links.
- `src/lib/settings-navigation.test.mjs`, `scripts/settings-navigation-qa.mjs`: targeted category regression coverage.
- `scripts/inquiry-admin-qa.mjs`, `scripts/passkey-qa.mjs`: update existing tests to navigate to their controls' categories.
- `scripts/start-inquiry-qa.mjs`: use the same stable Webpack QA server mode as security QA.
- `release-policy.json`: declare the requested Phase 0.4 target; the established workflow allocates v0.4.0001.
- This validation record.

This batch ends at v0.4.0001. No v0.4.0002 work is included.
