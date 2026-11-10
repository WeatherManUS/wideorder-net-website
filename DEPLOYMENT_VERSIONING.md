# Deployment versioning

WideOrder's authoritative public release check is **https://wideorder.net/version.json**. It is a server-rendered JSON endpoint: no login or JavaScript is required. A discreet release line is temporarily included in the server-rendered copyright footer.

## Metadata and build integration

Hostinger builds the connected GitHub `main` branch using the existing `npm run build` script. That script now runs `scripts/build-release.mjs`, which wraps the same Next.js production build:

1. At build start, capture `package.json.version`, the short Git commit when available, a deterministic source digest, a unique artifact `releaseId`, and UTC `buildStartedAt`.
2. Supply the immutable identity to Next.js through `next.config.mjs`. The same identity generates Next's `BUILD_ID` and the nonvisual `wideorder-version`, `wideorder-build`, and `wideorder-release` HTML tags.
3. Only after Next exits successfully, record UTC `buildTime` in the private `.release/release.json` runtime artifact (also retained in `.next/release.json` for build inspection). A failed build does not produce a completed release record. A new build discards any old publication marker.
4. Keep publication unset until the new artifact actually responds on the production domain.

Semantic `version` comes from the normal package release version (currently `0.1.0`); it is not automatically incremented for every build. `buildId` combines the short commit and source digest, or a `source-` digest when Git metadata is absent. Source/code/asset changes alter the digest. Hostinger may add or transform packaging files, so publication binds the full private Git commit plus artifact identity instead of assuming the provider working-tree digest equals a clean checkout. Every rebuild has a new UUID `releaseId`, even at the same commit/version. Generated output, local secrets, dependency folders and caches are excluded from the digest; text line endings are normalized across Windows/Linux, while binary assets are hashed unchanged.

Do not bypass the wrapper with a raw `next build`. Hostinger's configured build command must remain `npm run build`, and its runtime must retain its traced `.release/release.json` and framework artifacts and be able to write the adjacent publication marker. Explicit output-file tracing and the build wrapper preserve the completed metadata in standalone bundles too. No new npm dependency, hosting provider, DNS setting, or production-indexing setting is required.

## Successful publication

`.github/workflows/publication.yml` starts after a push to `main`, alongside Hostinger's existing automatic deployment. It does not replace Hostinger or deploy a second copy of the app. It waits up to 25 minutes for the expected Git commit to appear publicly (source-digest fallback for archives without Git). Builds still running, failed deployments, old releases and stale JSON cannot be marked successful.

The verifier obtains a short-lived GitHub OIDC identity and calls `POST /api/release-publication`. The application validates GitHub's RS256 signature against the fixed official key endpoint, audience, immutable repository/owner IDs, `main` ref, workflow path, event type, expiry, and exact expected Git commit/artifact identity (or source digest for archives). It then independently fetches the production JSON and HTML, requiring matching identities and uncached JSON headers before recording `publishedAt`. Tokens are never stored or logged. No long-lived webhook secret is needed.

**Timestamp limitation:** authenticated Hostinger control-plane access and its exact traffic-switch event are not available to this integration. `publishedAt` therefore records the first successful GitHub Actions observation of the correctly served production JSON **and** HTML, not build completion, process start, or an invented provider timestamp. `publicationSource` explicitly reads `github-actions-public-probe`. Observation can lag the switch because of polling (15 seconds), request latency, or GitHub job scheduling. Hostinger's deployment-start/switch timestamps remain in its own deployment log; the workflow labels its earlier phase “deployment verification started,” not “deployment completed.”

Before confirmation, `publishedAt` and `publicationSource` are `null`. The endpoint still identifies the live build honestly; it must not silently substitute build time. A missing, incomplete or mismatched completed artifact returns HTTP 503 with a small generic JSON error. Publication-record failures fail the workflow rather than claiming a timestamp.

## Check and verify

```powershell
curl.exe -i https://wideorder.net/version.json
curl.exe -i "https://wideorder.net/version.json?check=unique-value"
node scripts/check-release.mjs https://wideorder.net
```

Require HTTP 200, valid JSON, the expected `version`/`buildId`/`releaseId`, UTC ISO 8601 build/publication timestamps, and `environment: production`. Compare the build/release IDs with page-source meta tags. The GitHub workflow is successful only after rereading the public endpoint and confirming its recorded publication timestamp. Server-private source digests, verification identities, tokens, account details and filesystem paths are not returned publicly.

