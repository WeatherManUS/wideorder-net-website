# WideOrder Homepage Page Architecture

## Purpose

This document defines the implementation-ready homepage architecture for WideOrder.

It combines:

- approved customer-facing content from `docs/CONTENT.md`
- approved brand constraints from `docs/BRAND.md`
- approved token constraints from `docs/DESIGN_SYSTEM.md`
- approved visual/layout thinking from `docs/references/wideorder-light-reference.png` and `docs/references/wideorder-dark-reference.png`

This is an architecture document only. It does not authorize final implementation work.

## Reference Principles Carried Forward

The approved WideOrder references establish the following visual principles that should carry into implementation:

- broad horizontal page compositions rather than a narrow central column
- compact header height with calm spacing and a clear right-aligned action cluster
- a two-part hero with strong left content and a contained right-side supporting visual
- generous white or dark-negative space around major sections
- restrained card density rather than card-heavy SaaS repetition
- soft corner radius, subtle borders, and quiet surface changes
- large editorial headline scale paired with clean UI typography
- clearly separated section bands with alternating surface contrast
- compact but prominent primary CTA treatment
- a page rhythm that alternates between split sections, editorial statements, and structured content blocks

## Reference Elements Not To Copy

The following reference elements are demo material and must not be copied literally:

- placeholder hero copy such as `Operational clarity for growing businesses.`
- placeholder navigation labels such as `Services`, `Solutions`, and `About`
- placeholder CTA labels such as `Get Started`, `Learn More`, `View All Services`, and `Get In Touch`
- the office/building photography itself
- the service-card content pattern as a literal template for WideOrder proof or engagement sections
- placeholder social icons and footer contact structure
- generic benefit icons and decorative stat-like stripes with no semantic purpose

## Page Width And Grid System

### Width model

- Outer gutter:
  - Large desktop: `clamp(48px, 5vw, 80px)`
  - Standard desktop: `48px`
  - Tablet: `32px`
  - Mobile: `20px`
- Primary content max width: `1360px`
- Reading-column max width for long paragraphs: `68ch`
- Wide section inner width: `min(1360px, calc(100vw - 2 * gutter))`
- Standard section inner width: `min(1240px, calc(100vw - 2 * gutter))`
- Narrow editorial width: `min(760px, 100%)`

### Grid model

- Large desktop (`>= 1440px`): `12` columns, `32px` gap
- Standard desktop (`1024px - 1439px`): `12` columns, `24px` gap
- Tablet (`768px - 1023px`): `8` columns, `20px` gap
- Mobile (`< 768px`): `4` columns, `16px` gap

### Breakpoint logic

- Mobile under `768px` keeps all sections in a single reading flow and collapses the header into a menu-trigger pattern.
- Tablet from `768px` enables wider split compositions without forcing full desktop density.
- Standard desktop from `1024px` allows the intended two-part hero, split proof blocks, and parallel engagement panels.
- Large desktop from `1440px` increases breathing room and visual span, but paragraph widths remain capped so reading comfort does not degrade.

### Spacing model

- Major section padding:
  - Large desktop: `128px`
  - Standard desktop: `112px`
  - Tablet: `88px`
  - Mobile: `64px`
- Tight editorial separators: `72px / 56px / 40px`
- Card/panel spacing:
  - desktop `24px`
  - tablet `20px`
  - mobile `16px`

## Proposed Homepage Order

1. Header
2. Hero
3. The Challenge
4. Another Set of Eyes
5. How We Work
6. Core Principle
7. Philosophy / inSITU
8. Existing Environment
9. Proof
10. Engagement
11. Contact
12. Footer

## Section Architecture

## Header

