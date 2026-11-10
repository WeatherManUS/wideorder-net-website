# Consent and data boundaries

The implementation uses an opt-in baseline for every visitor rather than inferring location from IP or fingerprinting. Essential contact/security features are separate from optional analytics and advertising. This engineering baseline is not a certification of compliance with every jurisdiction. The responsible owner must approve the public privacy text, retention, processor terms and account settings before activating real integrations.

## Implemented behavior

- Each category starts denied. No analytics/advertising script, noscript tracking image, iframe, preconnect, or cookieless consent-mode request is added before permission.
- The preferences dialog offers equally available rejection, saved choices and acceptance. Keyboard focus is contained, Escape closes without changing choices, and the underlying page is inert while open. Footer preferences remain available even when tracking is disabled.
- Consent is stored under `wideorder-consent-v1`, version 1, with booleans and a timestamp, for at most 180 days. Missing, malformed, expired, future-dated or unavailable storage is treated as denied.
- Global Privacy Control overrides advertising permission. Do Not Track overrides both categories. The site does not attempt to evade these signals.
- Withdrawal clears attribution/lead-event session storage and accessible first-party vendor cookies, informs already loaded Google/Meta tags of denial/revocation, and reloads to unload optional code. It cannot delete third-party domain cookies or undo information previously sent; browser/vendor controls may be needed for those records.
- Cross-tab consent changes reload other tabs. If browser storage is blocked, persistent optional permission is unavailable and tracking remains off.
- No campaign history is collected before analytics permission. Only validated UTM labels are stored for the current permitted session, expiring after 30 minutes of inactivity.
- No browser fingerprint, cross-device identifier, form-field value, contact message, or matching hash is created for general analytics. Successful inquiries have only an opaque correlation ID in analytics.
- The website can be read and its email links used without optional tracking. Existing Turnstile/message delivery are essential to the configured form workflow, not advertising tags.

## Operator responsibilities

`/privacy` describes the implemented operation. Add any legally required controller identity/contact details, jurisdiction-specific disclosures, approved business-record retention periods, and processor arrangements before a public release if applicable. Do not invent a legal company address or claim a fixed email-retention period without an owner decision.

When introducing a new vendor/purpose or materially changing policy, revise the consent policy version/key and obtain a fresh choice. Existing consent should not silently authorize an unrelated future use. Keep tag-manager publishing rights restricted; audit changes to executable container content.

Vendor scripts can collect connection metadata and automatic URL data after consent. Disable enhanced form/automatic matching features and never put PII in campaign URLs. The application blocks optional tags on unknown/private pages or unsafe query strings, but third-party behavior still requires account-side testing. No live vendor collection or legal certification was performed as part of local development.

Advertising-link exception: validated `gclid`, `dclid`, `gbraid`, `wbraid`, `fbclid`, `li_fat_id`, `twclid`, and `msclkid` query values are allowed only after marketing consent. They are not persisted by the app or copied into custom analytics/lead payloads. Configured vendor SDKs may read them for consented campaign matching; analytics-only permission does not authorize them. Other unknown query keys still block optional tags.
