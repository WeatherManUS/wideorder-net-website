# Component Architecture

## Principles

- Default to Server Components.
- Use Client Components only where browser state, events, or viewport observation are required.
- Keep sections server-rendered even when they contain a small interactive child.
- Create components where there is repeated structure, semantic ownership, responsive complexity, or accessibility responsibility.

## Client Component Summary

Expected Client Components:

- `ThemeToggle`
- `MobileNavigation`
- `ProofResultAnimator`

All other proposed homepage sections should remain Server Components unless implementation constraints later prove otherwise.

## Proposed Components

## `HomePage`

- Purpose: assemble the homepage section order.
- Parent: route `src/app/page.tsx` in Phase 4.
- Important children: all top-level section components.
- Server or client: `Server`
- Props/data needs: content imported from local structured content source derived from `docs/CONTENT.md`.
- Interactive state: none.
- Accessibility responsibilities: establish correct landmark order and include the required Skip to main content entry point.
- Responsive responsibilities: none directly; delegates to child sections.
- Reusable or page-specific: `Page-specific`

## `SkipLink`

- Purpose: provide keyboard users with an immediate jump to the main content area.
- Parent: `HomePage`
- Important children: link text only.
- Server or client: `Server`
- Props/data needs: main-content target id and approved label.
- Interactive state: none.
- Accessibility responsibilities: remain visually hidden until focused, become clearly visible on focus, and move focus/navigation to the main content area.
- Responsive responsibilities: remain usable and visible in both themes without affecting normal layout flow.
- Reusable or page-specific: `Reusable site shell`

## `SiteHeader`

- Purpose: brand header with nav, CTA, and theme control.
- Parent: `HomePage`
- Important children: `BrandMark`, `PrimaryNav`, `HeaderCta`, `ThemeToggle`, `MobileNavigation`
- Server or client: `Server`
- Props/data needs: nav items and CTA label/target.
- Interactive state: none directly.
- Accessibility responsibilities: header landmark, nav labeling, sticky offset hooks.
- Responsive responsibilities: switch between desktop nav and mobile nav trigger layout.
- Reusable or page-specific: `Reusable site shell`

## `BrandMark`

- Purpose: render the correct theme-specific logo asset.
- Parent: `SiteHeader`, optionally `SiteFooter`
- Important children: none.
- Server or client: `Server`
- Props/data needs: theme-aware CSS classes/structure and priority flag for header usage.
- Interactive state: none.
- Accessibility responsibilities: appropriate alt behavior depending on context and no duplicate meaningful alternative text when both logo variants are present in the DOM.
- Responsive responsibilities: constrain rendered size without distorting aspect ratio.
- Reusable or page-specific: `Reusable`

## `PrimaryNav`

- Purpose: desktop/tablet section anchor navigation.
- Parent: `SiteHeader`
- Important children: anchor links.
- Server or client: `Server`
- Props/data needs: ordered nav items.
- Interactive state: none required in Phase 4.
- Accessibility responsibilities: nav landmark, `aria-label`, visible focus, anchor text clarity.
- Responsive responsibilities: hide below mobile breakpoint.
- Reusable or page-specific: `Reusable site shell`

## `HeaderCta`

- Purpose: expose the primary header CTA.
- Parent: `SiteHeader`
- Important children: link/button element.
- Server or client: `Server`
- Props/data needs: label and target.
- Interactive state: none.
- Accessibility responsibilities: descriptive label and visible focus.
- Responsive responsibilities: remain visible on larger screens; move into mobile menu when space is limited.
- Reusable or page-specific: `Reusable`

## `ThemeToggle`

- Purpose: allow manual light/dark selection.
- Parent: `SiteHeader`
- Important children: icon and accessible label.
- Server or client: `Client`
- Props/data needs: current root theme state, localStorage key name, and label strings.
- Interactive state: selected theme, transient pressed state.
- Accessibility responsibilities: button semantics, accessible name, state announcement if needed.
- Responsive responsibilities: desktop inline placement and mobile header-inline placement; no duplicate toggle appears inside the mobile disclosure panel.
- Reusable or page-specific: `Reusable`

