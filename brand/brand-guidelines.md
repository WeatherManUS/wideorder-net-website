# WideOrder Brand System

Version 1 · 2026-11-10 · Master identity: **Option 3 Light**. Approved dark marketing variation: **Option 3 Dark**. The two Option 1 website themes remain website alternatives, not additional social brands.

First-time website visitors see the Option 3 palette, following their system light/dark preference. Existing saved selections, including Option 1, retain priority. The four-state theme cycle is unchanged.

## Positioning and voice

WideOrder is a practical business problem-solving service, not a software product company. Preserve the approved content in `docs/CONTENT.md` and `src/content/home.ts`. The core promise is **There is a better way.** The cross-channel visual signature is **From complexity to clarity.** Use an executive, concrete voice: describe the constraint, the sensible intervention, and the supported outcome. Never invent client names, testimonials, percentages, savings, or performance claims. An email CTA is an invitation to contact, not a qualified lead.

## Identity assets

| Asset | Status and use |
| --- | --- |
| `public/brand/wideorder-logo-light.png` | Approved full horizontal logo for light backgrounds; unchanged source bytes |
| `public/brand/wideorder-logo-dark.png` | Approved full horizontal logo for dark backgrounds; unchanged source bytes |
| `brand/logos/horizontal-light.svg`, `horizontal-dark.svg` | SVG composition wrappers embedding the exact approved PNGs; **not vector-path logo masters** |
| `public/icons/wideorder-w-512.png` and existing icon sizes | Existing website icon candidates; inspection shows a cropped-looking wordmark/tagline. Do not represent these as newly approved social monograms |
| Square social avatar templates | Full approved horizontal wordmark centered on a square canvas, without clipping or recoloring |
| Stacked logo, clean monogram, original vector artwork | Not supplied. Obtain an approved original from the brand owner; do not trace, redraw, crop, recolor or manufacture a substitute |

Preserve the logo's original aspect ratio, capitalization, colors, and embedded tagline. Never detach pieces, add effects, convert it to paths, or recolor it to match a campaign. Keep at least half the rendered logo's total height clear on every side. The minimum rendered width of the complete wordmark is 160 pixels in compact marketing compositions; 320 pixels or more is recommended for standalone identity artwork and any placement where the embedded tagline must be read. Compact placements preserve the tagline but do not guarantee its legibility: check the final display size, provide the brand promise as separate readable copy when needed, and use a brand-owner-approved compact mark once one is supplied. Generated examples range from 168 pixels in the Facebook cover to 400+ pixels on large canvases; these are documented compact-format exceptions to the 320-pixel recommendation, not exceptions to the 160-pixel minimum or clear-space rule. For print, inspect at final physical size rather than assuming screen pixels translate to legibility. Existing responsive website header sizing is retained.

The supplied approved logo colors do not become indigo: the marketing environment uses indigo while the original identity remains unchanged.

## Typography

- Headlines: **Manrope**, weight 700–800, tight but readable tracking (approximately -0.035em), line-height 1.05–1.14.
- Body/captions: **Inter**, weight 400–600, line-height 1.35–1.6. Do not set long paragraphs in all caps.
- Eyebrows: Inter 600, uppercase, used sparingly.
- Numeric displays: Manrope 700, tabular numerals in browser compositions; preserve `~` and `up to` qualifiers and keep units visible.
- Website scales remain responsive. Marketing headline starting point: 60–80 px on 1200 px landscape, 70–88 px on 1080 px portrait. Body 24–40 px; thumbnail critical type should be tested at 320 px display width.
- Video title cards: 72–120 px on 1920×1080, no more than three short lines. Lower thirds: 44–54 px name/title and 24–30 px supporting identity. Captions should be 44–56 px on 1080-wide vertical video, inside the current platform UI safe area.

Official variable TTFs and SIL Open Font License 1.1 notices are distributed in `brand/typography/`. Keep the license and attribution notices when redistributing fonts or editable source packages. These are the same font families as the website. Do not sell the font files by themselves. See the complete licenses for the governing terms.

## Color roles

The source of truth is `src/theme/tokens.ts`; the generator exports `brand/design-tokens/tokens.json`. Do not independently tweak exported colors between campaigns.

| Role | Master light | Approved dark |
| --- | --- | --- |
| Canvas | `#F7F5FC` | `#17141F` |
| Surface | `#FFFFFF` | `#211C2C` |
| Main text | `#211B36` | `#F5F1FF` |
| Before / supporting text | `#6E6780` | `#B9B0C9` |
| After / primary emphasis | `#5746C7` | `#9D8CFF` |
| Interaction hover | `#4535AE` | `#B4A7FF` |
| Coral detail | `#B64048` | `#FF8585` |
| Dividers | `#DDD6EC` | `#40364F` |

Coral is a restrained accent, not a substitute for error semantics or the main CTA. Maintain at least 4.5:1 contrast for normal text and 3:1 for qualifying large text and meaningful graphics; recheck actual composites, overlays and photographs. Before/after states require visible labels and a structural separator so the distinction survives grayscale and color-vision differences. Color never carries the comparison alone.

## Graphic language

