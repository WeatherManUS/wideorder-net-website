import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { allocate, artifactRelease, nextVersion, parseHistory, versionParts } from "./ledger.ts";
import { changelog } from "../../../scripts/release-ledger.mjs";

const baseline = JSON.parse(readFileSync(new URL("../../../releases/baseline.json", import.meta.url), "utf8"));
const phase = { major: 0, minor: 1 };
const candidate = { type: "allocated", attemptId: "10.1", commit: "a".repeat(40), releaseId: "artifact-a", buildId: "build-a", status: "verifying", description: "A styling update", publishedAt: null };
test("baseline preserves the actual original identifier, commit and UTC publication", () => {
  assert.equal(baseline.originalIdentifier, "0.1.0");
  assert.equal(baseline.version, "0.1.0001");
  assert.equal(nextVersion([baseline], phase), "0.1.0002");
  assert.deepEqual(versionParts("0.1.0002"), { major: 0, minor: 1, release: 2 });
  for (const invalid of ["v0.1.0002", "0.1.2", "0.1.0000", "0.1.10000", "00.1.0002"]) assert.throws(() => versionParts(invalid));
});
test("build failures and previews do not consume releases; an allocation is not publication", () => {
  const events = [baseline, { ...candidate, type: "started" }, { ...candidate, type: "failed", status: "failed" }];
  assert.equal(nextVersion(events, phase), "0.1.0002");
  const reservation = allocate(events, { ...candidate, attemptId: "11.1" }, phase);
  assert.equal(reservation.version, "0.1.0002");
  assert.equal(reservation.publishedAt, null);
  assert.equal(reservation.previousVersion, "0.1.0001");
});
test("simultaneous candidates cannot share an unresolved reservation", () => {
  const first = allocate([baseline], candidate, phase);
  assert.throws(() => allocate([baseline, first], { ...candidate, attemptId: "11.1", releaseId: "artifact-b" }, phase), /unresolved/);
  assert.deepEqual(allocate([baseline, first], candidate, phase), first);
  const published = { ...first, type: "published", status: "published", publishedAt: "2026-11-10T20:00:00.000Z" };
  const second = allocate([baseline, first, published], { ...candidate, attemptId: "11.1", releaseId: "artifact-b" }, phase);
  assert.equal(second.version, "0.1.0003");
});
test("failed reservations can be retried without advancing the successful-release counter", () => {
  const first = allocate([baseline], candidate, phase);
  const events = [baseline, first, { ...first, type: "failed", status: "failed" }];
  assert.equal(artifactRelease(events, candidate.releaseId), null);
  const retry = allocate(events, { ...candidate, attemptId: "11.1" }, phase);
  assert.equal(retry.version, first.version);
  assert.equal(artifactRelease([...events, retry], candidate.releaseId).attemptId, "11.1");
});
test("explicit phase changes reset release; overflow and phase decreases fail closed", () => {
  assert.equal(nextVersion([baseline], { major: 0, minor: 2 }), "0.2.0001");
  assert.equal(nextVersion([baseline], { major: 1, minor: 0 }), "1.0.0001");
  assert.throws(() => nextVersion([baseline], { major: 0, minor: 0 }), /decrease/);
  assert.throws(() => nextVersion([baseline, { ...baseline, type: "published", version: "0.1.9999" }], phase), /exhausted/);
});
test("rollback restores original artifact publication without incrementing the counter", () => {
  const first = allocate([baseline], candidate, phase);
  const publication = { ...first, type: "published", status: "published", publishedAt: "2026-11-10T20:00:00.000Z" };
  const events = [baseline, first, publication, { ...baseline, type: "rollback", rollbackReference: baseline.releaseId }];
  assert.deepEqual(artifactRelease(events, candidate.releaseId), publication);
  assert.equal(artifactRelease(events, baseline.releaseId).version, baseline.version);
  assert.equal(nextVersion(events, phase), "0.1.0003");
});
test("machine history and generated changelog retain failures, original identity and rollback references", () => {
  const events = [baseline, { ...candidate, type: "failed", status: "failed", rollbackReference: baseline.releaseId }];
  assert.deepEqual(parseHistory(events.map(event => JSON.stringify(event)).join("\n")), events);
  assert.throws(() => parseHistory(JSON.stringify(candidate)), /baseline/);
  const text = changelog(events);
  assert.ok(text.includes("Original identifier: v0.1.0"));
  assert.ok(text.includes("failed"));
  assert.ok(text.includes(baseline.releaseId));
});
