import assert from "node:assert/strict";
import { htmlReleaseIdentity, verifyHtmlFooter } from "../src/lib/release/publication.ts";
import { utcTimestamp } from "../src/lib/release/metadata.ts";
import { versionParts } from "../src/lib/release/ledger.ts";
import { releaseRoutes } from "./release-routes.mjs";
import { crawlerDiagnostic } from "./crawler-diagnostic.mjs";

const origin = new URL(process.argv[2] || "https://wideorder.net");
if (origin.username || origin.password || origin.search || origin.hash || origin.pathname !== "/" || !(origin.protocol === "https:" || (origin.protocol === "http:" && ["localhost", "127.0.0.1"].includes(origin.hostname)))) throw new Error("Supply an HTTPS origin or a localhost test origin.");
const options = { cache: "no-store", headers: { "Cache-Control": "no-cache, no-store" }, redirect: "error", signal: AbortSignal.timeout(15000) };
const first = await fetch(new URL(`/version.json?check=${Date.now()}`, origin), options);
assert.equal(first.status, 200, "Version endpoint must return HTTP 200.");
assert.match(first.headers.get("content-type") || "", /application\/json/);
assert.match(first.headers.get("cache-control") || "", /no-store/);
const release = await first.json();
assert.equal(release.application, "WideOrder");
assert.ok(release.version && release.buildId && release.releaseId);
assert.ok(utcTimestamp(release.buildTime));
assert.ok(utcTimestamp(release.buildStartedAt));
if (release.environment === "production") assert.ok(utcTimestamp(release.publishedAt), "Production publication has not yet been confirmed.");
else assert.equal(release.publishedAt, null);
if (release.versionPolicy === 1 && release.environment === "production") {
  const parts = versionParts(release.version);
  for (const key of ["major", "minor", "release"]) assert.equal(release[key], parts[key]);
  assert.equal(release.deploymentStatus, "published");
}
const page = await fetch(new URL(`/?release-verification=${release.releaseId}`, origin), options);
assert.equal(page.status, 200);
const html = await page.text();
const tags = htmlReleaseIdentity(html);
const footerVerified = verifyHtmlFooter(html, release);
for (const path of releaseRoutes) {
    const response = await fetch(new URL(path, origin), { ...options, signal: AbortSignal.timeout(15000) });
    assert.equal(response.status, 200, path);
    for (const header of ['cache-control', 'cdn-cache-control', 'surrogate-control']) assert.match(response.headers.get(header) || '', /no-store/, `${path}: ${header}`);
    const source = await response.text();
    assert.deepEqual(htmlReleaseIdentity(source), tags, path);
    assert.equal(verifyHtmlFooter(source, release), true, path);
}
const crawlerDiagnostics = [];
for (const path of [...releaseRoutes, '/robots.txt', '/sitemap.xml']) crawlerDiagnostics.push(await crawlerDiagnostic(new URL(path, origin)));
console.log(`Verified ${releaseRoutes.length} public routes. Unverified crawler claims are separate diagnostics, not proof of genuine Googlebot access or indexing.`);
assert.equal(tags["wideorder-version"], release.version);
assert.equal(tags["wideorder-build"], release.buildId);
assert.equal(tags["wideorder-release"], release.releaseId);
const repeated = await fetch(new URL("/version.json", origin), options);
assert.equal(repeated.status, 200);
assert.match(repeated.headers.get("cache-control") || "", /no-store/);
assert.deepEqual(await repeated.json(), release, "A fresh request must retain the same immutable release timestamps.");
const head = await fetch(new URL("/version.json", origin), { ...options, method: "HEAD" });
assert.equal(head.status, 200);
assert.match(head.headers.get("cache-control") || "", /no-store/);
const rejected = await fetch(new URL("/api/release-publication", origin), { ...options, method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
assert.ok([401, 409].includes(rejected.status), "Anonymous publication must be rejected.");
console.log(JSON.stringify({ result: "passed", version: release.version, buildId: release.buildId, releaseId: release.releaseId, buildTime: release.buildTime, publishedAt: release.publishedAt, environment: release.environment, footerVerified, crawlerDiagnostics, checks: ["public JSON", "cache headers", "HTML agreement", "immutable repeated response", "HEAD", "anonymous publication rejected"] }, null, 2));
