# Campaign URLs and attribution

Use lowercase slugs starting with a letter, followed by letters, digits, underscores or hyphens; maximum 64 characters. Never place contact names, email addresses, phone numbers, message text, secrets, or customer identifiers in URL labels.

| Key | Rule |
| --- | --- |
| `utm_source` | Platform: `linkedin`, `youtube`, `facebook`, `instagram`, `x`, `newsletter`, or a documented new source |
| `utm_medium` | `organic_social`, `paid_social`, `email`, `referral`, `paid_search` |
| `utm_campaign` | Stable initiative, e.g. `process_improvement` |
| `utm_content` | Creative variant, e.g. `reporting_before_after_v1` |
| `utm_term` | Optional non-personal targeting/keyword label |

Facebook and Instagram are separate sources, even if both use Meta advertising. Never use `meta` as a substitute for the originating placement when that placement is known.

## Local URL builder

Node 24 is the repository baseline. No additional packages are required.

```powershell
node scripts/utm-builder.mjs --destination 'https://wideorder.net/our-work/month-end-reporting?view=details#result' --source linkedin --medium organic_social --campaign process_improvement --content reporting_case_study
```

Outputs a copyable URL on stdout. Optional `--term <slug>` adds a term. `--export <path.json>` writes a JSON campaign record without overwriting an existing file. Relative paths resolve against `https://wideorder.net`; external hosts, credentials, non-HTTPS URLs, conflicting or duplicate UTM keys, unsupported UTM keys, and differently cased UTM keys are rejected. Existing unrelated query parameters and fragments are retained. Existing matching UTM values are deduplicated with `URLSearchParams.set`.

The builder preserves general query/fragment syntax. Tracking itself is stricter: optional tags are blocked on pages with unrelated query keys or unknown fragments, so contact information cannot accidentally be passed to vendor automatic URL collection. Public campaign links should normally contain only the supported UTM keys, with no fragment unless it is an existing case-study anchor.

## Permitted session attribution

Attribution begins only after analytics consent. `sessionStorage['wideorder-attribution-v1']` stores validated campaign labels, first touch, last touch, and an activity timestamp. It is not a cross-device identity and does not recover visits before consent.

- First touch: the first complete permitted UTM campaign in the current permitted session; otherwise `direct` / `none`.
- Last touch: the most recent complete permitted UTM campaign. Untagged navigation retains the last tagged touch.
- A complete campaign includes source, medium and campaign. Partial tags are not attributed as a complete campaign.
- Session data expires after 30 minutes without a captured page/event, or when session storage is cleared/closed. A refreshed page in the same browser tab can retain the permitted session. Browser restore/duplicated-tab behavior is controlled by the browser.
- Invalid or duplicate labels are ignored. Stored labels are revalidated before reuse. Withdrawing analytics permission clears the record.

`generate_lead` carries validated first/last labels and an opaque server-issued `lead_id` after successful internal message acceptance. The ID corresponds to the existing internal request correlation reference; attribution is not inserted into visitor or internal message bodies. A separately authorized, restricted CRM integration can reconcile that reference later. There is no server-side advertising relay or CRM dashboard in this initial implementation.

Mailto enquiries, ad blockers, denied consent, cross-device journeys, browser storage restrictions, and vendor delivery failures cause incomplete attribution. Do not present these observed labels as universal multi-touch attribution.

Advertising-link exception: validated `gclid`, `dclid`, `gbraid`, `wbraid`, `fbclid`, `li_fat_id`, `twclid`, and `msclkid` query values are allowed only after marketing consent. They are not persisted by the app or copied into custom analytics/lead payloads. Configured vendor SDKs may read them for consented campaign matching; analytics-only permission does not authorize them. Other unknown query keys still block optional tags.