## `MobileNavigation`

- Purpose: mobile menu presentation and close behavior.
- Parent: `SiteHeader`
- Important children: nav links and CTA.
- Server or client: `Client`
- Props/data needs: nav items and CTA.
- Interactive state: open/closed state, focus return target.
- Accessibility responsibilities: disclosure-button expanded/collapsed state, non-modal panel semantics, Escape close, sensible focus return when Escape explicitly closes the panel, and natural keyboard movement between trigger and links without focus trapping.
- Responsive responsibilities: active under mobile breakpoint only.
- Reusable or page-specific: `Reusable site shell`

## `HeroSection`

- Purpose: render the hero composition.
- Parent: `HomePage`
- Important children: `SectionEyebrow`, `HeroHeadline`, `HeroBody`, `PrimaryCta`, `OperationalFrictionVisual`
- Server or client: `Server`
- Props/data needs: service label, brand promise, headline, paragraph, CTA, operational example list.
- Interactive state: none.
- Accessibility responsibilities: own the page H1 and ensure the operational-friction examples remain meaningful supporting content without exposing decorative visual noise to assistive technology.
- Responsive responsibilities: manage left/right split vs stacked layout.
- Reusable or page-specific: `Page-specific`

## `OperationalFrictionVisual`

- Purpose: render the structured example-label composition used in the hero.
- Parent: `HeroSection`
- Important children: optional `OperationalLabel` items.
- Server or client: `Server`
- Props/data needs: ordered example labels.
- Interactive state: none unless a later isolated motion child is added.
- Accessibility responsibilities: expose the example labels as a semantic list while keeping connector lines, background grids, and ambient shapes hidden from assistive technology.
- Responsive responsibilities: simplify internal grid and hide connector-only decoration on small screens.
- Reusable or page-specific: `Page-specific`

## `ChallengeSection`

- Purpose: render the challenge statement, list, and qualification.
- Parent: `HomePage`
- Important children: `SectionIntro`, `ChallengeList`
- Server or client: `Server`
- Props/data needs: heading text, example items, qualification copy.
- Interactive state: none.
- Accessibility responsibilities: list semantics and logical heading association.
- Responsive responsibilities: shift from split layout to stacked list.
- Reusable or page-specific: `Page-specific`

## `ChallengeList`

- Purpose: render the six challenge examples.
- Parent: `ChallengeSection`
- Important children: list items.
- Server or client: `Server`
- Props/data needs: ordered example items.
- Interactive state: none.
- Accessibility responsibilities: ordered or unordered list semantics.
- Responsive responsibilities: grid-to-stack transformation.
- Reusable or page-specific: `Reusable within page`

## `PositioningSection`

- Purpose: render the Another Set of Eyes section.
- Parent: `HomePage`
- Important children: `PositioningStatement`
- Server or client: `Server`
- Props/data needs: heading, body, emphasized statements.
- Interactive state: none.
- Accessibility responsibilities: maintain heading order and text emphasis without semantic misuse.
- Responsive responsibilities: preserve centered editorial rhythm at all sizes.
- Reusable or page-specific: `Page-specific`

## `HowWeWorkSection`

- Purpose: render the five-stage process.
- Parent: `HomePage`
- Important children: `StageSequence`, `ProcessStage`, `DiscoveryCallout`
- Server or client: `Server`
- Props/data needs: section intro, stage list, Discovery outcome list.
- Interactive state: none.
- Accessibility responsibilities: linear reading order, clear sequence semantics.
- Responsive responsibilities: timeline-to-stack transformation.
- Reusable or page-specific: `Page-specific`

## `ProcessStage`

- Purpose: render a single stage in the How We Work sequence.
- Parent: `HowWeWorkSection`
- Important children: stage label, stage title, stage body.
- Server or client: `Server`
- Props/data needs: index, title, body, optional emphasis flag.
- Interactive state: none.
- Accessibility responsibilities: preserve meaningful order and heading relationships.
- Responsive responsibilities: support both rail-based and stacked presentations.
- Reusable or page-specific: `Reusable within page`

