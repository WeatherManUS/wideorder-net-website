# Privacy Draft

## Status

- `DRAFT — REQUIRES BUSINESS/LEGAL REVIEW BEFORE PUBLICATION`
- This file is not a published legal policy.
- Do not add `/privacy` to the public site yet.

## Intended handling for the Contact form

- Data submitted through Contact includes name, optional company, email, optional phone, and message content.
- Purpose: responding to an inquiry submitted through the WideOrder website.
- Delivery provider: Hostinger email infrastructure sends the server-side notification email.
- Abuse protection: Cloudflare Turnstile is used to help verify that the submission is not automated abuse.
- Validation: submitted values are validated server-side before delivery is attempted.
- Storage: there is no intentional public contact-message database in the current implementation.
- Logging: minimal operational logs may record success/failure category, request identifier, and safe provider identifiers without full message content.

## Other current site behavior

- Analytics: none at launch.
- Advertising tracking: none intentionally installed.
- Theme preference: the selected light/dark theme is stored locally in browser storage.

## Limits of this draft

- Do not treat this file as a final public policy.
- Do not infer statutory compliance commitments from this draft.
- Do not infer a final data-retention period from this draft.

