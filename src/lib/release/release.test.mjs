import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, writeFile, mkdir, rm, readFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { generateKeyPairSync, sign } from "node:crypto";
import { sourceFingerprint, createBuildContext } from "../../../scripts/release-context.mjs";
import { publicRelease, readBuildRecord, readPublication } from "./metadata.ts";
import { authenticatePublication, confirmPublicRelease, htmlReleaseIdentity, recordPublication, validateClaims } from "./publication.ts";

const record = { application: "WideOrder", version: "0.1.0", buildId: "012345abcdef-0123456789abcdef", releaseId: "10000000-0000-4000-8000-000000000001", sourceHash: "0".repeat(64), buildStartedAt: "2026-11-10T17:30:00.000Z", buildTime: "2026-11-10T17:31:00.000Z" };
async function cleanup(directory) {
  const resolved = path.resolve(directory);
  if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !/^wideorder-(source|release)-/.test(path.basename(resolved))) throw new Error("Refusing to remove an unexpected test path.");
  await rm(resolved, { recursive: true, force: true });
}
async function artifact() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "wideorder-release-"));
  await writeFile(path.join(directory, "release.json"), JSON.stringify(record));
  await writeFile(path.join(directory, "BUILD_ID"), record.releaseId);
  return directory;
}
test("source identity changes with source bytes, excludes private/generated files and normalizes text line endings", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "wideorder-source-"));
  try {
    await writeFile(path.join(directory, "package.json"), '{"version":"0.1.0"}\n');
    const first = sourceFingerprint(directory);
    await mkdir(path.join(directory, ".next"));
    await writeFile(path.join(directory, ".next", "ignored.json"), "generated");
    await writeFile(path.join(directory, ".env.local"), "SECRET=must-not-appear");
    assert.equal(sourceFingerprint(directory), first);
    await writeFile(path.join(directory, "package.json"), '{"version":"0.1.0"}\r\n');
    assert.equal(sourceFingerprint(directory), first);
    const a = createBuildContext(directory), b = createBuildContext(directory);
    assert.equal(a.buildId, b.buildId); assert.notEqual(a.releaseId, b.releaseId);
    await writeFile(path.join(directory, "page.ts"), "export const headline = 'Changed code';");
    assert.notEqual(sourceFingerprint(directory), first);
    await writeFile(path.join(directory, "binary.png"), Buffer.from([0, 13, 10]));
    const binary = sourceFingerprint(directory);
    await writeFile(path.join(directory, "binary.png"), Buffer.from([0, 10]));
    assert.notEqual(sourceFingerprint(directory), binary);
  } finally { await cleanup(directory); }
});
test("completed artifact identity is required, and public JSON never exposes private context", async () => {
  const directory = await artifact();
  try {
    const build = readBuildRecord(directory);
    assert.equal(readPublication(build, directory), null);
    const value = publicRelease({ ...build, secret: "must-not-leak" }, null, "production");
    assert.equal(value.publishedAt, null);
    assert.equal(value.buildTime, record.buildTime);
    assert.ok(!JSON.stringify(value).includes("must-not-leak"));
    assert.equal(value.sourceHash, undefined);
    await writeFile(path.join(directory, "BUILD_ID"), "wrong-artifact");
    assert.throws(() => readBuildRecord(directory), /mismatch/);
  } finally { await cleanup(directory); }
});
test("publication is a distinct success observation, atomically idempotent and preserved on rollback/restart", async () => {
  const directory = await artifact();
  try {
    const first = await recordPublication(record, "123.1", directory, new Date("2026-11-10T17:34:12.000Z"));
    assert.notEqual(first.publishedAt, record.buildTime);
    const retry = await recordPublication(record, "124.1", directory, new Date("2026-11-11T17:34:12.000Z"));
    assert.deepEqual(retry, first);
    assert.deepEqual(readPublication(readBuildRecord(directory), directory), first);
    assert.equal(publicRelease(record, first, "staging").publishedAt, null);
    const other = { ...record, releaseId: "20000000-0000-4000-8000-000000000002" };
    assert.equal(readPublication(other, directory), null);
  } finally { await cleanup(directory); }
});
test("simultaneous confirmations cannot replace the original publication", async () => {
  const directory = await artifact();
  try {
    const results = await Promise.all([recordPublication(record, "123.1", directory, new Date("2026-11-10T17:34:12.000Z")), recordPublication(record, "124.1", directory, new Date("2026-11-10T17:34:13.000Z"))]);
    assert.equal(results[0].publishedAt, results[1].publishedAt);
    assert.ok(JSON.parse(await readFile(path.join(directory, "release-publication.json"), "utf8")).verificationId);
  } finally { await cleanup(directory); }
});