`Cache-Control: no-store, max-age=0`, `CDN-Cache-Control: no-store`, `Surrogate-Control: no-store`, and legacy no-cache headers apply specifically to `/version.json`. Public HTML now renders at request time and sends no-store directives so the footer can read the post-deployment publication record immediately. CSS, JavaScript, fonts and images retain their normal caching. If a separately configured CDN overrides origin cache directives, add an exact-path bypass for `/version.json` in that existing CDN; do not disable whole-site caching. No authenticated CDN control-plane change was made by this code.

If the JSON is current but HTML tags differ, the HTML or external review tool is stale. Retry with a unique query parameter and a fresh HTTP request rather than relying on a tool's saved page snapshot. A query is a diagnostic aid, not a replacement for correct no-store behavior.

`RELEASE_ENVIRONMENT` can explicitly be `production`, `staging`, or `development`. Otherwise a production Next runtime defaults to `production`; development mode defaults to `development`. Set staging explicitly for a staging deployment. Non-production responses do not claim production publication. Local production QA sets `RELEASE_ENVIRONMENT=staging`.

## Rollbacks

Roll back by restoring the **previous complete artifact**, including its traced `.release/release.json`, framework `BUILD_ID`, and `.release/release-publication.json`. Its version, build ID, unique artifact ID, original build time and original first-publication time remain unchanged. Restarts, retries and repeated confirmations cannot rewrite its publication marker. This makes an older restored build identifiable as the older release, not a newly built one.

After a Hostinger rollback, run **Verify public release → Run workflow** on `main`, supplying the restored artifact's original source commit/tag as `release_ref`. The workflow verifies that source publicly; it does not rebuild or perform the rollback itself. If an older artifact predates this feature, it cannot supply `/version.json`; rebuild that source with version support before relying on it for tracked rollback.

`publishedAt` is the release's original first verified production publication, not a claim about the latest rollback activation time. Use the verification run log/Hostinger history for that later activation. A rollback that rebuilds instead of restoring an artifact correctly receives a new `releaseId` and build time.

## Local checks

Run `npm run lint`, `npm run typecheck`, `node --experimental-strip-types --test src/lib/release/release.test.mjs`, and `npm run build`. Start with `RELEASE_ENVIRONMENT=staging` and `npm run start`; verify the JSON/cache headers and source tags agree while `publishedAt` remains null. Unit tests exercise signature validation, spoofed/fork/expired identities, stale HTML, publication races, source changes, repeat builds, and restoration of an already published artifact. Actual production rollback is an operator action, not an automatic test that removes the live release.

References: [Hostinger's GitHub deployment flow](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/), [GitHub OIDC claims](https://docs.github.com/en/actions/reference/security/oidc), [Next.js build IDs](https://nextjs.org/docs/app/api-reference/config/next-config-js/generateBuildId).

## Temporary footer and appearance selector

`SHOW_FOOTER_VERSION` is the single display flag: it defaults to enabled. Set it to `false` in the runtime environment and restart the app to hide the footer version/publication line without disabling `/version.json` or the HTML release meta tags. The footer reads the same `currentRelease()` function as the endpoint on each server request, using Next.js `connection()` to avoid capturing a pre-publication value during the build. Until production success is verified, it explicitly says ?Publication not yet confirmed? and never substitutes build time.

All internal timestamps remain UTC. The footer formats the verified `publishedAt` with `America/Chicago`, including CST or CDT as appropriate. Its copyright year is also computed in that time zone. The publication verifier checks the footer's server-rendered release ID, version and UTC `<time datetime>` after recording success. Initial HTML includes the readable text without client-side JavaScript. HTML cache bypass is limited to public page entry points; other assets keep their performance caching.

The four existing appearance palettes keep their stored keys and colors. Their permanent UI names are Ivory & Sage, Navy & Sage, Pearl & Indigo, and Ink & Indigo. The preview menu supports mouse hover/click, touch, Arrow keys, Home/End, Enter/Space, Escape, Tab and persisted choices.

Run `node --experimental-strip-types --test src/lib/release/footer.test.mjs` for CST/CDT, year-boundary and display-flag checks. `scripts/appearance-footer-qa.mjs` exercises initial HTML, JavaScript-disabled footer visibility, all themes at desktop/mobile widths, persistence, hover/touch and keyboard behavior. Supply `QA_BASE_URL` and an existing `PLAYWRIGHT_MODULE_PATH`. Local-only fixture seeding is opt-in (`QA_SEED_LOCAL_PUBLICATION=true`) and rejected for production origins; `QA_HIDDEN_BASE_URL` can verify a second local server started with `SHOW_FOOTER_VERSION=false`.
