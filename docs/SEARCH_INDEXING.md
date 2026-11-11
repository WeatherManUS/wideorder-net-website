# Search indexing and crawler investigation

## Approval boundary

The owner explicitly authorized production activation on November 11, 2026: “Set SITE_INDEXABLE =true”, then confirmed “Saved SITE_INDEXABLE=true” in Hostinger. This supersedes the earlier deferred-activation state. Activation requires the v0.2.0003 rebuild and public-response verification; the saved value is owner-reported, not independently read from Hostinger settings. Staging/local stay non-indexable. This authorization does not approve broad firewall exceptions, DNS changes or requests being trusted solely by user-agent string.

## Baseline evidence: v0.2.0002

Observed November 11, 2026, 06:57:23–06:57:24 AM CST (12:57:23–12:57:24 UTC):

| Request from the same diagnostic client | Homepage | robots.txt | sitemap.xml |
| --- | --- | --- | --- |
| Basic HTTP client | 200 | 200 | 200 |
| Browser user-agent header | 200 | 200 | 200 |
| `Googlebot` claim | 403 | 403 | 403 |
| Full Googlebot user-agent claim | 403 | 403 | 403 |

These are **spoofed claims**, not requests originating from verified Google crawlers. Actual Chromium navigation and all public canonical/metadata checks are covered by `scripts/indexing-qa.mjs`.

- Effective production indexing is disabled: robots.txt is `User-Agent: *` / `Disallow: /`; homepage HTML contains `noindex, nofollow`. The exact Hostinger variable value cannot be read from this session; these outputs mean the flag is not effectively true, not proof that the literal configured string is `false`.
- No public homepage `X-Robots-Tag` was present. Administrator routes already have noindex headers and metadata. All APIs and version JSON gain noindex headers in the readiness change.
- Sitemap XML lists exactly 11 public HTTPS URLs, excluding administration, authentication, APIs and inquiry records. It is accessible even while robots disallows crawling; sitemap availability does not enable indexing.
- Canonical origin is `https://wideorder.net`; each public page uses its own route. Homepage canonical omits the trailing slash, which resolves to the same URL.
- No Google verification meta tag or apex `google-site-verification` TXT record was observed. This does not establish whether an existing Search Console owner is verified through another method. Authoritative nameservers observed: `horizon.dns-parking.com`, `orbit.dns-parking.com`.
- Successful responses include `server: hcdn`, `platform: hostinger`, Next.js headers, `x-hcdn-upstream-rt`, and the application security headers. Rejections have `server: hcdn`, Hostinger platform/panel identifiers and a generic 403 body, but no Next.js/application headers or upstream timing. Evidence points to Hostinger edge filtering; the exact generating rule or upstream component requires Hostinger logs. A CDN response header alone cannot identify the internal rule.
- Example rejected homepage request: `x-hcdn-request-id: 93d83c83698a70abc2f3654126b5f730-bos-edge12` at `2026-11-11T12:57:24.215Z`. Rejected robots request: `9d028d870972d578609a8075681d8643-bos-edge12` at `2026-11-11T12:57:24.309Z`. No firewall rule identifier was exposed.
- Repository audit found no middleware/proxy or public-page user-agent denial. API-origin checks, contact throttling and admin authentication serve different purposes. Security response headers do not generate this user-agent-specific 403.
- No authenticated Hostinger hosting/CDN/WAF/log or Search Console connection is available in this session. Current security level, country/IP/bot rules, request-rate decisions and genuine-crawler source IPs remain unknown. Hostinger Mail access does not grant hosting administration.

## Hostinger owner investigation

1. Open Hostinger dashboard → Websites → Manage site for `wideorder.net` → Traffic → Access logs and Error code 4xx. Match the UTC timestamp, URL and request ID above. Capture only request metadata, rule/action and trusted client IP, not credentials or inquiry content. CDN-backed origin logs may show an edge IP rather than the actual crawler address; ask support for the verified client IP.
2. Open Performance → CDN → Manage → Security. Record the current security level and whether Under Attack mode is active. Inspect Traffic blocking for country/IP rules and the blocked-bots configuration. Do not change broad rules merely because our spoofed request failed.
3. Run a Search Console live test and correlate its timestamp with the logs. A robots disallow is expected while activation is deferred; distinguish that from a server 403 or unreachable robots file.
4. For a real blocked request, verify the source using Google's official crawler category IP ranges, or reverse DNS followed by forward DNS resolving back to the same address. Common Googlebot, InspectionTool and other user-triggered fetchers are distinct categories. Do not equate an arbitrary Google Cloud address with Googlebot, trust an unvalidated forwarded header, or permanently hard-code a captured crawler IP.
5. If verified Google traffic is blocked, identify the exact matching rule. Prefer an exception scoped to the verified crawler category and public read-only URLs. Preserve admin/API authentication, Turnstile, contact throttling and normal malicious-bot filtering. Record the rule before/after, scope, reason and test result. If the dashboard cannot create the precise exception, contact Hostinger support with domain, method/URL, UTC time, request ID, verified source IP and Search Console error. Ask support to identify the rule and apply a narrow exception; do not disable the CDN or all firewall protection.
6. Repeat the live test and correlate logs after any approved change. Report the tested Google fetcher and observed HTTP outcome; do not claim automatic Googlebot crawling or indexing from an InspectionTool success alone.