- Purpose: establish brand, section navigation, primary CTA, and theme control.
- Approved content used: logo, primary nav labels, primary CTA.
- Proposed layout: compact horizontal bar with `logo | nav | CTA | theme` on desktop.
- Visual hierarchy: logo first, nav second, CTA third, theme control last.
- Surface/background treatment: translucent or solid theme background with bottom hairline border.
- Desktop structure: `12`-column row with logo on `3`, nav on `5`, actions on `4`.
- Tablet transformation: reduce nav spacing and keep CTA visible if width allows.
- Mobile transformation: logo left; controls right with one visible theme button and one menu button; nav and CTA move into a collapsible disclosure panel beneath the header.
- Interaction: sticky header recommended with restrained shrink-free behavior; no bouncing reveal animation.
- Accessibility considerations: required Skip to main content link, anchor offset, keyboard menu access, visible focus states, and no `aria-current` requirement for ordinary section-anchor links.
- Components involved: `SiteHeader`, `PrimaryNav`, `ThemeToggle`, `MobileNavigation`, `HeaderCta`.

## Hero

- Purpose: introduce the service, establish tone, and convert curiosity into contact intent.
- Approved content used:
  - `WideOrder Resolve`
  - `There is a better way.`
  - `Stop losing time to busy work.`
  - supporting paragraph
  - approved operational-friction examples
- Proposed layout: broad two-part composition with left editorial content and right contained operational-friction visual.
- Visual hierarchy:
  - service label and brand promise above the headline
  - H1 as dominant focal point
  - supporting paragraph below
  - primary CTA beneath copy
  - supporting chip field secondary in scale
- Surface/background treatment: primary page background with no photo; hero visual sits in a restrained bordered or muted surface container.
- Desktop structure:
  - left text block on `5` columns
  - right operational-friction visual on `7` columns
  - chip field arranged on a structured internal grid, not scattered across the viewport
- Tablet transformation:
  - text remains first
  - chip field moves below the copy into a wider `2`-row composition
  - CTA stays directly below supporting paragraph
- Mobile transformation:
  - single-column stack
  - chip field becomes a tidy `2`-column or staggered stack below CTA
  - connector lines or subtle background grid simplify or disappear
- Interaction, if any: optional restrained chip fade/settle animation only, with reduced-motion fallback to static state.
- Accessibility considerations: hero operational-friction labels are meaningful supporting content and should be exposed as a semantic list while connector lines, background grids, and ambient shapes remain decorative and hidden from assistive technology.
- Components involved: `HeroSection`, `HeroContent`, `OperationalFrictionVisual`, `PrimaryCta`.

## The Challenge

- Purpose: make the challenge concrete and relatable without implying failure.
- Approved content used: opening statement, six examples, qualification paragraph.
- Proposed layout: editorial split section with statement on the left and a structured six-item list on the right, followed by the qualification beneath.
- Visual hierarchy:
  - opening statement as section focal point
  - six examples as a scan-friendly ordered block
  - qualification as a quieter but still readable conclusion
- Surface/background treatment: same base background or muted alternate surface to separate from hero.
- Desktop structure:
  - intro on `4` columns
  - six examples on `8` columns as a `2 x 3` divided list
  - qualification spans a controlled width below
- Tablet transformation: intro above; examples shift to two columns if comfortable.
- Mobile transformation: full-width stacked ordered list with dividers.
- Interaction, if any: none.
- Accessibility considerations: use a semantic ordered or unordered list and avoid relying on decorative numbering alone.
- Components involved: `ChallengeSection`, `SectionIntro`, `ChallengeList`.

## Another Set of Eyes

- Purpose: act as a positioning intermission between challenge diagnosis and process explanation.
- Approved content used: heading, supporting paragraph, two final statements.
- Proposed layout: centered editorial composition on a contrasting surface with strong whitespace and restrained accent rule/treatment.
- Visual hierarchy:
  - headline first
  - supporting paragraph second
  - final two statements larger and more emphatic below
- Surface/background treatment: muted or contrasted band to break page rhythm.
- Desktop structure: centered narrow editorial block inside a wide section.
- Tablet transformation: same composition with slightly narrower max width.
- Mobile transformation: preserve centered stacking and increase vertical spacing between the last two statements.
- Interaction, if any: none.
- Accessibility considerations: maintain proper heading order and avoid using color alone for emphasis.
- Components involved: `PositioningSection`, `PositioningStatement`.

## How We Work

- Purpose: explain the five-stage process clearly, with Discovery receiving justified emphasis.
- Approved content used: intro, five stages, Discovery paid-engagement callout, Discovery outcome list.
- Proposed layout: a vertical editorial progression with a left-side sequence rail on desktop and stacked connected stages on smaller screens.
- Visual hierarchy:
  - section intro first
  - stage sequence second
  - Discovery callout clearly elevated within the sequence