const now = Date.now();
const claims = { iss: "https://token.actions.githubusercontent.com", aud: "wideorder-release-publication", repository: "WeatherManUS/wideorder-net-website", repository_id: "1413811290", repository_owner_id: "247812451", ref: "refs/heads/main", workflow_ref: "WeatherManUS/wideorder-net-website/.github/workflows/publication.yml@refs/heads/main", event_name: "push", run_id: "123", run_attempt: "1", iat: Math.floor(now / 1000) - 10, nbf: Math.floor(now / 1000) - 10, exp: Math.floor(now / 1000) + 200 };
test("publication trust excludes forks, PRs, another workflow, wrong audience, expired tokens and renamed repositories", () => {
  validateClaims(claims, now);
  for (const patch of [{ aud: "wrong" }, { repository_id: "1" }, { repository_owner_id: "1" }, { ref: "refs/pull/1/merge" }, { workflow_ref: "another.yml" }, { event_name: "pull_request" }, { exp: Math.floor(now / 1000) - 1 }]) assert.throws(() => validateClaims({ ...claims, ...patch }, now));
});
test("OIDC requires an actual RS256 signature from the fixed GitHub key endpoint", async () => {
  const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT", kid: "local-test-key" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = sign("RSA-SHA256", Buffer.from(`${header}.${body}`), pair.privateKey).toString("base64url");
  const fetcher = async (url) => {
    assert.equal(url, "https://token.actions.githubusercontent.com/.well-known/jwks");
    return Response.json({ keys: [{ ...pair.publicKey.export({ format: "jwk" }), kid: "local-test-key", alg: "RS256" }] });
  };
  assert.equal(await authenticatePublication(`${header}.${body}.${signature}`, fetcher, now), "123.1");
  const changed = Buffer.from(JSON.stringify({ ...claims, run_id: "999" })).toString("base64url");
  await assert.rejects(authenticatePublication(`${header}.${changed}.${signature}`, fetcher, now), /signature/);
  await assert.rejects(authenticatePublication("not-a-token", fetcher, now));
});
test("production success requires fresh public JSON and matching HTML, not build/start completion", async () => {
  const html = `<meta content="${record.version}" name="wideorder-version"><meta name="wideorder-build" content="${record.buildId}"><meta name="wideorder-release" content="${record.releaseId}">`;
  assert.equal(htmlReleaseIdentity(html)["wideorder-build"], record.buildId);
  const fetcher = async (url) => url.includes("version.json") ? Response.json(publicRelease(record, null, "production"), { headers: { "Cache-Control": "no-store" } }) : new Response(html);
  await confirmPublicRelease(record, fetcher);
  await assert.rejects(confirmPublicRelease(record, async (url) => url.includes("version.json") ? Response.json(publicRelease(record, null, "production"), { headers: { "Cache-Control": "no-store" } }) : new Response(html.replace(record.buildId, "old-build"))), /HTML/);
  await assert.rejects(confirmPublicRelease(record, async () => Response.json(publicRelease(record, null, "production"))), /not ready/);
});
