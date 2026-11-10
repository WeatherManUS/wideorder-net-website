# Marketing reporting specification

## Initial implementation and data boundary

Use the website event schema and a consent-gated GA4 property as the first reporting source. A GA4-connected Looker Studio/Data Studio report is sufficient initially; a custom dashboard is unnecessary until real reporting needs justify it. Google supports connecting GA4 properties to its reporting tool through the [Google Analytics connector](https://docs.cloud.google.com/data-studio/connect-to-google-analytics).

No analytics property, dashboard account, ad account, CRM connection, or social API access is presumed to exist. This repository prepares the architecture and specification; there are no fabricated dashboard values. Empty/unavailable data must display “not connected” or “not available”, not zero.

## Report pages

| View | Dimensions | Measures | Data source and interpretation |
| --- | --- | --- | --- |
| Acquisition | Date, session source/medium, campaign, landing page | Consented sessions, observed page views, engaged sessions | GA4; consent rejection, blockers, attribution rules and platform processing limit coverage |
| Content engagement | Page/case-study ID, content category, interaction type | Case-study views/interactions, CTA clicks, resource downloads, meaningful embedded-video engagement | Documented website events only; native video views are a separate metric |
| Enquiries | Campaign/source, destination page, first/last permitted touch | Successful `generate_lead` events and deduplicated submission counts where available | A successful enquiry is not automatically a qualified lead or a sale |
| Campaign comparison | Campaign, source, medium, creative, reporting period | Consented traffic, successful enquiries, session-to-enquiry rate | Compare equivalent time windows and attribution definitions |
| Paid performance | Authorized ad account, campaign, currency, date | Verified spend, platform-reported clicks/impressions/conversions, cost per enquiry | Only when an approved API/connector or documented import supplies actual data; label platform attribution separately |
| Commercial outcomes | CRM stage, campaign/source, opportunity date | Qualified enquiries, opportunities, verified revenue | Only after an authorized CRM source is connected; do not infer qualification from clicks or website events |

## Definitions and formulas

- **Successful enquiry:** a validated enquiry accepted for delivery by the server. A honeypot discard, failed security check, unsuccessful delivery, form start or CTA click is excluded.
- **Qualified enquiry:** an authorized business user marks the enquiry as a suitable opportunity according to a documented qualification rule. GA4 defines `qualify_lead` separately from `generate_lead`; use that distinction if CRM lifecycle reporting is added. [GA4 recommended events](https://developers.google.com/analytics/devguides/collection/ga4/reference/events).
- **Website enquiry rate:** deduplicated successful enquiries divided by the explicitly named session denominator for the same reporting window. Explain when numerator coverage differs from consented-session coverage; do not silently mix a server-wide count with browser-only traffic.
- **Cost per enquiry:** verified attributable campaign spend divided by the matching deduplicated enquiry count. If spend, currency, or enquiry count is unavailable or the count is zero, report “not calculable”.
- **Return on marketing spend:** (verified attributable revenue − verified marketing spend) ÷ verified marketing spend. Label the chosen attribution model and exclude unsupported revenue assumptions. This is not a substitute for profit or lifetime value.
- **First/last touch:** the first and most recent permitted campaign touch retained within the configured attribution session/window. No claim of lifetime, cross-device, or cross-browser attribution.

Do not sum platform-reported conversions across vendors: multiple vendors may claim the same enquiry. Keep website deduplicated enquiries as a separate reference measure. A platform's modeled value is not an observed website count.

## Data contract and provenance

Each reporting extract should record source, account/property ID, extraction date, timezone, currency where applicable, reporting window, attribution model/window, consent scope, and whether metrics are observed or modeled. Aggregate before sharing. Do not place contact names, email addresses, phone numbers, message bodies, raw query strings, or private tokens in general analytics datasets.

Join website data to CRM only through an explicitly approved nonpublic enquiry identifier and documented access controls. Apply consent restrictions to any server-side export too. Keep retention and access policies with the operator's privacy configuration. Report unknown campaign attribution explicitly rather than imputing a source.

Native LinkedIn, Meta, X and YouTube statistics require owner-authorized APIs, official connectors, or a documented export/import. Do not scrape restricted data, invent followers/impressions, or represent test events as real marketing results.

## Manual setup and validation

1. An owner creates or supplies a GA4 property/web stream, confirms timezone and retention, and provides its browser-safe measurement ID through secure configuration. Keep optional tracking off until that setup is approved.
2. Select one delivery owner per vendor: direct integration or a reviewed GTM container. Avoid duplicate tags and duplicate automatic/manual page views. Configure only the integrations actually needed.
3. Validate default denial, category-specific consent, revocation, and deduplication in the site's tests and the vendor's debugging tools. Google documents the [four consent signals and Tag Assistant checks](https://developers.google.com/tag-platform/security/guides/consent-debugging). Basic consent mode blocks Google tags before permission; advanced mode can send cookieless signals and is not the site's default. [Consent mode overview](https://developers.google.com/tag-platform/security/concepts/consent-mode).
4. Mark `generate_lead` as a GA4 key event after verifying the actual successful-submission trigger. Configure page/case-study/campaign parameters as appropriate custom dimensions and exclude internal/test traffic from production reports.
5. An authorized reporting owner connects the GA4 property in Looker Studio/Data Studio and builds the views above. Restrict sharing to the intended audience and inspect connector credentials before external sharing.
6. If organic search reporting is needed, an owner verifies Search Console and links the matching website property/web stream. Linking requires GA4 Editor access and verified Search Console ownership. [GA4/Search Console integration](https://support.google.com/analytics/answer/10737381). The HTML verification-tag method is available for URL-prefix properties; DNS changes require separate explicit approval. [Search Console ownership verification](https://support.google.com/webmasters/answer/9008080).
7. Reconcile a small controlled set of consented test visits and successful test enquiries across browser debug tools, server results, and GA4. Remove or label test data. Validate real ad spend/CRM imports separately before activating paid-performance or revenue views.

Until authorized accounts and data are supplied, this specification is the initial reporting deliverable. It deliberately does not create a live dashboard, connect accounts, change indexing, alter DNS, or activate advertising.
