# Tracking integration setup

All tracking is off by default. `GET /api/marketing-config` reads environment configuration at runtime with `no-store`; it exposes only validated public IDs and flags. It never exposes access tokens, private API keys, mail credentials, or the entire environment. Changing process environment requires the deployment's normal restart/configuration procedure, not a source-code change. Do not change production hosting as part of local setup.

## Configuration

Set `MARKETING_TRACKING_ENABLED=true` only when the operator has approved measurement and reviewed the privacy information. Each integration also needs its own `MARKETING_<PROVIDER>_ENABLED=true` and a valid ID:

| Provider | Public ID variable | Optional lead conversion configuration |
| --- | --- | --- |
| GA4 | `MARKETING_GA4_ID=G-…` | Mark `generate_lead` as the website key event; do not mark email/button clicks as leads |
| GTM | `MARKETING_GTM_ID=GTM-…` | Container owns all provider mappings; suppresses every direct integration and requires both categories |
| LinkedIn | `MARKETING_LINKEDIN_ID=<partner digits>` | `MARKETING_LINKEDIN_LEAD_CONVERSION=<conversion digits>` |
| Meta | `MARKETING_META_ID=<pixel digits>` | Standard `Lead`, with event ID; no advanced matching |
| Google Ads | `MARKETING_GOOGLE_ADS_ID=AW-…` | `MARKETING_GOOGLE_ADS_LABEL=<conversion label>` |
| X | `MARKETING_X_ID=<pixel ID>` | `MARKETING_X_LEAD_EVENT=tw-<pixel>-<event>` |

See `.env.example` for the complete disabled configuration. No IDs have been supplied or activated. Conversions API, enhanced conversions, automatic advanced matching, user-provided data collection and server-side advertising relays are not installed. If required later, their server implementation must use secret environment/managed configuration and the same consent and event-ID boundaries; do not put private tokens in this public config endpoint.

## Google

The application implements **Basic Consent Mode**: optional tags do not load before consent; it does not send advanced-mode cookieless pings before a choice. Consent commands are queued before config/events. Analytics storage follows analytics permission; advertising storage/user data follow advertising permission; ad personalization and Google signals stay disabled. GA4 receives sanitized `page_location` and origin-only external `page_referrer` (no path/query; internal referrers are empty), with `send_page_view=false` and explicit page events.

In the actual GA4 stream, disable enhanced measurement for automatic page/history events and form interactions; do not enable user-provided data or enhanced conversions. This is a required account-side setup step, because vendor automatic collection is not controlled by this event allowlist. Define a property retention setting appropriate to the approved policy and review data-sharing settings. [Basic versus advanced consent mode](https://developers.google.com/tag-platform/security/concepts/consent-mode), [consent command setup](https://developers.google.com/tag-platform/security/guides/consent), [recommended events](https://developers.google.com/analytics/devguides/collection/ga4/reference/events).

For GTM, publish a reviewed container with category consent checks, no custom contact-field variables, no automatic form capture, and no arbitrary third-party tags. The app gates container loading until both categories, but a container is executable code and must remain under authorized publishing control. Do not deploy a GA4 tag through GTM and enable another independently installed GA4 tag. [GTM consent configuration](https://support.google.com/tagmanager/answer/10718549).

## Advertising providers

Each direct provider waits for marketing consent. Meta auto-configuration is disabled before initialization; no contact details are used for matching. LinkedIn and X base scripts have documented automatic visit behavior. Vendor scripts may collect technical connection details and the current URL independently of the sanitized custom event payload. Accordingly, tags are restricted to known public routes and URLs containing only validated UTM labels/known anchors. Keep PII out of URLs and campaign labels; inspect live browser/vendor debug traffic before enabling a real account.

Only accepted inquiries with server-issued IDs trigger configured lead calls. [Google Ads transaction deduplication](https://support.google.com/google-ads/answer/6386790), [LinkedIn conversion deduplication](https://learn.microsoft.com/en-us/linkedin/marketing/conversions/deduplication), [X website conversion setup](https://help.x.com/en/business-and-advertising/conversion-tracking-for-websites). Meta account-side implementation, crop/specification and debugger validation remain manual because official account-scoped documentation was not fully accessible during research.

## Search and social references

`GOOGLE_SITE_VERIFICATION` optionally supplies an HTML verification token. Configure the property manually and use the existing sitemap. Indexing remains off unless separately approved through `SITE_INDEXABLE=true`; no DNS verification or production indexing is activated here.

For each of `LINKEDIN`, `YOUTUBE`, `FACEBOOK`, `INSTAGRAM`, `X`, supply `SOCIAL_<PLATFORM>_URL` and set `SOCIAL_<PLATFORM>_VERIFIED=true` only after the owner verifies the active profile and ownership. Only exact platform HTTPS hosts and profile paths are accepted. Footer links and Organization `sameAs` appear only for valid verified entries. Social/verification metadata on prerendered pages is read at build time, so rebuild those pages after changing it.

## Release checks

1. Supply authorized public IDs and verify account ownership outside source control.
2. Review `/privacy`, vendor settings, retention, and the current regional requirements with the responsible owner.
3. Confirm zero optional network requests before consent and after rejection.
4. Check analytics-only, advertising-only, GPC, DNT, withdrawal/reload and cross-tab changes.
5. Use a consented test successful inquiry to verify one conversion per provider and reconcile its ID; do not send real test mail without authorization.
6. Validate reporting and upload previews before publishing campaigns. Test traffic and test leads must be labelled/excluded from production reporting.

Advertising-link exception: validated `gclid`, `dclid`, `gbraid`, `wbraid`, `fbclid`, `li_fat_id`, `twclid`, and `msclkid` query values are allowed only after marketing consent. They are not persisted by the app or copied into custom analytics/lead payloads. Configured vendor SDKs may read them for consented campaign matching; analytics-only permission does not authorize them. Other unknown query keys still block optional tags.

GA4 campaign mapping: `utm_campaign` maps to `campaign_name`, not the distinct `campaign_id` / `utm_id` field. The direct transport sets sanitized campaign fields before the first explicit page view and repeats them on event scope. In GTM, map the internal initiative field `campaign_id` to GA4 `campaign_name`. Session acquisition remains GA4's own session attribution; a later campaign change does not rewrite its first session source. See [configuration fields](https://developers.google.com/analytics/devguides/collection/ga4/reference/config), [parameter scope](https://developers.google.com/tag-platform/gtagjs/reference#parameter_scope), and [campaign processing](https://support.google.com/analytics/answer/11242841).
