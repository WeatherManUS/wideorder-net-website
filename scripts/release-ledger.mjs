import { readFileSync } from "node:fs";
import { parseHistory } from "../src/lib/release/ledger.ts";

const repository = "WeatherManUS/wideorder-net-website";
const branch = "release-history";
const base = `https://api.github.com/repos/${repository}`;
export async function github(route, body, method = "POST") {
  const response = await fetch(`${base}${route}`, {
    method: body === undefined ? "GET" : method,
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${process.env.GITHUB_TOKEN || ""}`, "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`Release ledger API HTTP ${response.status}.`);
  return response.json();
}
export function changelog(events) {
  return "# WideOrder release history\n\nGenerated from append-only history.jsonl. Times are UTC. Failed attempts do not consume a release.\n\n" + events.map(event =>
    `- **${event.version ? `v${event.version}` : "Unversioned attempt"} — ${event.status}** (${event.publishedAt || event.recordedAt || "historical baseline"})\n  ${event.description.replace(/[\r\n]/g, " ")}\n  Commit: \`${event.commit}\`; previous: ${event.previousVersion || "none"}; artifact: ${event.releaseId || "not built"}; rollback: ${event.rollbackReference || "none"}.${event.originalIdentifier ? ` Original identifier: v${event.originalIdentifier}.` : ""}\n`).join("\n");
}
export async function loadLedger() {
  const ref = await github(`/git/ref/heads/${branch}`);
  const commit = await github(`/git/commits/${ref.object.sha}`);
  const tree = await github(`/git/trees/${commit.tree.sha}`);
  const file = tree.tree.find(file => file.path === "history.jsonl");
  if (!file) throw new Error("Release history is missing.");
  const blob = await github(`/git/blobs/${file.sha}`);
  return { head: ref.object.sha, tree: commit.tree.sha, events: parseHistory(Buffer.from(blob.content, "base64").toString("utf8")) };
}
export async function initializeLedger() {
  try { return await loadLedger(); } catch (error) {
    if (!error.message.includes("HTTP 404")) throw error;
  }
  const baseline = JSON.parse(readFileSync(new URL("../releases/baseline.json", import.meta.url), "utf8"));
  const events = [baseline];
  const tree = await github("/git/trees", { tree: [
    { path: "history.jsonl", mode: "100644", type: "blob", content: JSON.stringify(baseline) + "\n" },
    { path: "CHANGELOG.md", mode: "100644", type: "blob", content: changelog(events) },
  ] });
  const commit = await github("/git/commits", { message: "Normalize v0.1.0 as v0.1.0001 baseline", tree: tree.sha, parents: [] });
  try { await github("/git/refs", { ref: `refs/heads/${branch}`, sha: commit.sha }); }
  catch (error) { if (!error.message.includes("HTTP 422")) throw error; }
  return loadLedger();
}
/** A sibling commit cannot fast-forward the ref: retry against the winner before allocation. */
export async function appendEvent(makeEvent) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const ledger = await initializeLedger();
    const event = makeEvent(ledger.events);
    if (!event || ledger.events.some(existing => JSON.stringify(existing) === JSON.stringify(event))) return event;
    const events = [...ledger.events, event];
    parseHistory(events.map(event => JSON.stringify(event)).join("\n"));
    const tree = await github("/git/trees", { base_tree: ledger.tree, tree: [
      { path: "history.jsonl", mode: "100644", type: "blob", content: events.map(event => JSON.stringify(event)).join("\n") + "\n" },
      { path: "CHANGELOG.md", mode: "100644", type: "blob", content: changelog(events) },
    ] });
    const commit = await github("/git/commits", { message: `Release ${event.version || event.attemptId}: ${event.status}`, tree: tree.sha, parents: [ledger.head] });
    try { await github(`/git/refs/heads/${branch}`, { sha: commit.sha, force: false }, "PATCH"); return event; }
    catch (error) { if (!/HTTP (409|422)/.test(error.message)) throw error; }
  }
  throw new Error("Concurrent release history updates did not settle; no counter was overwritten.");
}
