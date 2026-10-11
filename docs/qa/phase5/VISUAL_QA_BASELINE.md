# Phase 5 Visual QA Baseline

## Executive Assessment

- Overall classification: `ACCEPTABLE`
- The implemented homepage successfully carries forward the approved WideOrder direction in composition, theme atmosphere, editorial typography, restrained palette and broad section rhythm.
- The largest remaining mismatch is the Proof section, which currently reads as a uniform card grid rather than the more editorial alternating proof-story structure approved in the architecture.
- No blocking rendering, asset, overflow or build issues were found.
- No Phase 5B refinements are implemented in this phase.

## Reference Comparison

- `ACCEPTABLE`: The current implementation matches the approved references well in overall width, calmness, typography pairing, light/dark atmosphere and broad top-to-bottom composition.
- `MEDIUM`: The page is more card-driven than the references, especially through How We Work, Proof and Engagement, which reduces some of the editorial restraint established by the approved mockups.
- `MEDIUM`: Tablet behavior remains more collapsed than the approved responsive intent because the mobile header pattern continues through `1023px`.

## Header

- `ACCEPTABLE`: Header height, logo placement, theme button treatment and primary CTA all fit the approved direction.
- `MEDIUM`: At `768px` through `1023px`, the header stays in the mobile disclosure pattern rather than taking advantage of available tablet width for the inline navigation direction described in `docs/RESPONSIVE_BEHAVIOR.md`.

## Hero

- `STRONG MATCH`: The left editorial headline plus right contained operational-friction panel closely follows the approved composition and visual restraint.
- `LOW`: The right-side friction panel is slightly more equal in visual weight with the headline than ideal, so it competes a little more than the reference direction suggests.

## The Challenge

- `ACCEPTABLE`: The split introduction plus example matrix reads clearly and preserves the intended wide composition.
- `LOW`: The repeated bordered-card treatment is a little more literal and UI-like than the quieter editorial rhythm in the references.

## Another Set of Eyes

- `STRONG MATCH`: This section successfully creates the intended visual pause, centered editorial statement and restrained hierarchy shift.

## How We Work

- `ACCEPTABLE`: The content structure is clear and Discovery receives the correct emphasis.
- `MEDIUM`: The section currently reads as a stack of similar rounded panels instead of a more varied editorial sequence with a stronger progression feel.

## Core Principle

- `STRONG MATCH`: The contrast band is strong, calm and appropriately emphatic without becoming visually loud.

## inSITU

- `ACCEPTABLE`: The intro-plus-principles composition reads well and the content remains legible in both themes.
- `LOW`: The principle cells are slightly denser and more boxed than the more effortless reference feel.

## Existing Environment

- `STRONG MATCH`: The assessment plus `Keep | Change | Replace | Build` structure communicates clearly and maintains the intended parallel-decision reading.

## Proof

- `HIGH`: This is the largest visual mismatch. The section currently renders as a consistent two-column card grid, but the approved architecture calls for alternating editorial proof blocks with stronger narrative/result contrast.
- `MEDIUM`: Because every proof item shares nearly the same surface treatment, the section feels denser and longer than necessary and loses some of the hierarchy the approved direction is aiming for.

## Engagement

- `ACCEPTABLE`: The two engagement models and concluding explanation are structured clearly and remain commercially neutral as approved.
- `LOW`: The supporting callout is visually functional but could feel slightly more separated from the two model panels.

## Contact

- `STRONG MATCH`: The section keeps the approved split composition, calm form shell and restrained CTA treatment.
- `LOW`: On smaller widths, the long headline becomes very tall, which is still valid but slightly increases perceived density before the form begins.

## Footer

- `ACCEPTABLE`: Approved footer identity and navigation are present and correctly restrained.
- `MEDIUM`: The footer currently closes the page a little too softly; the brand block, supporting philosophy copy and overall closing weight feel slightly under-emphasized relative to the rest of the page.

## Typography

- Overall classification: `ACCEPTABLE`
- `STRONG MATCH`: `Fraunces` plus `Inter` creates the intended editorial/UI pairing and works especially well in the hero, principle band and section headings.
- `MEDIUM`: Long-form body copy inside repeated cards, especially in Proof and dark theme panels, feels a little small and dense for extended scanning.

## Spacing

- Overall classification: `ACCEPTABLE`
- `STRONG MATCH`: Major section spacing and full-width composition generally follow the approved rhythm.
- `MEDIUM`: Internal spacing within repeated card sections is a little tight relative to the calm, high-maturity direction of the references.

## Light Theme

- Overall classification: `STRONG MATCH`
- `STRONG MATCH`: The warm background, quiet borders and green CTA accents align closely with the approved light reference atmosphere.