- Surface/background treatment: primary surface with selective bordered stage panels; Discovery uses a slightly stronger muted/elevated panel.
- Desktop structure:
  - narrow left rail for sequence numbers and connector line
  - wide right content column for stage titles and copy
  - Discovery expands into a larger panel with internal list structure
- Tablet transformation: retain vertical progression but reduce lateral spread; Discovery callout remains embedded.
- Mobile transformation: numbered stacked blocks with connector logic simplified to top borders or short vertical rule.
- Interaction, if any: none in Phase 3.
- Accessibility considerations: keep reading order linear and avoid requiring visual line-following to understand sequence.
- Components involved: `HowWeWorkSection`, `ProcessStage`, `DiscoveryCallout`, `StageSequence`.

## Core Principle

- Purpose: create a strong conceptual reset before the philosophy framework.
- Approved content used: the two-line principle and supporting sentence.
- Proposed layout: high-impact statement section on a contrasting full-width surface using typography, scale, whitespace, and alignment rather than imagery.
- Visual hierarchy:
  - two-line principle dominates
  - supporting sentence sits below at controlled reading width
- Surface/background treatment: full-width contrasting band, darker in light theme and slightly brighter/inkier panel in dark theme.
- Desktop structure: centered or slightly offset editorial lockup with wide margins.
- Tablet transformation: reduce headline size but keep two-line relationship.
- Mobile transformation: stack with tight controlled line breaks and generous side padding.
- Interaction, if any: none.
- Accessibility considerations: ensure the section is text-first and fully readable without decorative styling.
- Components involved: `PrincipleSection`, `PrincipleStatement`.

## Philosophy / inSITU

- Purpose: explain the inSITU philosophy and present the four-part framework.
- Approved content used: heading, explanatory paragraphs, four principles, non-negotiable statement.
- Proposed layout: split introduction plus structured framework grid, followed by a non-negotiable callout.
- Visual hierarchy:
  - `We find it inSITU.` headline first
  - explanatory paragraphs second
  - four-part framework third
  - non-negotiable callout last with deliberate emphasis
- Surface/background treatment: alternate surface with subtle panel treatment for framework items.
- Desktop structure:
  - intro copy on `5` columns
  - framework on `7` columns as `2 x 2` cards or equal editorial cells
  - callout spans full width below
- Tablet transformation: intro above, framework in `2 x 2` grid.
- Mobile transformation: stacked framework items with the non-negotiable callout directly below.
- Interaction, if any: none.
- Accessibility considerations: preserve plain-language text and avoid turning the acronym into an inaccessible graphic.
- Components involved: `InSituSection`, `InSituIntro`, `InSituPrincipleGrid`, `InSituPrinciple`, `InSituCallout`.

## Existing Environment

- Visual hierarchy:
  - opening statement first
  - explanatory copy second
  - five-part logic sequence third
  - concluding two-line principle last
  - intro split across left and right
  - five-part logic presented as aligned nodes or editorial blocks across two rows if needed
  - final statement as a broad closing lockup
- Purpose: communicate judgment, context, and decision logic about existing systems.
- Approved content used: opening line, explanatory copy, assessment plus four possible decision responses, and better-outcome statements.
- Proposed layout: editorial intro followed by a two-tier decision model with assessment first and four parallel response paths beneath it, then a concluding outcome statement.
- Visual hierarchy:
  - opening statement first
  - explanatory copy second
  - assessment / understand layer third
  - keep / change / replace / build as equal parallel outcomes fourth
  - concluding two-line principle last
- Surface/background treatment: return to primary page background or use a low-contrast band if adjacent sections are heavier.
- Desktop structure:
  - intro split across left and right
  - assessment shown first, with `Keep | Change | Replace | Build` presented as parallel options rather than sequential stages
  - final statement as a broad closing lockup
