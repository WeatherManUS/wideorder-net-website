# Security Baseline

## Audit checkpoint

- Date: `2026-10-10`
- Status: Phase 1 audit findings reviewed and accepted temporarily.
- Command: `npm audit`

## Affected packages

1. `eslint-config-next@16.4.0`
2. `@next/eslint-plugin-next@16.4.0`
3. `fast-glob@3.3.1`
4. `micromatch@4.0.8`
5. `braces@3.0.3`

## Scope of findings

- All five current high-severity findings are confined to development-only ESLint tooling.
- The production/runtime dependency tree is not affected by the accepted findings.
- `npm` currently proposes remediation only through an inappropriate major toolchain downgrade.
- These findings are accepted temporarily for Phase 1.
- Review them again during future dependency maintenance and before production launch.

## Security rules

- Never commit credentials or secrets.
- Environment secrets must be supplied through environment configuration rather than source control.
- Review this document before making dependency or security-tooling changes.
