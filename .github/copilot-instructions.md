# WideOrder — GitHub Copilot Instructions

## Project

WideOrder is a professional business automation and operations consulting website.

Brand message: Less busywork. Better business.

Preserve the current architecture, visual identity, security controls, and existing functionality.

## Development efficiency

- Work on one clearly defined change at a time.
- Inspect only files relevant to the task.
- Do not conduct repository-wide investigations unless requested.
- Prefer existing components, utilities, and patterns.
- Do not introduce dependencies without justification.
- Avoid unrelated refactoring and cosmetic changes.
- Keep explanations and progress reports concise.
- If the work expands beyond the defined scope, stop and report the required additional work.
- Never repeat failing commands without diagnosing the cause.

## Security

- Preserve passkey-only administrator authentication.
- Do not introduce password fallback.
- Never expose credentials, tokens, or secrets client-side.
- Preserve authorization checks and audit logging.
- Require appropriate reauthentication for sensitive actions.
- Do not weaken security to simplify implementation.
- Test affected authentication and authorization paths.
- Escalate any potential security regression.

## Implementation workflow

1. Identify the smallest set of affected files.
2. Establish the specific required change.
3. Implement the change without expanding scope.
4. Run targeted tests and relevant security checks.
5. Review the diff for unrelated modifications.
6. Report the results concisely.
7. Stop.

## Deployment

- Never deploy without explicit authorization.
- Do not modify production secrets or live data.
- Do not change authentication or recovery configuration without explicit authorization.
- Do not perform destructive operations without approval.

## Completion report

Provide:

- Files changed
- Summary of implementation
- Tests executed and results
- Known risks or outstanding issues
- Deployment status

Do not create additional tasks automatically.