- The signature progression moves from intersecting paths, through selected aligned tracks, to a precise grid. Reuse `brand/graphic-elements/complexity-clarity-order.svg` or the generator's motif.
- Use open rules, square corners, offset columns, generous whitespace, and strong numeric hierarchy. One motif per composition is usually sufficient.
- Before panels are muted, fragmented and clearly labeled. After panels are simpler, accented, and separated by a stronger rule. Keep the original measurement context visible.
- Use solid surfaces by default. If a gradient is necessary, keep it subtle within one palette; no rainbow glows, metallic effects, generic AI brains, robots, or decorative pseudo-data.
- Icons use simple geometric strokes or the existing approved brand assets. Do not imitate the logo with a new geometric mark.
- Photography must document real work or a relevant physical process with appropriate usage rights and permission. Avoid generic meeting photos, invented client environments, and stock technology clichés.

## Composition and export

Editable SVGs preserve live text and embedded original raster logos. JSON content records and preset safe areas control new exports. The generator renders SVGs with the bundled fonts in a browser, then uses the project's existing Sharp installation for PNG, WebP and JPG. No new application dependencies are introduced.

Use `brand/export-presets/presets.json` for dimensions, roles, safe areas and formats. Presets are compositions, not automatic resizes: banner, avatar, portrait, comparison, overlay and end-screen layouts differ. `--safe-area x,y,width,height` adjusts content placement. `--show-safe` creates a review overlay only; never publish that magenta guide. Verify the current uploader's crop, UI overlays, file limits and ad placement before a final upload. Refer to `marketing/platform-requirements.md` for official source links and research limitations.

Transparent lower thirds and screen overlays export to PNG/WebP/SVG. JPG flattens transparency and is intentionally rejected for overlays. End-screen boxes reserve space for native video elements; they are not live links. The templates are graphics, not an automatically encoded or published video.

## Motion

Use 240–480 ms transitions; the default editorial reveal is 320 ms. A before/after transition should move from several paths to fewer aligned paths, with a clear state label. Prefer cuts, short fades, and 8–16 px settling movement. Never animate a result in a way that implies additional accuracy or performance. Respect reduced-motion preferences on interactive web material and provide static final frames. On video, keep labels visible long enough to read; avoid flashing, looping glows, and loud perpetual motion. Suggested demonstration timing: problem 0–3 s, working example 3–10 s, outcome 10–14 s, CTA 14–18 s; these are editable editorial timings, not claims about the case study.

## Reproducing assets

1. Read the approved content and select a real problem, insight, or case-study record.
2. Copy a JSON example from `brand/social-templates/`; change only permitted content and verify every claim.
3. Select a platform composition and run the generator. Use the master light variation by default; dark is a controlled alternative, not a separate identity.
4. Inspect headline wrapping, logo clear space, measurement units, actual thumbnail readability, contrast, safe-area crop, and file size.
5. Create the campaign URL with the repository's UTM builder, review the destination, and manually upload through an authorized account.

```powershell
# Requires Node 24, existing project dependencies, and an existing Playwright/Chromium installation.
$env:PLAYWRIGHT_MODULE_PATH = '<absolute path to the existing playwright module>'
node --experimental-strip-types scripts/render-brand-assets.mjs

# One editable portrait composition plus raster formats:
node --experimental-strip-types scripts/render-brand-assets.mjs --preset instagram-portrait --content brand/social-templates/before-after.json --formats svg,png,webp,jpg

# Standalone SVG containing its fonts, without requiring a browser:
node --experimental-strip-types scripts/render-brand-assets.mjs --preset youtube-thumbnail --formats svg --embed-fonts

# Controlled dark version and transparent video overlay:
node --experimental-strip-types scripts/render-brand-assets.mjs --preset youtube-thumbnail --variation dark
node --experimental-strip-types scripts/render-brand-assets.mjs --preset youtube-lower-third --formats svg,png,webp

# All configured platform compositions; multi-page document/carousel:
node --experimental-strip-types scripts/render-brand-assets.mjs --all-presets
node --experimental-strip-types scripts/render-brand-assets.mjs --preset instagram-carousel --carousel
```

If `playwright` resolves locally, omit `PLAYWRIGHT_MODULE_PATH`. Do not add a new dependency merely to regenerate artwork. `--output` changes the export directory; source compositions remain in `brand/examples/sources/`. Website previews are generated at `public/social/` and never require client-side rendering. Open `brand/examples/index.html` to review the reproducible asset gallery. SVG sources reference the bundled fonts relatively; install the included fonts in a design editor or use `--embed-fonts` for a portable SVG. Keep the fonts' OFL notices with the package. Run `node brand/examples/validate-assets.mjs` with the same Playwright module configuration to repeat raster-size, alpha, text-overlap, minimum-logo-size, and logo/text/canvas clear-space checks. The latest report is `brand/examples/validation.json`.

## Approval boundaries

This package does not create accounts, publish posts, activate advertising, or assert that an unofficial profile is WideOrder's. The primary marketing direction is documented for review. Supply the original editable vector identity and an approved compact/stacked mark before claiming those asset variants are complete. Platform crops and uploader acceptance remain a manual final check.