## `DiscoveryCallout`

- Purpose: emphasize paid Discovery and valid outcomes.
- Parent: `HowWeWorkSection`
- Important children: callout heading, explanatory copy, outcomes list.
- Server or client: `Server`
- Props/data needs: statement, explanation, outcomes.
- Interactive state: none.
- Accessibility responsibilities: present secondary list clearly.
- Responsive responsibilities: collapse from embedded panel to stacked callout.
- Reusable or page-specific: `Page-specific`

## `PrincipleSection`

- Purpose: render the core-principle statement.
- Parent: `HomePage`
- Important children: `PrincipleStatement`
- Server or client: `Server`
- Props/data needs: two principle lines and supporting sentence.
- Interactive state: none.
- Accessibility responsibilities: maintain text-only clarity.
- Responsive responsibilities: keep line breaks intentional but resilient.
- Reusable or page-specific: `Page-specific`

## `InSituSection`

- Purpose: render the inSITU introduction and framework.
- Parent: `HomePage`
- Important children: `InSituIntro`, `InSituPrincipleGrid`, `InSituCallout`
- Server or client: `Server`
- Props/data needs: intro text, four principles, non-negotiable statement.
- Interactive state: none.
- Accessibility responsibilities: ensure framework items remain plain readable text.
- Responsive responsibilities: split-to-grid-to-stack transformation.
- Reusable or page-specific: `Page-specific`

## `InSituPrinciple`

- Purpose: render one of the four framework principles.
- Parent: `InSituPrincipleGrid`
- Important children: short title and definition.
- Server or client: `Server`
- Props/data needs: name and definition.
- Interactive state: none.
- Accessibility responsibilities: ensure the heading/definition relationship is explicit.
- Responsive responsibilities: equal-height behavior on larger screens, free-height on mobile.
- Reusable or page-specific: `Reusable within page`

## `ExistingEnvironmentSection`

- Purpose: render the existing-environment explanation and decision logic.
- Parent: `HomePage`
- Important children: `DecisionLogic`, `AssessmentStep`, `DecisionStep`, `OutcomeStatement`
- Server or client: `Server`
- Props/data needs: intro copy, assessment statement, parallel decision items, and final principle lines.
- Interactive state: none.
- Accessibility responsibilities: avoid implying mandatory sequence solely through decoration and preserve the one-plus-four decision relationship in the reading order.
- Responsive responsibilities: assessment-first structure compresses gracefully without turning the four decision outcomes into a faux sequence.
- Reusable or page-specific: `Page-specific`

## `AssessmentStep`

- Purpose: render the initial assess / understand layer of the existing-environment model.
- Parent: `DecisionLogic`
- Important children: label text.
- Server or client: `Server`
- Props/data needs: assessment text and optional style role.
- Interactive state: none.
- Accessibility responsibilities: establish the first conceptual step before the four parallel decision outcomes.
- Responsive responsibilities: remain visually distinct from the parallel options at all breakpoints.
- Reusable or page-specific: `Reusable within page`

## `DecisionStep`

- Purpose: render one parallel decision outcome.
- Parent: `DecisionLogic`
- Important children: label text.
- Server or client: `Server`
- Props/data needs: step text and optional style role.
- Interactive state: none.
- Accessibility responsibilities: remain understandable without arrows or connectors and without implying that sibling items must be followed in order.
- Responsive responsibilities: support parallel row/group and stack layouts.
- Reusable or page-specific: `Reusable within page`

## `ProofSection`

- Purpose: render the proof introduction and four proof stories.
- Parent: `HomePage`
- Important children: `ProofStory`, optional `ProofResultAnimator` in Phase 5
- Server or client: `Server`
- Props/data needs: intro copy and story collection.
- Interactive state: none at section level.
- Accessibility responsibilities: keep all final values textual and perceivable.
- Responsive responsibilities: coordinate alternating layout and stacking rules.
- Reusable or page-specific: `Page-specific`

## `ProofStory`