## Dark Theme

- Overall classification: `ACCEPTABLE`
- `STRONG MATCH`: The dark palette stays calm and mature rather than neon.
- `LOW`: Dense panel sections flatten slightly more in dark theme than in light theme because many adjacent surfaces share similar value ranges.

## Responsive Behavior

- `1440px` - `STRONG MATCH`: This is the strongest presentation. Composition, whitespace and hierarchy feel closest to the approved reference direction.
- `1024px` - `ACCEPTABLE`: Desktop layout still holds together cleanly and without overflow.
- `768px` - `ACCEPTABLE`: The page remains readable with no horizontal scrolling, but the header still uses the mobile disclosure pattern and the layout does not take as much advantage of tablet width as the approved responsive behavior suggests.
- `390px` - `ACCEPTABLE`: The page stacks correctly, the form remains usable and there is no horizontal overflow, but dense long-form sections become more effortful to scan.
- `MEDIUM`: Breakpoint transitions are abrupt at `1023px -> 1024px` because navigation and CTA visibility switch all at once.
- `LOW`: There is no corresponding structural shift at `767px -> 768px`, so the tablet state remains closer to mobile than the architecture intended.

## Keyboard / Accessibility

- `STRONG MATCH`: The Skip to main content link works correctly, updates the fragment to `#main-content`, and moves focus to `main`.
- `STRONG MATCH`: Focus-visible styling is clear against both light and dark backgrounds.
- `ACCEPTABLE`: In a clean production-mode browser session, the mobile navigation button opens with keyboard activation, closes on `Escape`, and returns focus to the toggle.
- `ACCEPTABLE`: The theme toggle can be focused and activated by keyboard in production mode.

## Theme Behavior

- `ACCEPTABLE`: System-theme behavior without a stored preference works as specified; in a dark-preference session, the root keeps no forced `data-theme` value while the dark palette and dark logo render correctly.
- `STRONG MATCH`: In a clean production-mode browser session, manual theme changes persist via `localStorage` and survive reloads.
- `LOW`: In the clean headless `next dev` audit session used for baseline capture, client controls were inert because the automation session hit the dev server through `127.0.0.1` while Next.js was serving HMR resources for `localhost`, which is described below. This did not reproduce in the production build.

## Reduced Motion

- `STRONG MATCH`: `prefers-reduced-motion` disables smooth scrolling by switching `scroll-behavior` to `auto`.
- `STRONG MATCH`: No proof animation is currently implemented, so reduced-motion users already receive the final proof values immediately.

## Hydration Investigation

- Classification: `TOOLING-CAUSED`
- Evidence: the previous `style="caret-color: transparent"` warning did not reproduce in a clean headless Edge session against either the dev or production output.
- Evidence: form controls render with no inline `style` attributes, no injected `caret-color: transparent` value, and no hydration warning was recorded.
- Evidence: the current source does not set inline caret-color on form fields, and the production build hydrates client controls correctly.

## Runtime / Console

- `MEDIUM`: In the clean headless Edge baseline capture against `next dev`, Turbopack HMR websocket handshake failures appeared because the automation session used `127.0.0.1` and Next.js blocked cross-origin dev-resource access from that host. In that same dev-session context, client controls such as the theme toggle and mobile menu were inert.
- `LOW`: The same interaction failure did not reproduce against `next start` on the production build, where theme persistence and mobile-menu keyboard behavior both worked as expected.
- `LOW`: No application exceptions, missing brand assets, failed page responses, or horizontal overflow issues were found in the production-mode verification pass.
- `LOW`: Source inspection confirms Server Component boundaries remain intact. Only `src/components/theme-toggle.tsx` and `src/components/mobile-navigation.tsx` are marked with `"use client"`, and `ProofResultAnimator` is still not implemented.

## Recommended Phase 5B Corrections

- `HIGH`: Rework Proof from a uniform two-column card grid into alternating editorial story/result blocks so each proof item has clearer hierarchy and the section better matches the approved architecture.
- `MEDIUM`: Introduce a more intentional tablet header state between `768px` and `1023px` so navigation makes better use of available width and the `1024px` breakpoint shift is less abrupt.
- `MEDIUM`: Reduce repeated rounded-card density across The Challenge, How We Work and Engagement by mixing in quieter editorial treatments and clearer contrast between section roles.
- `MEDIUM`: Strengthen the footer close by giving the brand block and supporting philosophy copy slightly more visual weight and spacing discipline.
- `LOW`: Increase reading comfort in dense long-form cards, especially in Proof and dark theme, through small refinements to body size, line height, contrast and internal spacing.