- Tablet transformation: intro stacks; assessment remains visually first and the four decision outcomes compress into a balanced `2 x 2` or equivalent grouped structure.
- Mobile transformation: assessment stacks above the four equal decision outcomes without implying a mandatory sequence between them.
- Interaction, if any: none.
- Accessibility considerations: document that the logic is a framework, not a mandatory waterfall; avoid arrow-only meaning and ensure the parallel decision model remains understandable without connector styling.
- Components involved: `ExistingEnvironmentSection`, `DecisionLogic`, `AssessmentStep`, `DecisionStep`, `OutcomeStatement`.

## Proof

- Purpose: prove the philosophy through four operational stories, with results taking visual priority.
- Approved content used: proof intro, four proof stories, challenge/better-way/result/supporting interpretation structure, approved final metrics.
- Proposed layout: four substantial editorial proof blocks with alternating composition and dedicated result panels.
- Visual hierarchy:
  - section intro first
  - result metric dominant in each story
  - challenge and better-way narrative adjacent
  - supporting interpretation below or within the narrative block
- Surface/background treatment: alternating muted and primary surfaces; result panels use the clearest contrast.
- Desktop structure:
  - each story uses a `5/7` or `6/6` split
  - result panel sits left on stories `1` and `3`, right on stories `2` and `4`
  - long result text such as `up to 16 machines simultaneously` uses multi-line lockup rather than shrinking type excessively
- Tablet transformation: result panel and narrative remain paired but stack when necessary.
- Mobile transformation: each story becomes `result panel -> challenge -> better way -> result interpretation` in a strict vertical order.
- Interaction, if any: future result animation only.
- Accessibility considerations: final values must be available as actual text, not only animated numerals.
- Components involved: `ProofSection`, `ProofStory`, `ProofResult`, `ProofNarrative`.

## Engagement

- Purpose: present the two valid commercial models without implying tiering or preference.
- Approved content used: intro, Project Engagement, Continuous Improvement, next-constraint explanation, non-forced-engagement explanation.
- Proposed layout: two parallel panels on larger screens, followed by a supporting editorial callout beneath.
- Visual hierarchy:
  - intro first
  - two models second as equal-weight panels
  - supporting callout third with strong reading prominence
- Surface/background treatment: calm elevated panels rather than pricing-card styling.
- Desktop structure: `6/6` two-panel split followed by a full-width callout block.
- Tablet transformation: two panels remain side-by-side if comfortable, else stack before the callout.
- Mobile transformation: stacked panels followed by the callout and final paragraph.
- Interaction, if any: none.
- Accessibility considerations: avoid badges like `most popular`; preserve equal semantic weight.
- Components involved: `EngagementSection`, `EngagementModel`, `ConstraintVisibilityCallout`.

## Contact

- Purpose: end the page with a low-friction, calm invitation to reach out.
- Approved content used: heading, close, form labels, helper text, example text, privacy/helper statement, submit label.
- Proposed layout: split intro and form on large screens; stacked on smaller screens.
- Visual hierarchy:
  - heading first
  - close statement second
  - form panel third
- Surface/background treatment: slightly elevated or muted form panel over a calm closing section.
- Desktop structure:
  - intro on `4` columns
  - form on `8` columns
  - form fields arranged `2 x 2` for short fields, full-width textarea below, privacy/helper line and submit row at bottom
- Tablet transformation: intro above; form remains panelized; short fields may still use two columns.
- Mobile transformation: single-column fields, full-width button, privacy/helper text directly above or beside submit row.
- Interaction, if any: Phase 4 uses a temporary non-submitting form state with focus and structure only; real submission behavior is deferred to Phase 6.
- Accessibility considerations: explicit labels, helper linkage, correct autocomplete attributes, error-space reservation, large textarea, touch targets, and an implementation-safe non-submitting form control pattern.
- Components involved: `ContactSection`, `ContactIntro`, `ContactForm`, `FormField`, `FormActions`.

## Footer

- Purpose: provide a compact brand close and anchor navigation without unapproved production contact/legal details.
- Approved content used:
  - `WideOrder`
  - `There is a better way.`
  - `A GreenLangton company`
  - optional supporting philosophy sentence
  - approved nav links
- Proposed layout: compact multi-column footer with brand block and navigation block; no giant sitemap.
- Visual hierarchy:
  - brand identity first
  - supporting philosophy second if used
  - nav links third
