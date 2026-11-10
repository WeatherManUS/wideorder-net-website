# Website event contract

The executable allowlist is `src/lib/marketing/model.ts`. Dispatch uses `trackMarketingEvent` in `src/lib/marketing/browser.ts`; unknown events/parameters are dropped. Public page paths are allowlisted; query strings, arbitrary URLs, page titles, link text, referrers, visitor IDs, contact names, emails, telephone numbers and form content are not accepted as general event parameters. Slug parameters are capped at 64 characters. Never encode personal data inside an allowed slug.

| Event | Implemented trigger / extension contract | Allowed parameters besides `page_id` |
| --- | --- | --- |
| `page_view` | Initial permitted visit and public route navigation; manual GA page views prevent automatic duplicates | `campaign_source`, `campaign_medium`, `campaign_id`, `campaign_content` |
| `case_study_view` | Dedicated case-study landing page or at least 35% of an existing detailed article becomes visible; once per case per page lifecycle | `case_study_id`, `interaction_type` |
| `case_study_interaction` | Extension hook for a real interactive comparison; static before/after art does not fabricate an interaction | `case_study_id`, `interaction_type` |
| `cta_click` | A website `.button` link is activated | `cta_position`, `interaction_type` |
| `contact_start` | Email link selected or contact form first focused | `cta_position`, `interaction_type` |
| `generate_lead` | Form API reports accepted internal delivery and returns a UUID conversion reference | `lead_id`, `first_source`, `first_medium`, `first_campaign`, `last_source`, `last_medium`, `last_campaign`, `campaign_content` |
| `social_outbound_click` | Verified configured social profile link selected | `platform`, `cta_position` |
| `video_engagement` | Extension hook for a meaningful embedded-video interaction; no video/player is added merely to emit this event | `content_id`, `interaction_type` |
| `resource_download` | A download link with a validated `data-content-id` is selected | `content_id`, `content_category` |

No timestamps, monetary values, client names, user-level identifiers or campaign costs are invented. GA4 may attach its own technical/session context after consent. Register required low-cardinality custom dimensions in GA4; do not register unique lead references as a report dimension because high cardinality degrades reports. Restricted event export can use the reference for reconciliation.

## Conversion integrity

Successful accepted inquiry is the primary website conversion. It does not prove that a salesperson qualified the inquiry or that revenue resulted. Configure qualification/opportunity events only after an authorized CRM data source exists. Never map `cta_click` or `contact_start` to the primary lead conversion.

The form has an immediate in-flight ref guard as well as its existing submitting state. The server returns `conversionId` only after internal transactional delivery is accepted. Honeypot discards intentionally return a generic success without a conversion reference. Errors and unaccepted deliveries do not return one.

The browser deduplicates lead references in memory and a bounded session-storage ledger. A repeated successful response cannot emit the same conversion twice in that session. Google Ads uses `transaction_id`; Meta uses `eventID`; LinkedIn uses `event_id`; X uses `conversion_id`. The ledger is not a substitute for server request idempotency, CRM deduplication, or verified vendor-side receipt. Clearing session storage can reset the browser ledger.

## Delivery modes

- Direct GA4 receives the sanitized schema when analytics consent is granted.
- Advertising providers receive only their documented page/lead calls after marketing consent. LinkedIn and X base tags can create automatic visit events; the app does not duplicate those with undocumented SPA calls.
- When GTM is configured, it takes precedence over all direct providers and waits for both optional categories. Map only the documented dataLayer events through a reviewed container. Do not configure a second direct GA4 page-view trigger or a second click-to-lead trigger.
- Optional events are dropped before consent, on private/admin/unknown routes, on unsafe query/fragment URLs, and when configuration fails. They are not buffered for later transmission.
- The provider bootstrap can retain its own consented command queue while its script loads. Vendor/network errors can lose events; success from `trackMarketingEvent` means accepted for local dispatch, not confirmed delivery to a vendor.

Testing covers the allowlist, consent defaults/signals, campaign parsing, URL conflicts, configured IDs/social references, server conversion boundaries, browser network gates, withdrawal, and duplicate conversion responses. No test sends real email or analytics to an external account.

Advertising-link exception: validated `gclid`, `dclid`, `gbraid`, `wbraid`, `fbclid`, `li_fat_id`, `twclid`, and `msclkid` query values are allowed only after marketing consent. They are not persisted by the app or copied into custom analytics/lead payloads. Configured vendor SDKs may read them for consented campaign matching; analytics-only permission does not authorize them. Other unknown query keys still block optional tags.

Google transport note: the internal initiative slug `campaign_id` is translated to GA4 `campaign_name`, since no separate `utm_id` is collected. Supported campaign fields are present in the first stream configuration and each explicit GA4 event. Only the public path is sent in `page_location`; an external referrer contributes its origin only, with no path/query or internal/private referrer. Native GA4 session acquisition and the app's explicitly defined first/last tagged-session labels have different scopes and must not be conflated in reports.
