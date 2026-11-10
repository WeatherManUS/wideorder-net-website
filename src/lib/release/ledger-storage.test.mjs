import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { allocate, durableArtifactRelease, parseHistory } from "./ledger.ts";
import { appendEvent, changelog } from "../../../scripts/release-ledger.mjs";

const baseline = JSON.parse(readFileSync(new URL("../../../releases/baseline.json", import.meta.url), "utf8"));
test("Git compare-and-swap rejects a racing writer and preserves all prior events", async () => {
  const original = global.fetch;
  let serial = 1;
  const id = () => String(++serial).padStart(40, "0");
  let head = id();
  const commits = new Map();
  const trees = new Map();
  const blobs = new Map();
  function tree(files) {
    const sha = id();
    trees.set(sha, files.map(([path, content]) => { const blob = id(); blobs.set(blob, content); return { path, sha: blob }; }));
    return sha;
  }
  commits.set(head, { tree: { sha: tree([["history.jsonl", JSON.stringify(baseline) + "\n"], ["CHANGELOG.md", changelog([baseline])]]) } });
  let conflicts = 0;
  global.fetch = async (url, options) => {
    const route = new URL(url).pathname.split("/wideorder-net-website")[1];
    const body = options.body ? JSON.parse(options.body) : null;
    if (!body && route === "/git/ref/heads/release-history") return Response.json({ object: { sha: head } });
    if (!body && route.startsWith("/git/commits/")) return Response.json(commits.get(route.split("/").at(-1)));
    if (!body && route.startsWith("/git/trees/")) return Response.json({ tree: trees.get(route.split("/").at(-1)) });
    if (!body && route.startsWith("/git/blobs/")) return Response.json({ content: Buffer.from(blobs.get(route.split("/").at(-1))).toString("base64") });
    if (route === "/git/trees") return Response.json({ sha: tree(body.tree.map(file => [file.path, file.content])) });
    if (route === "/git/commits") { const sha = id(); commits.set(sha, { tree: { sha: body.tree }, parents: body.parents }); return Response.json({ sha }); }
    if (route === "/git/refs/heads/release-history") {
      assert.equal(body.force, false);
      if (commits.get(body.sha).parents[0] !== head) { conflicts++; return Response.json({}, { status: 422 }); }
      head = body.sha; return Response.json({ object: { sha: head } });
    }
    throw new Error(`Unexpected test route ${route}`);
  };
  try {
    const make = (attempt, artifact) => events => allocate(events, { type: "allocated", status: "verifying", attemptId: attempt, releaseId: artifact, buildId: artifact, commit: "a".repeat(40), description: "Race fixture", publishedAt: null }, { major: 0, minor: 1 });
    const result = await Promise.allSettled([appendEvent(make("100.1", "a")), appendEvent(make("101.1", "b"))]);
    assert.equal(result.filter(value => value.status === "fulfilled").length, 1);
    assert.equal(result.filter(value => value.status === "rejected").length, 1);
    assert.ok(conflicts >= 1, "The race must exercise an actual rejected fast-forward.");
    const file = trees.get(commits.get(head).tree.sha).find(file => file.path === "history.jsonl");
    const events = parseHistory(blobs.get(file.sha));
    assert.equal(events.length, 2);
    assert.deepEqual(events[0], baseline);
    assert.equal(events[1].version, "0.1.0002");
  } finally { global.fetch = original; }
});
test("restored artifacts recover publication from durable history and retain original time", async () => {
  const original = global.fetch;
  const publication = { ...baseline, type: "published", version: "0.1.0002", releaseId: "restored-fixture", buildId: "restored-build", publishedAt: "2026-11-10T20:01:00.000Z" };
  let requests = 0;
  global.fetch = async (url, options) => {
    assert.ok(url.startsWith("https://raw.githubusercontent.com/WeatherManUS/wideorder-net-website/release-history/history.jsonl?read="));
    assert.equal(options.cache, "no-store"); requests++;
    return new Response([baseline, publication].map(event => JSON.stringify(event)).join("\n"));
  };
  try {
    assert.deepEqual(await durableArtifactRelease(publication.releaseId), publication);
    assert.deepEqual(await durableArtifactRelease(publication.releaseId), publication);
    assert.equal(requests, 1, "Immutable published records should not depend on repeated remote availability.");
    assert.equal(await durableArtifactRelease("unknown-artifact"), null);
  } finally { global.fetch = original; }
});
