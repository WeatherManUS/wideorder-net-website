# Design System

## Purpose

Phase 1 defines a minimal tokenized foundation without building the final website design.

## Authoritative token source

- `src/theme/tokens.ts` is the current token source of truth.
- The CSS custom properties emitted from `src/theme/tokens.ts` are the styling interface used by the application.
- Components should consume semantic CSS custom properties rather than repeat raw brand hex values.
- Any future token-architecture change must preserve one authoritative source of truth.

## Shared tokens

`src/theme/tokens.ts` currently centralizes:

- typography
- spacing
- radii
- border width
- shadow
- maximum width

## Approved semantic theme values

### Light theme

- Main background — `#F3F0E9`
- Primary surface/cards — `#FFFFFF`
- Muted surface — `#E8E5DE`
- Primary text/headings — `#17242D`
- Secondary/body text — `#4C5B64`
- Primary graphical/button accent — `#78956F`
- Small green text / labels / links — `#5B7154`
- Secondary accent — `#A9BCA3`
- Borders/dividers — `#D8D5CE`

### Dark theme

- Main background — `#17242D`
- Secondary background — `#202F39`
- Elevated/card surface — `#253640`
- Primary text/headings — `#F4F2ED`
- Secondary/body text — `#B8C2C7`
- Primary accent — `#8FA886`
- Secondary accent — `#6F8877`
- Borders/dividers — `#344853`

## Current application use

- The Phase 1 placeholder application consumes the centralized token output for background, surface, text, muted text, border, spacing, radii, and shadow.
- The approved reference mockups may inform future layout work only.
- The approved reference mockups do not authorize content extraction.
