# Brand and marketing QA

Date: 2026-11-10. Validation uses the local production build. All vendor SDK requests and form submissions in the marketing test are intercepted: no real test events or messages are sent.

## Checks

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: completed on retry; existing installed Next.js security advisory remains (see `marketing/implementation-status.md`).
- Unit/workflow command below: 20 tests passed, covering contact delivery behavior, true-success conversion IDs, consent parsing/expiration/signals, event privacy boundaries, UTM conflicts and fragments, safe tag URLs, public ID flags, verified social configuration, extension events, and GA4 campaign field mapping.
- `marketing-qa.mjs`: eight scenario groups; zero pre-consent/rejected SDK loads; category separation; GPC/DNT; first/last session labels; one conversion for repeated response IDs; no conversion for generic discarded success; no form content in SDK queues; withdrawal and cross-tab reload; keyboard focus containment and inert background; GTM/direct transport separation; master/system/saved-theme behavior.
- Sharing checks: 11 public routes with unique titles/canonicals, Open Graph dimensions/alt text, X large-image cards, Organization data, and Article data on the four case-study pages. Each referenced static PNG was fetched without client rendering and measured at 1200×630.
- New pages: privacy and four case-study routes × four themes × desktop/mobile = 40 layout checks.
- Existing public pages: six routes × four themes × desktop/mobile = 48 checks, plus 21 boundary checks at widths 320, 768, 960, 1024, 1139, 1140 and 1280. Header overlap, key text overflow, theme persistence, navigation and contact fields remain covered.
- Contrast: 64 normal-text palette/background pairs and primary-button default/hover pairs passed the targeted thresholds. This is not a complete accessibility certification.
- Asset validation: 49 primary compositions plus three dark variations, 119 raster dimension/alpha checks, 52 logo/text/canvas clear-space checks, four exact case-result/qualifier checks, and 10 static previews. Reusable sources, dark examples and transparent overlays were inspected; details in `brand/examples/validation.json`.
- `git diff --check`: passed. Approved production logo files are unchanged.

`marketing-audit.json` records metadata, theme layouts, simulated SDK requests and scenario assertions. `visual/audit-report.json` records existing-page layout/contrast checks. Screenshots were regenerated against production output with reduced motion; existing historical QA artifacts are retained in their original directories.

## Reproduce

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
node --experimental-strip-types --test src/lib/marketing/marketing.test.mjs src/lib/contact-mail.test.mjs src/app/api/contact/route.test.mjs

# Start the built app in a separate terminal:
npm.cmd run start -- --port 3102

# Existing Playwright/Chromium installation; no new app dependency:
$env:PLAYWRIGHT_MODULE_PATH = '<absolute path to the existing playwright module>'
$env:QA_BASE_URL = 'http://localhost:3102'
node scripts/marketing-qa.mjs
$env:QA_OUTPUT_DIRECTORY = '../docs/qa/marketing/visual/'
node scripts/visual-redesign-qa.mjs
```

The marketing audit uses the real default-off endpoint for metadata/layout checks and local fake-ID configuration for network-gating tests. Vendor SDK files are stubbed, so the audit proves application dispatch and gating rather than account-side vendor receipt. Live provider debug validation, email/Turnstile delivery, platform upload previews, Safari/Firefox, and assistive-technology testing remain manual checks. No credentials, account permissions or real data are presumed available.
