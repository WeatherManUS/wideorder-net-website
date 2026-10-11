# Interaction Specification

## Scope

This document defines the approved interaction behavior through Phase 5C.

No interactions are implemented in Phase 3.

## Navigation Anchors

- Header navigation links target section anchors on the homepage.
- Anchor destinations should be attached to visible section wrappers, not tiny internal labels.
- If sticky header behavior is used, anchor offset must ensure headings are fully visible after scroll.
- Smooth scrolling may be used if it respects reduced-motion preferences.
- Do not add scroll-spy or active-section JavaScript solely to highlight the currently visible section in Phase 4.
- Do not use `aria-current` on ordinary section-anchor navigation unless a genuine current-state mechanism is intentionally implemented later.

## Sticky Header Behavior

- Recommended behavior: sticky after initial load, always visible, no hide-on-scroll gimmick.
- Header height should remain compact rather than animating between large and small states.
- Sticky state may add a slightly stronger background and border to maintain legibility over content.
- No bouncing, shadow-bloom, or sliding reveal effect.

## Mobile Navigation

- Menu opens from a button in the header.
- Preferred presentation: compact disclosure panel anchored beneath the header rather than a modal dialog or full-screen pattern.
- The disclosure panel stays mounted and transitions with restrained opacity plus a small vertical settle rather than appearing/disappearing abruptly.
- Menu contains:
  - section links
  - primary CTA
- Close behavior:
  - selecting a link closes the menu
  - pressing `Escape` closes the menu
  - tapping outside closes the menu if that pattern is used
- Focus behavior:
  - keyboard users can move naturally between the trigger and menu links
  - focus returns to the menu button when `Escape` explicitly closes the menu
- The panel is non-modal: do not focus-trap and do not normally lock body scrolling.
- Do not show both mobile and inline navigation at the same time.

## CTA Scrolling / Navigation

- Header CTA should move the user to the Contact section.
- Hero primary CTA should also move the user to the Contact section.
- Footer CTA-nav item should move the user to the Contact section.
- CTA labels remain as approved content and are not rewritten.

## Theme Control

- First visit respects system preference.
- Manual choice overrides system preference.
- Manual choice persists across visits.
- Manual preference is stored in `localStorage`.
- A very small pre-paint initialization script should apply `data-theme="light"` or `data-theme="dark"` on the root element before the page becomes visible when a manual preference exists.
- If no manual choice exists, omit a hard theme value and allow CSS `prefers-color-scheme` to decide first paint.
- ThemeToggle updates the root `data-theme` attribute and `localStorage` immediately.
- Theme-specific logos should be rendered in a CSS-controlled structure so only the correct approved variant is visible at first paint without server cookie knowledge.
- Theme-toggle hover and focus treatment should remain restrained, with no theatrical page-wide crossfade.

## Proof Animation

- The smallest client-side unit is `ProofResultAnimator`; `ProofSection` and `ProofStoryArticle` remain Server Components.
- Server-rendered HTML must contain the approved final Proof result text for every story.
- Hydration must not depend on artificial server-side start values and must not rely on `suppressHydrationWarning` as a workaround for Proof metrics.
- Each Proof story observes its own `.proof-story__result` panel and begins when that panel becomes approximately `45%` visible.
- Each story runs independently, once per page view, and does not replay on minor reverse scrolling.
- Reduced-motion users receive immediate final values with no counting or settle delay.
- Animated visual fragments are `aria-hidden`; a stable accessible final result remains available from first render.
- No `aria-live` announcements are used for Proof animation.
- Retail Pricing uses a restrained opacity plus vertical-settle reveal for `~20 minutes` rather than a numeric counter.
- Technology Deployment animates only the number from `1` to `16`; `up to` and `machines simultaneously` remain static.
- Remote Infrastructure & Printing keeps `~30 minutes` established, then settles in `-> 0 downtime` with the `0` counting down from `30`.
- Month-End Reporting keeps `~1,200 minutes` established, then counts the outcome down toward `~10 minutes` while reserving space to avoid meaningful layout shift.
- After animation completes, visible results remain exactly:
  - `~20 minutes`
  - `up to 16 machines simultaneously`
  - `~30 minutes -> 0 downtime`
  - `~1,200 minutes -> ~10 minutes`

## Form Focus / Validation Concept

- Fields receive clear visible focus styles.
- Validation architecture should reserve space for inline or group error messaging.
- Helper text remains attached to the relevant field.
- Phase 4 renders a non-submitting form shell only.
- Do not connect an external form service, create an API route, send email, or invent customer-facing success/error copy in Phase 4.
- Use an implementation-safe temporary non-submitting state so the prototype cannot accidentally submit to the current page.

## Reduced-Motion Behavior

- Non-essential transitions become immediate or nearly immediate.
- Hero label motion becomes static.
- Proof results show final values immediately without counting or delayed reveal.
- Smooth scroll should be disabled or reduced under `prefers-reduced-motion`.
- Theme transitions should remain subtle or become instant.

## Hover And Focus Behavior

- Links and buttons may use restrained color, underline, border, or opacity shifts.
- No large movement, bounce, or glow effects.
- Focus styles must remain distinct from hover styles.
- Proof replay on focus, if implemented, must not trap keyboard users in repeated animation loops.
- Header navigation and footer navigation may use a restrained underline/accent response.
- Buttons may use only a subtle lift and shadow response.

## Touch Behavior

- Touch targets remain comfortably sized.
- Hover-dependent content must have an equivalent always-visible or tap-accessible form.
- Decorative result panels should not require gestures to reveal core information.

## Specifically Prohibited Interaction Patterns

- scroll-jacking
- autoplay video
- parallax-heavy background motion
- constant looping decorative motion
- hidden navigation behaviors that make anchors unreliable

