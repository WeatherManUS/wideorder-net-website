# Implementation and activation status

Delivered locally on 2026-11-10. No social account, advertisement, analytics property, dashboard, DNS setting, deployment, or production indexing change was made.

## Delivered

| Phase | Repository implementation |
| --- | --- |
| A — Brand foundation | Master Option 3 Light / approved dark variation; all four website themes retained. First visits follow the master palette and system light/dark mode; saved preferences take priority. Formal typography, semantic color, identity, geometry, statistical display, and motion rules. |
| B — Social identity | 37 export presets, five recurring content template families, platform-specific banners/avatars/posts/covers/ads, carousel/document sources, video title/outro/end-screen/lower-third/recording-overlay compositions, and transparent formats. Offline gallery and reproducible CLI renderer. Supplied logo bytes preserved. |
| C — Sharing readiness | Ten static 1200×630 PNG previews; Open Graph and X large-image cards; unique titles/descriptions/canonicals; Organization JSON-LD; four individual case-study routes with Article schema; sitemap additions; verified-only social configuration and optional Search Console HTML verification. Existing work anchors and routes retained. |
| D — Consent and tracking | Runtime configuration endpoint, master/per-provider flags, basic opt-in script loading, GPC/DNT handling, accessible preferences, withdrawal/cross-tab reload, sanitized event schema, true-success lead IDs/deduplication, UTM builder, and permitted first/last session attribution. Direct GA4/Google Ads/LinkedIn/Meta/X adapters or reviewed GTM-container ownership. |
| E — Reporting | Sourced GA4/Looker reporting setup, definitions, formulas, data provenance, cost/CRM integration requirements, and account activation checklist. No fictitious live dashboard or cross-platform totals. |
| F — Verification | Unit/workflow tests, intercepted browser tracking simulations, metadata/static-image checks, desktop/mobile checks in all themes, and source/export validation. Reports in `docs/qa/marketing/` and `brand/examples/validation.json`. |

## Outstanding owner inputs / manual work

1. **Original identity sources:** supply an approved true vector logo master, clean compact monogram and stacked variation if those variants are required. The SVG logo files are explicitly labelled wrappers around exact original PNGs, not newly drawn vector paths. The existing icon appears cropped; social avatars use the full approved wordmark rather than asserting that icon is a newly approved monogram.
2. **Accounts and profile URLs:** create/authorize accounts manually, verify their active ownership, then supply the verified URLs and public measurement IDs through configuration. None are invented or enabled. Private credentials/API tokens stay out of source and public endpoints.
3. **Vendor-side review:** configure GA4 enhanced-measurement/data-sharing/retention settings, approved GTM mappings, ad conversion definitions, and test/debug access. Optional tracking remains off until explicitly configured and consented. CAPI/server advertising relays are not installed; add them only if a concrete approved requirement arises.
4. **Privacy ownership:** approve controller/legal identity, any jurisdiction-specific disclosures, retention and processor arrangements before activation. The public page accurately describes the engineered operation without claiming universal legal certification.
5. **Platform upload checks:** inspect each actual uploader's current crops, UI overlays, limits and account permissions. Some Meta documentation required login or could not be fetched, so those presets are working compositions rather than a claim of verified upload acceptance. Current primary-source references are recorded in `platform-requirements.md`.
6. **Live reporting data:** provide authorized GA4, advertising-cost and CRM sources before activating reports for qualified inquiries, opportunities, cost per lead or revenue. Until then, reporting is a reproducible setup specification, not a connected dashboard.
7. **Existing dependency issue:** the checkout requests Next.js 16.4.1 in `package.json`, but the lockfile/installed version is 16.4.0. The installed framework emits a known-vulnerability advisory and can stop a build until its documented retry. Final builds completed on retry with the warning; synchronize and upgrade framework dependencies before production release. Dependency manifests were not altered by this task.

## Main source changes

- Brand source/export package: `brand/`, `scripts/render-brand-assets.mjs`, `public/social/`.
- Sharing: `src/config/site.ts`, `src/app/layout.tsx`, `src/app/sitemap.ts`, `src/app/our-work/[slug]/page.tsx`, `src/components/site-pages.tsx`.
- Tracking/privacy: `src/config/marketing.ts`, `src/lib/marketing/`, `src/components/marketing-runtime.tsx`, `src/app/api/marketing-config/route.ts`, `src/app/privacy/page.tsx`, `src/app/marketing.css`, `src/components/site-shell.tsx`.
- Lead boundary: `src/components/contact-form.tsx`, `src/lib/contact-request.ts`, and its workflow tests.
- First-visit master palette: root theme fallback/initializer and `src/components/theme-toggle.tsx`; saved states remain unchanged.
- Campaign utility and checks: `scripts/utm-builder.mjs`, `scripts/marketing-qa.mjs`, `scripts/visual-redesign-qa.mjs` (with isolated QA output support), `.env.example`, and `docs/CONTENT.md`.

No new application dependency is required. Existing Sharp and an existing Playwright installation are used for local exports/browser QA; Node 24 is the repository baseline. The new runtime uses native browser APIs and fails closed if optional configuration or consent storage is unavailable.
