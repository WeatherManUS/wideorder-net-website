# Deployment versioning

WideOrder's authoritative public release check is **https://wideorder.net/version.json**. It is a server-rendered JSON endpoint: no login or JavaScript is required. The website interface has no visible version badge.

## Metadata and build integration

Hostinger builds the connected GitHub `main` branch using the existing `npm run build` script. That script now runs `scripts/build-release.mjs`, which wraps the same Next.js production build:

1. At build start, capture `package.json.version`, the short Git commit when available, a deterministic source digest, a unique artifact `releaseId`, and UTC `buildStartedAt`.
2. Supply the immutable identity to Next.js through `next.config.mjs`. The same identity generates Next's `BUILD_ID` and the nonvisual `wideorder-version`, `wideorder-build`, and `wideorder-release` HTML tags.
3. Only after Next exits successfully, record UTC `buildTime` in the private `.next/release.json` artifact. A failed build does not produce a completed release record. A new build discards any old publication marker.
4. Keep publication unset until the new artifact actually responds on the production domain.

Semantic `version` comes from the normal package release version (currently `0.1.0`); it is not automatically incremented for every build. `buildId` combines the short commit and source digest, or a `source-` digest when Git metadata is absent. Source/code/asset changes alter the digest. Every rebuild has a new UUID `releaseId`, even at the same commit/version. Generated output, local secrets, dependency folders and caches are excluded from the digest; text line endings are normalized across Windows/Linux, while binary assets are hashed unchanged.

Do not bypass the wrapper with a raw `next build`. Hostinger's configured build command must remain `npm run build`, and its runtime must retain the complete `.next` directory and be able to write the publication marker. No new npm dependency, hosting provider, DNS setting, or production-indexing setting is required.

## Successful publication

`.github/workflows/publication.yml` starts after a push to `main`, alongside Hostinger's existing automatic deployment. It does not replace Hostinger or deploy a second copy of the app. It waits up to 25 minutes for the expected source digest to appear publicly. Builds still running, failed deployments, old releases and stale JSON cannot be marked successful.

The verifier obtains a short-lived GitHub OIDC identity and calls `POST /api/release-publication`. The application validates GitHub's RS256 signature against the fixed official key endpoint, audience, immutable repository/owner IDs, `main` ref, workflow path, event type, expiry, and exact expected source/artifact identity. It then independently fetches the production JSON and HTML, requiring matching identities and uncached JSON headers before recording `publishedAt`. Tokens are never stored or logged. No long-lived webhook secret is needed.

**Timestamp limitation:** authenticated Hostinger control-plane access and its exact traffic-switch event are not available to this integration. `publishedAt` therefore records the first successful GitHub Actions observation of the correctly served production JSON **and** HTML, not build completion, process start, or an invented provider timestamp. `publicationSource` explicitly reads `github-actions-public-probe`. Observation can lag the switch because of polling (15 seconds), request latency, or GitHub job scheduling. Hostinger's deployment-start/switch timestamps remain in its own deployment log; the workflow labels its earlier phase “deployment verification started,” not “deployment completed.”

Before confirmation, `publishedAt` and `publicationSource` are `null`. The endpoint still identifies the live build honestly; it must not silently substitute build time. A missing, incomplete or mismatched completed artifact returns HTTP 503 with a small generic JSON error. Publication-record failures fail the workflow rather than claiming a timestamp.

## Check and verify

```powershell
curl.exe -i https://wideorder.net/version.json
curl.exe -i "https://wideorder.net/version.json?check=unique-value"
node scripts/check-release.mjs https://wideorder.net
```

Require HTTP 200, valid JSON, the expected `version`/`buildId`/`releaseId`, UTC ISO 8601 build/publication timestamps, and `environment: production`. Compare the build/release IDs with page-source meta tags. The GitHub workflow is successful only after rereading the public endpoint and confirming its recorded publication timestamp. Server-private source digests, verification identities, tokens, account details and filesystem paths are not returned publicly.

`Cache-Control: no-store, max-age=0`, `CDN-Cache-Control: no-store`, `Surrogate-Control: no-store`, and legacy no-cache headers apply specifically to `/version.json`. Other pages/assets retain their normal caching. If a separately configured CDN overrides origin cache directives, add an exact-path bypass for `/version.json` in that existing CDN; do not disable whole-site caching. No authenticated CDN control-plane change was made by this code.

If the JSON is current but HTML tags differ, the HTML or external review tool is stale. Retry with a unique query parameter and a fresh HTTP request rather than relying on a tool's saved page snapshot. A query is a diagnostic aid, not a replacement for correct no-store behavior.

`RELEASE_ENVIRONMENT` can explicitly be `production`, `staging`, or `development`. Otherwise a production Next runtime defaults to `production`; development mode defaults to `development`. Set staging explicitly for a staging deployment. Non-production responses do not claim production publication. Local production QA sets `RELEASE_ENVIRONMENT=staging`.

## Rollbacks

Roll back by restoring the **previous complete artifact**, including its `.next/release.json`, `BUILD_ID`, and `.next/release-publication.json`. Its version, build ID, unique artifact ID, original build time and original first-publication time remain unchanged. Restarts, retries and repeated confirmations cannot rewrite its publication marker. This makes an older restored build identifiable as the older release, not a newly built one.

After a Hostinger rollback, run **Verify public release → Run workflow** on `main`, supplying the restored artifact's original source commit/tag as `release_ref`. The workflow verifies that source publicly; it does not rebuild or perform the rollback itself. If an older artifact predates this feature, it cannot supply `/version.json`; rebuild that source with version support before relying on it for tracked rollback.

`publishedAt` is the release's original first verified production publication, not a claim about the latest rollback activation time. Use the verification run log/Hostinger history for that later activation. A rollback that rebuilds instead of restoring an artifact correctly receives a new `releaseId` and build time.

## Local checks

Run `npm run lint`, `npm run typecheck`, `node --experimental-strip-types --test src/lib/release/release.test.mjs`, and `npm run build`. Start with `RELEASE_ENVIRONMENT=staging` and `npm run start`; verify the JSON/cache headers and source tags agree while `publishedAt` remains null. Unit tests exercise signature validation, spoofed/fork/expired identities, stale HTML, publication races, source changes, repeat builds, and restoration of an already published artifact. Actual production rollback is an operator action, not an automatic test that removes the live release.

References: [Hostinger's GitHub deployment flow](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/), [GitHub OIDC claims](https://docs.github.com/en/actions/reference/security/oidc), [Next.js build IDs](https://nextjs.org/docs/app/api-reference/config/next-config-js/generateBuildId).