Hostinger documents that verified crawlers normally pass its verification, while spoofed crawler claims may be rejected. It also documents that precise service/endpoint exceptions and crawler rate-limit cases need support. No Hostinger rule has been changed by this work.

## Search Console setup and activation plan

1. Sign in to Google Search Console with the owner's account. Select Add property → **Domain**, enter `wideorder.net` without scheme/path, and choose DNS verification. If it already exists, use the existing property or have its owner grant access.
2. Copy the exact TXT token generated for that property. At the authoritative DNS provider, add a TXT record at the apex (`@`, or the provider's equivalent). Preserve existing SPF, mail and other verification records. This DNS write is an owner action requiring explicit authorization; no DNS changes are made here. Wait for propagation, click Verify in Search Console and retain the TXT record.
3. Domain verification covers protocols/subdomains and uses DNS. The existing `GOOGLE_SITE_VERIFICATION` meta-tag option is for eligible URL-prefix verification; it does not replace the Domain property's DNS requirement.
4. Before activation, record owner approval, check public content for confidentiality, and confirm the private routes remain authenticated. Public pages are marketing content; never add inquiry/admin URLs to sitemap or remove authentication to assist crawling.
5. **After explicit approval only:** in the existing Hostinger Node deployment environment, set `SITE_INDEXABLE=true` for production. Keep staging `RELEASE_ENVIRONMENT=staging` and `SITE_INDEXABLE=false`; keep local false. Production indexing requires `NODE_ENV=production` and production release classification. Rebuild/redeploy using the next authorized release number: robots is generated at build time, so changing a runtime variable without rebuilding is insufficient. Use the established release pipeline; do not change hosting/DNS architecture.
6. Verify `robots.txt` allows public URLs, excludes `/admin`, `/api` and `/version.json`, and advertises `https://wideorder.net/sitemap.xml`. Verify public HTML has `index, follow`, no conflicting HTTP noindex, correct canonical URLs and exactly 11 public sitemap entries. Confirm admin metadata/API headers remain noindex and protected inquiry requests still redirect to authentication.
7. In Search Console → Sitemaps, submit `https://wideorder.net/sitemap.xml` after activation. Check the processing result and errors; submission is not proof of indexing.
8. Inspect `https://wideorder.net/` with URL Inspection. Review the indexed result separately from **Test Live URL**. Inspect crawl allowed, page fetch, indexing allowed, rendered content and canonical details. Capture any 403/429 with its time and available request ID. Also test representative secondary pages and sitemap accessibility.
9. After successful activation checks, use Request indexing for the homepage and important updated pages. Monitor Page indexing and Settings → Crawl stats. A 200 response or successful live test establishes accessibility for that request, not inclusion in search results or an indexing timetable.

## Regression checks

Readiness validation before v0.2.0003: lint, typecheck, two optimized builds and all 64 automated tests passed. Rendered browser checks passed for all 11 routes in an enabled local production-mode fixture and in a staging fixture with `SITE_INDEXABLE=true` intentionally set: staging still returned noindex and disallowed crawling. Both fixtures retained private-route authentication and noindex. Actual baseline production Chromium navigation returned HTTP 200 with noindex at `2026-11-11T13:02:27.133Z` (request ID `20b732c538df693147ea6b2f09814b40-bos-edge12`). None of these tests proves genuine Googlebot access or indexing. Final production verification is recorded only after deployment.

- Unit tests: `node --experimental-transform-types --import ./scripts/test-register.mjs --test src/config/indexing.test.mjs`.
- Browser checks: set `QA_BASE_URL`, `PLAYWRIGHT_MODULE_PATH`, `QA_OUTPUT_DIRECTORY`; run `node scripts/indexing-qa.mjs`. Default expectation is non-indexable. Set `QA_EXPECT_INDEXABLE=true` only for an explicitly approved production activation or isolated local production-mode fixture.
- Test both enabled production and disabled staging/local configurations. The test never changes deployment environment settings.
- `scripts/check-release.mjs` continues to fail on invalid ordinary-route responses, inconsistent release identity or caching failures. Unverified Googlebot claims are structured diagnostics, including status/time/edge request ID, and are not deployment failure or crawler-fix proof.
- Preserve baseline/raw diagnostic evidence under `.release/googlebot/`. Do not store authentication cookies, private inquiries or credentials in reports.

## Official references

- [Google crawler verification and category-specific IP ranges](https://developers.google.com/crawling/docs/crawlers-fetchers/verify-google-requests)
- [Hostinger crawler verification and SEO](https://www.hostinger.com/support/hostinger-cdn-search-engine-crawlers-and-seo/)
- [Hostinger precise exceptions and request IDs](https://www.hostinger.com/support/hostinger-cdn-how-to-fix-blocked-legitimate-requests/)
- [Hostinger traffic/access logs](https://www.hostinger.com/support/5650167-how-to-use-the-traffic-section-on-hostinger-dashboard-at-hostinger/)
- [Search Console ownership verification](https://support.google.com/webmasters/answer/9008080)
- [URL Inspection and live-test limitations](https://support.google.com/webmasters/answer/9012289)
- [Sitemap submission and results](https://support.google.com/webmasters/answer/7451001)
