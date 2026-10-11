# Project Foundation

## Scope

This repository now contains the Phase 1 application foundation for `https://wideorder.net`.

## Validated stack

- Node.js `24.12.0`
- npm `11.6.2`
- Next.js `16.4.0`
- React `19.3.0`
- TypeScript `6.0.3`
- ESLint `9.39.5`

## Decisions made in Phase 1

- Adopt Next.js App Router with TypeScript.
- Use `npm` as the package manager.
- Preserve approved binary assets exactly as supplied.
- Preserve earlier prototype artifacts by archiving them instead of deleting them.
- Keep the active app intentionally minimal until content and design are approved.

## Active structure

- `src/app` — Next.js routes and global styling
- `src/config` — site configuration
- `src/theme` — centralized design tokens
- `public/brand` — approved production logos
- `docs/references` — approved visual references
- `docs/CONTENT.md` — content source of truth scaffold
- `docs/DESIGN_SYSTEM.md` — authoritative design-system document
- `docs/SECURITY.md` — accepted dependency/security checkpoint
- `docs/archive` — archived prototype and previous deployment artifacts

## Deferred items

- Final homepage implementation
- Phase 2 content recovery and approval
- Deployment and hosting setup
- DNS changes and production connection steps
