# WideOrder Repository Guidance

## Scope

These instructions apply to the entire repository.

## Project baseline

- This repo uses `npm`.
- The active app is a Next.js App Router project in `src/`.
- Use TypeScript for new application code.
- Preserve approved binary assets exactly as supplied.
- Review `docs/SECURITY.md` before making dependency or security-tooling changes.

## Approved assets

- Production logos:
  - `public/brand/wideorder-logo-light.png`
  - `public/brand/wideorder-logo-dark.png`
- Visual references only:
  - `docs/references/wideorder-light-reference.png`
  - `docs/references/wideorder-dark-reference.png`

## Content rules

- `docs/CONTENT.md` is the content source of truth once content work begins.
- The two files in `docs/references` are layout and visual references only.
- They are not content sources.
- Do not rewrite content based on archived prototype files unless the user explicitly asks.

## Safety rails

- Do not recreate, redraw, recolor, replace, or regenerate approved logo assets.
- Do not change DNS, hosting, deployment, or production domain settings without explicit user approval.
- Prefer archiving old artifacts instead of deleting them when replacing project structure.

## Validation

- For app changes, validate with:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
