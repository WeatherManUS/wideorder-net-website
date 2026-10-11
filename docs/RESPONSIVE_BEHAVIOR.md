# Responsive Behavior

## Breakpoint Model

- Large desktop: `>= 1440px`
- Standard desktop: `1024px - 1439px`
- Tablet: `768px - 1023px`
- Mobile: `< 768px`

These breakpoints are based on meaningful layout shifts:

- `768px` is where the page can begin supporting broader split compositions.
- `1024px` is where header, hero, proof, and engagement sections can operate in their intended side-by-side architecture.
- `1440px` is where additional whitespace can be added without widening reading lines excessively.

## Header Transformation

### Large desktop

- Full horizontal header.
- Logo left.
- Full nav centered/right.
- CTA and theme toggle always visible.
- Sticky behavior active if implemented.

### Standard desktop

- Same architecture as large desktop.
- Reduce nav spacing before reducing CTA prominence.

### Tablet

- Prefer keeping the full nav if it still fits comfortably.
- CTA may reduce horizontal padding before being moved.
- Theme toggle stays visible.

### Mobile

- Header collapses to logo + theme toggle + menu button.
- Navigation and CTA move into a controlled disclosure panel beneath the header.
- Theme toggle stays in the header; do not duplicate it inside the mobile panel.

## Navigation

- Desktop/tablet: inline anchor navigation.
- Mobile: vertically stacked anchor links inside the menu panel.
- No scroll-spy or active-section state is required for the initial implementation.

## Hero Transformation

### Large desktop

- Two-part split with generous horizontal breathing room.
- Headline and paragraph remain on the left.
- Operational-friction visual is a contained structured field on the right.

### Standard desktop

- Same split architecture with slightly tighter column ratio.
- Right visual remains contained and secondary to the headline.

### Tablet

- Copy stack remains first.
- Operational-friction visual moves below and broadens into a shorter, wider composition.
- CTA remains above the visual.

### Mobile

- Single-column stack.
- All hero copy remains visible before the visual.
- Operational-friction labels become a compact `2`-column grid or staggered stack.
- Remove subtle decorative connector lines if they reduce clarity.

## Operational-Friction Visual

- Large/standard desktop: contained panel with structured spatial composition.
- Tablet: flatter internal spacing and fewer decorative relationships.
- Mobile: purely legible label grid with no dependence on layered overlap and with the semantic list remaining intact.

## Existing Environment Layout

- Large/standard desktop: assessment appears first, with `Keep | Change | Replace | Build` shown as four parallel response paths rather than a sequential timeline.
- Tablet: preserve the one-plus-four relationship with grouped outcomes, typically as `2 x 2` beneath the assessment layer.
- Mobile: stack the assessment layer above the four equal decision outcomes without implying mandatory order between them.

## Challenge Layout

- Large/standard desktop: split intro + two-column example matrix.
- Tablet: intro above; examples may remain in two columns.
- Mobile: single-column divided list.

## How We Work Layout

- Large/standard desktop: vertical sequence with left rail and wide right content.
- Tablet: same reading order with shortened lateral distance.
- Mobile: stacked sequence blocks with Discovery callout embedded after the Discovery stage.

## inSITU Layout

- Large/standard desktop: intro split with `2 x 2` principle grid.
- Tablet: intro on top, grid below.
- Mobile: full stack, one principle per row, non-negotiable callout follows immediately.

## Proof Layout

- Large/standard desktop: alternating editorial proof blocks with large result panel and narrative column.
- Tablet: result and narrative remain paired, but stacking is allowed where line length becomes uncomfortable.
- Mobile: result block always appears before its supporting narrative for faster scanning.

## Engagement Layout

- Large/standard desktop: equal two-panel model comparison followed by a full-width explanatory callout.
- Tablet: side-by-side if panels stay balanced; otherwise stack then callout.
- Mobile: stacked models with equal treatment and clear spacing.

## Contact Form Layout

- Large/standard desktop: `2 x 2` short fields, full-width textarea, bottom row for privacy/helper text and submit button.
- Tablet: preserve `2 x 2` where comfortable; otherwise transition to a mixed stack.
- Mobile: single-column fields, full-width textarea, button below helper line.

## Typography Scaling

- Display serif scales fluidly with `clamp()`.
- Long editorial statements preserve intended line breaks only where they remain robust.
- Body text stays in a stable readable range rather than shrinking dramatically on mobile.
- Label styles retain letter spacing but reduce tracking slightly on small screens.

## Spacing Scaling

- Section spacing reduces from `128/112px` desktop scale to `88px` tablet and `64px` mobile.
- Internal component spacing reduces proportionally but not to the point of density.
- Cards/panels keep enough padding to preserve the calm, premium tone.

## Fluid CSS Strategy

- Prefer `clamp()` for type, gutter, and section spacing.
- Prefer CSS grid and flexible minmax tracks over many bespoke breakpoint overrides.
- Prefer content-driven wrapping over pixel-perfect duplication of the static reference screenshots.

