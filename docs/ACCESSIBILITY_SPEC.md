# Accessibility Specification

## Scope

This document defines planned accessibility safeguards for the WideOrder homepage architecture.

It does not claim final compliance. Validation still requires implementation and testing.

## Semantic Structure

- Use one page-level `h1` in the hero.
- Use logical descending headings for each major section.
- Use semantic landmarks:
  - `header`
  - `nav`
  - `main`
  - section wrappers with headings
  - `footer`

## Navigation And Keyboard Access

- Header navigation must be fully keyboard accessible.
- Mobile navigation must support open, traverse, close, and focus return by keyboard while remaining a simple non-modal disclosure pattern.
- If sticky header behavior is used, anchor navigation must account for fixed-position overlap.
- A Skip to main content link is required in Phase 4.
- The skip link must be visually hidden until focused, clearly visible on focus, and functional in both light and dark themes.
- Escape should close an open mobile disclosure panel, and focus should return sensibly to the menu button when Escape explicitly closes it.
- Mobile navigation should not require focus trapping or modal semantics.

## Focus Visibility

- All interactive controls require clear focus-visible styling.
- Focus treatment must remain visible on both light and dark themes.
- Focus should not rely only on subtle color change.

## Theme Control

- Theme toggle must expose an accessible name.
- Toggle state must be understandable to assistive technology.
- Theme change must not cause focus loss.
- The correct theme-specific logo must appear without creating duplicate or misleading alternative text.

## Lists, Sequences, And Decorative Graphics

- Challenge examples should use true list semantics.
- Hero operational-friction examples should use true list semantics.
- How We Work stages should read in a correct linear order even if visually styled as a timeline.
- Existing-environment decision logic should not depend on arrows alone and should not imply that the four response options form a mandatory sequence.
- Decorative grids, connector lines, and ambient shapes should be ignored by assistive technology.

## Proof Accessibility

- Final proof values must exist as actual text in the DOM.
- Animated counters must not be the only representation of the result.
- Phase 4 should expose the approved final values without requiring animation at all.
- Reduced-motion users must receive the final result instantly.
- Long results like `up to 16 machines simultaneously` must remain readable at zoom and narrow widths.

## Form Accessibility

- Every field needs an explicit label.
- Required vs optional state should be programmatically clear.
- Helper text and privacy/helper text should be associated where relevant.
- Recommended autocomplete attributes later:
  - `name`
  - `organization`
  - `email`
  - `tel`
- Validation messaging should be specific and connected to the relevant field.

## Contrast And Color Use

- Require WCAG AA contrast for normal customer-facing text and interactive controls.
- Decorative or non-essential borders may use subtler contrast where they do not carry information.
- Important meaning must not rely only on accent color.
- Dark theme surfaces must preserve hierarchy without flattening contrast.

## Motion And Reduced Motion

- Respect `prefers-reduced-motion` for proof animation, smooth scrolling, and subtle entrance motion.
- Any non-essential motion should become static or near-instant when reduced motion is requested.

## Touch And Pointer Accessibility

- Touch targets should remain reasonably sized, especially in header controls and CTA buttons.
- No essential content may appear only on hover.
- Form controls must remain comfortably operable at small widths.

## Zoom And Reflow

- Reading widths must remain controlled at `200%` zoom.
- No normal content section should require horizontal scrolling.
- Proof result panels and the hero should reflow cleanly under zoom and narrow viewports.

## Testing Targets For Phase 4 And 5

- keyboard-only navigation
- screen-reader smoke testing
- focus-visible review
- reduced-motion review
- color-contrast review
- zoom/reflow review

