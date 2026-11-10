# WideOrder editorial redesign

Implemented against the visual redesign brief on 2026-11-09. The direction combines the existing consulting identity with oversized typography, asymmetric composition, open rules, and restrained geometric details.

## Design changes

- The approved brand promise, “There is a better way.”, becomes the homepage H1. The existing company statement and supporting copy remain immediately below it. Hero CTAs now read “Discuss a Challenge” and “Explore Our Work”, with the former retaining the direct email flow.
- A reusable SVG motif illustrates Complexity → Clarity → Order. It uses intersecting lines, simplified tracks, and aligned blocks, with a single gentle hover movement. It is independent of the approved logos.
- Numbered, staggered service columns, an asymmetric statement band, result-led case-study rows, and an editorial directory replace repetitive homepage cards. Supporting pages share the same typography, spacing, rules, and surface treatment.
- Existing result strings drive the numeric presentation. Before-and-after layouts are used only where the approved result already contains a comparison. No case-study figures, testimonials, client names, or service claims were added.
- All four palettes and the existing theme cycle/persistence remain. The light palette's small accent text is slightly darker for contrast; all palettes now supply an error-text token.
- The existing Inter and Manrope font variables are attached to the root element, fixing resolution of the root-level font tokens. Previously, defining those variables only on the body could cause the typography to fall back to a browser default.
- IntersectionObserver and the Web Animations API provide brief section reveals. Content remains visible before hydration, without JavaScript, or without observer support. Reduced-motion preferences disable the new motion, including preference changes during a reveal.
- A supporting panel on `/what-we-do` now spans the available desktop grid columns rather than being squeezed into one column.

## Modified source files

| File | Purpose |
| --- | --- |
| `src/app/editorial.css` | Shared responsive editorial design layer, loaded after the existing styles |
| `src/app/layout.tsx` | Load the layer and resolve root font variables |
| `src/components/site-pages.tsx` | Hero hierarchy, reusable motif, and result/directory layouts |
| `src/components/order-motif.tsx` | Theme-aware SVG geometry |
| `src/components/result-display.tsx` | Factual numeric and before/after presentation |
| `src/components/section-motion.tsx` | Progressive, reduced-motion-aware section reveals |
| `src/components/site-shell.tsx` | Attach shared motion behavior across public routes |
| `src/content/home.ts` | Requested homepage CTA labels and work link |
| `src/theme/tokens.ts` | Accessible accent/error text colors |
| `docs/CONTENT.md` | Record the approved hierarchy, CTA, and motif-label changes |
| `scripts/visual-redesign-qa.mjs` | Repeatable browser layout, contrast, and interaction audit |

No new application dependencies. Existing route handlers, metadata, forms, admin controls, primary navigation, theme storage, and approved binary assets are preserved. Hosting and production configuration are unchanged.

## Validation

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: completed on retry, with the existing Next.js security advisory described below.
- `node --experimental-strip-types --test src/lib/contact-mail.test.mjs src/app/api/contact/route.test.mjs`: 11 tests passed.
- Browser matrix: six public routes × four themes × two viewports (1440×1000 and 390×844), covering 48 combinations. Checked horizontal overflow, key text overflow, header overlap, one H1, font resolution, canonical metadata, and theme application.
- Additional layout checks: homepage, work, and contact at widths 320, 768, 960, 1024, 1139, 1140, and 1280 (21 combinations).
- Contrast: 64 normal-text token/background pairs met 4.5:1; primary button text also passed against default and hover backgrounds in all themes. These targeted checks do not constitute a complete accessibility certification.
- Interaction checks: four-state cycle and wraparound, reload persistence, hero destinations, case-study anchor navigation, mobile menu open/Escape/focus restoration/navigation, and retained required contact fields.
- Reduced motion: no running animations after scrolling. JavaScript-disabled checks retained the headline, case-study links, CTAs, and system-theme fallback.
- No browser page errors in the 48-case matrix.
- `git diff --check`: passed.

`audit-report.json` contains the browser assertions and contrast ratios. Full-page screenshots include all four homepage themes at desktop and mobile sizes, all supporting pages in Option 3 Light at desktop size, and contact in Option 3 Dark at mobile size. Screenshots use reduced motion for reproducible final states.

## Repeating browser QA

Start a local production server on port 3100 after building. Use an existing Playwright installation with Chromium:

```powershell
$env:PLAYWRIGHT_MODULE_PATH = '<absolute path to an existing playwright module>'
node scripts/visual-redesign-qa.mjs
```

If Playwright is already resolvable locally, omit the environment variable. `QA_BASE_URL` optionally changes the preview origin. The script overwrites only its own named screenshots and audit report.

## Existing issues and verification limits

- `package.json` requests Next.js 16.4.1, while the committed lockfile and installed package resolve to 16.4.0. The installed version emits a known-vulnerability advisory and initially stops the build; the documented retry completes with a warning. Synchronize and upgrade the framework dependencies before production release. Dependency manifests were not changed by this visual redesign.
- Live email delivery and Cloudflare Turnstile were not exercised. Existing contact-processing tests passed without sending messages. Provider configuration remains a deployment concern.
- Browser QA used Chromium; Safari/Firefox and assistive-technology testing were not performed.