- Surface/background treatment: final contrasting footer band with restrained border separation.
- Desktop structure: brand block left, nav block center/right; any future legal row remains reserved but hidden until approved copy exists.
- Tablet transformation: condensed `2`-column layout.
- Mobile transformation: stacked compact groups with no social-icon filler.
- Interaction, if any: anchor navigation only.
- Accessibility considerations: maintain compact but usable touch targets and visible focus styles.
- Components involved: `SiteFooter`, `FooterBrand`, `FooterNav`.

## Theme Parity Rules

- Layout, spacing, hierarchy, and structure remain identical across themes.
- Theme changes affect color, surface depth, border contrast, logo asset, and subtle emphasis only.
- Light theme should feel warm, editorial, and airy.
- Dark theme should feel calm, deep, and polished rather than neon or high-glow.
- Theme persistence must preserve predominantly static rendering and must not depend on server-side cookie reads in the layout.
- Manual theme preference is stored in `localStorage` and applied by a very small pre-paint initialization script before the page becomes visible.
- If no manual preference exists, do not force a root theme value and allow CSS `prefers-color-scheme` behavior to determine first paint.
- Theme-aware logo rendering should use a CSS-controlled structure so the correct approved logo variant is visible on first paint without server theme knowledge.

## Light / Dark Surface Strategy

### Light theme

- Page background: `#F3F0E9`
- Primary content surfaces: `#FFFFFF`
- Muted section surfaces: `#E8E5DE`
- Primary text: `#17242D`
- Secondary text: `#4C5B64`
- Accent: `#78956F`
- Accent text/link detail: `#5B7154`
- Secondary accent: `#A9BCA3`
- Borders: `#D8D5CE`

### Dark theme

- Page background: `#17242D`
- Secondary section background: `#202F39`
- Elevated surfaces: `#253640`
- Primary text: `#F4F2ED`
- Secondary text: `#B8C2C7`
- Accent: `#8FA886`
- Secondary accent: `#6F8877`
- Borders: `#344853`

### Section surface mapping

- Header: page background with subtle border separation in both themes.
- Hero: page background; operational-friction panel on muted/elevated surface.
- The Challenge: same base as page or slightly alternated muted surface depending on implementation rhythm.
- Another Set of Eyes: clear muted band to create an intermission.
- How We Work: base surface with Discovery emphasized on an elevated or muted panel.
- Core Principle: strongest contrasting band in the page rhythm.
- inSITU: alternate surface with restrained principle cells.
- Existing Environment: return to primary page tone for clarity after inSITU.
- Proof: alternating story blocks with result panels receiving the strongest local contrast.
- Engagement: alternate band with two equal elevated panels.
- Contact: calm closing surface with the form panel slightly elevated from the surrounding section.
- Footer: compact contrasting band that closes the page without becoming a heavy visual wall.

## Typography Architecture

### Recommended direction

- Display serif for major editorial moments.
- Clean sans-serif for navigation, body, buttons, UI, and form fields.
- Letter-spaced sans treatment for section labels and metadata-like labels.

### Recommended implementation-safe families

- Primary display serif: `Fraunces`
- Primary sans-serif: `Inter`
- Label treatment: `Inter` in uppercase with restrained tracking rather than introducing a third required family

### Approved alternates if QA reveals issues later

- Alternate display serif: `Newsreader`
- Alternate sans-serif: `Source Sans 3`

### Weight guidance

- Display serif: variable range or approximately `600-700` for hero and principle moments
- Sans body: `400-500`
- Sans navigation/UI: `500-600`
- Labels: `500-600` with increased letter spacing

### Loading guidance

- Use Next.js font loading in Phase 4.
- Keep the final implementation to two active families if possible.
- Avoid excessive weight files or a third utility font unless later QA proves it necessary.
- Approved Phase 4 typography uses `Fraunces` and `Inter` as the only active families unless QA later forces an approved fallback substitution.

## Performance Notes

- Page should be predominantly static.
- Content-heavy sections remain server-rendered.
- Visual structure should avoid dependency on heavy front-end animation libraries.
- Only the smallest interactive units should hydrate.