- Purpose: render a single proof case study.
- Parent: `ProofSection`
- Important children: `ProofResult`, `ProofNarrative`
- Server or client: `Server`
- Props/data needs: title, result value, challenge, better way, interpretation.
- Interactive state: none in Phase 4; optional in Phase 5 if paired with animated result child.
- Accessibility responsibilities: heading clarity, preserve label/value meaning.
- Responsive responsibilities: alternate desktop alignment but normalize on mobile.
- Reusable or page-specific: `Reusable within page`

## `ProofResultAnimator`

- Purpose: progressively reveal proof result values when motion is enabled.
- Parent: `ProofStory`
- Important children: text value output.
- Server or client: `Client`
- Props/data needs: final formatted value, optional animated parts, and replay flags.
- Interactive state: viewport-entered state, completed state, optional replay state.
- Accessibility responsibilities: expose final values accessibly and respect reduced motion.
- Responsive responsibilities: reserve maximum width to avoid layout shift.
- Reusable or page-specific: `Reusable within proof`

Phase note: this remains a planned Phase 5 leaf Client Component and is not required for initial Phase 4 rendering, which should show the approved final proof values as plain text.

## `EngagementSection`

- Purpose: render the two engagement models and supporting explanation.
- Parent: `HomePage`
- Important children: `EngagementModel`, `ConstraintVisibilityCallout`
- Server or client: `Server`
- Props/data needs: intro copy, two models, supporting explanation.
- Interactive state: none.
- Accessibility responsibilities: preserve equal semantic weight between models.
- Responsive responsibilities: parallel panels become stacked.
- Reusable or page-specific: `Page-specific`

## `EngagementModel`

- Purpose: render one engagement model panel.
- Parent: `EngagementSection`
- Important children: title and body text.
- Server or client: `Server`
- Props/data needs: model title and description.
- Interactive state: none.
- Accessibility responsibilities: no pricing-tier semantics, no preference badge semantics.
- Responsive responsibilities: equal-height on desktop, free-height on mobile.
- Reusable or page-specific: `Reusable within page`

## `ContactSection`

- Purpose: render the contact invitation and form shell.
- Parent: `HomePage`
- Important children: `ContactIntro`, `ContactForm`
- Server or client: `Server`
- Props/data needs: heading, close, form labels and helper copy.
- Interactive state: none in Phase 3.
- Accessibility responsibilities: section heading, clear form association, space for future validation messaging.
- Responsive responsibilities: split-to-stack transformation.
- Reusable or page-specific: `Page-specific`

## `ContactForm`

- Purpose: render the visual and semantic form structure.
- Parent: `ContactSection`
- Important children: `FormField`, `FormTextarea`, `FormActions`
- Server or client: `Server`
- Props/data needs: labels, helper text, example text, privacy/helper text, submit label.
- Interactive state: non-submitting placeholder state in Phase 4 until actual submission behavior is approved in Phase 6.
- Accessibility responsibilities: labels, helper descriptions, correct autocomplete hooks, future error-region ownership, and protection against accidental submission to the current page.
- Responsive responsibilities: two-column short fields collapse to one column on small screens.
- Reusable or page-specific: `Potentially reusable`

## `SiteFooter`

- Purpose: render the restrained footer identity and navigation.
- Parent: `HomePage`
- Important children: `FooterBrand`, `FooterNav`
- Server or client: `Server`
- Props/data needs: footer identity lines, optional philosophy line, nav items.
- Interactive state: none.
- Accessibility responsibilities: footer landmark, accessible nav labels, no hidden contact/legal placeholders announced as real content.
- Responsive responsibilities: multi-column to stacked compact layout.
- Reusable or page-specific: `Reusable site shell`

## Performance-Sensitive Decisions

- Keep section content server-rendered.
- Isolate animation and menu logic to leaf client components.
- Prefer CSS transitions and small viewport observers over heavy animation libraries.
- Keep theme persistence static-safe through a minimal pre-paint script plus `localStorage`, and keep logo switching CSS-controlled rather than server-cookie-driven.

