import { readFileSync, appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { allocate, artifactRelease, versionParts } from "../src/lib/release/ledger.ts";
import { htmlReleaseIdentity, verifyHtmlFooter } from "../src/lib/release/publication.ts";
import { releaseRoutes } from "./release-routes.mjs";
import { appendEvent, loadLedger, github } from "./release-ledger.mjs";

const origin = "https://wideorder.net";
const policy = JSON.parse(readFileSync(new URL("../release-policy.json", import.meta.url), "utf8"));
const ref = process.env.RELEASE_REF || "HEAD";
const commit = execFileSync("git", ["rev-parse", "--verify", `${ref}^{commit}`], { encoding: "utf8" }).trim();
const attemptId = `${process.env.GITHUB_RUN_ID}.${process.env.GITHUB_RUN_ATTEMPT}`;
if (!/^\d+\.\d+$/.test(attemptId) || !process.env.GITHUB_TOKEN) throw new Error("A GitHub Actions release identity and repository token are required.");
const description = execFileSync("git", ["show", "-s", "--format=%s", commit], { encoding: "utf8" }).trim().slice(0, 240);
const eventBase = { attemptId, commit, description, recordedAt: new Date().toISOString(), publishedAt: null, previousVersion: null, rollbackReference: null };

async function failAttempt() {
  await appendEvent(events => {
    if (events.some(event => event.attemptId === attemptId && ["failed", "verification_failed"].includes(event.type))) return null;
    const attempt = events.filter(event => event.attemptId === attemptId).at(-1);
    if (!attempt) return { ...eventBase, type: "failed", status: "failed", previousVersion: events.filter(event => ["baseline", "published", "rollback"].includes(event.type)).at(-1)?.version ?? null, description: `${description} (workflow failed before artifact verification)` };
    const published = events.some(event => event.type === "published" && event.releaseId === attempt.releaseId && attempt.releaseId);
    return { ...attempt, type: published ? "verification_failed" : "failed", status: published ? "verification-failed-after-publication" : "failed", recordedAt: new Date().toISOString() };
  });
  const ledger = await loadLedger();
  const attempt = ledger.events.filter(event => event.attemptId === attemptId).at(-1);
  const report = `## WideOrder Deployment\n\n- Previous version: ${attempt?.previousVersion || "none"}\n- New version: ${attempt?.version ? `v${attempt.version} (see status; not a new success claim)` : "Not allocated"}\n- Phase: ${policy.major}.${policy.minor}\n- Git commit: ${commit}\n- Published at: ${attempt?.publishedAt || "Not verified"}\n- Deployment status: ${attempt?.status || "Unable to verify"}\n- Changes included: ${description}\n- Footer verification: No\n- /version.json verification: No\n`;
  console.log(report);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
}
if (process.argv[2] === "fail") { await failAttempt(); process.exit(0); }
await appendEvent(events => events.some(event => event.type === "started" && event.attemptId === attemptId) ? null : { ...eventBase, type: "started", status: "waiting-for-hostinger", previousVersion: events.filter(event => ["baseline", "published", "rollback"].includes(event.type)).at(-1)?.version ?? null });
const options = () => ({ cache: "no-store", redirect: "error", headers: { "Cache-Control": "no-cache, no-store" }, signal: AbortSignal.timeout(15000) });
async function liveRelease() {
  const response = await fetch(`${origin}/version.json?verification=${Date.now()}`, options());
  if (!response.ok || !response.headers.get("cache-control")?.includes("no-store")) throw new Error("Version endpoint or cache control is not ready.");
  const live = await response.json();
  if (!live.buildId?.startsWith(`${commit.slice(0, 12)}-`) || live.environment !== "production" || !live.releaseId) throw new Error("Expected production artifact is not serving yet.");
  if (live.versionPolicy === 1 && live.version !== "unallocated") {
    const parts = versionParts(live.version);
    if (["major", "minor", "release"].some(key => live[key] !== parts[key])) throw new Error("Version components do not agree.");
  }
  return live;
}
async function verifyPage(live) {
  for (const route of releaseRoutes) {
    const page = await fetch(`${origin}${route}`, options());
    if (!page.ok || !page.headers.get("cache-control")?.includes("no-store")) throw new Error("Uncached initial HTML is not ready.");
    const html = await page.text();
    const tags = htmlReleaseIdentity(html);
    if (tags["wideorder-version"] !== live.version || tags["wideorder-build"] !== live.buildId || tags["wideorder-release"] !== live.releaseId) throw new Error("Initial HTML metadata differs from the endpoint.");
    if (!verifyHtmlFooter(html, live)) throw new Error(`Release footer is hidden on ${route}.`);
  }
  return true;
}
async function reconcileAbandonedReservation() {
  const { events } = await loadLedger();
  const pending = events.find(event => event.type === "allocated" && !events.some(end => end.attemptId === event.attemptId && ["published", "failed"].includes(end.type)));
  if (!pending || pending.attemptId === attemptId) return;
  if (!/^\d+\.\d+$/.test(pending.attemptId || "")) throw new Error("Invalid reservation owner.");
  const [run, attempt] = pending.attemptId.split(".");
  const state = await github(`/actions/runs/${run}/attempts/${attempt}`);
  if (state.status !== "completed" || !["failure", "cancelled", "timed_out", "startup_failure", "stale"].includes(state.conclusion)) return;
  await appendEvent(current => current.some(event => event.attemptId === pending.attemptId && ["published", "failed"].includes(event.type)) ? null : {
    ...pending, type: "failed", status: "failed", recordedAt: new Date().toISOString(),
    description: `${pending.description} (reconciled terminated GitHub attempt: ${state.conclusion})`,
  });
}
const started = Date.now();
try {
  while (Date.now() - started < 25 * 60 * 1000) {
    try {
      let live = await liveRelease();
      if (live.versionPolicy !== 1) throw new Error("This artifact predates automated release allocation; restore a tracked artifact for rollback.");
      await verifyPage(live);
      await reconcileAbandonedReservation();
      const allocated = await appendEvent(events => {
        const existing = artifactRelease(events, live.releaseId);
        if (existing) return existing;
        const latest = events.filter(event => ["baseline", "published"].includes(event.type)).at(-1);
        const phase = versionParts(latest.version);
        if ((policy.major !== phase.major || policy.minor !== phase.minor) && process.env.AUTHORIZE_PHASE !== `${policy.major}.${policy.minor}`) throw new Error("Explicit workflow phase authorization is required.");
        return allocate(events, { ...eventBase, type: "allocated", status: "verifying", releaseId: live.releaseId, buildId: live.buildId, buildTime: live.buildTime }, policy);
      });
      live = await liveRelease();
      if (live.releaseId !== allocated.releaseId || live.version !== allocated.version) throw new Error("Runtime has not observed the durable allocation yet.");
      await verifyPage(live);
      const published = await appendEvent(events => {
        const existing = artifactRelease(events, live.releaseId);
        if (existing?.type === "published" || existing?.type === "baseline") return existing;
        if (existing?.type !== "allocated" || existing.buildId !== live.buildId) throw new Error("Production reservation does not match this exact artifact.");
        return { ...existing, type: "published", status: "published", publishedAt: new Date().toISOString(), recordedAt: new Date().toISOString() };
      });
      const final = await liveRelease();
      if (final.releaseId !== published.releaseId || final.version !== published.version || final.publishedAt !== published.publishedAt) throw new Error("Final publication metadata has not propagated yet.");
      const footer = await verifyPage(final);
      if (process.env.RELEASE_REF) await appendEvent(events => events.some(event => event.type === "rollback" && event.attemptId === attemptId) ? null : {
        ...published, attemptId, type: "rollback", status: "rollback-verified", recordedAt: new Date().toISOString(),
        previousVersion: events.filter(event => ["baseline", "published", "rollback"].includes(event.type)).at(-1)?.version ?? null,
        rollbackReference: published.releaseId, description: `Verified restored artifact: ${description}`,
      });
      const time = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", dateStyle: "medium", timeStyle: "long" }).format(new Date(final.publishedAt));
      const report = `## WideOrder Deployment\n\n- Previous version: ${published.previousVersion || "none"}\n- New version: v${final.version}\n- Phase: ${final.major}.${final.minor}\n- Git commit: ${commit}\n- Published at: ${time}\n- Deployment status: Successful\n- Changes included: ${description}\n- Footer verification: ${footer ? "Yes" : "Hidden by configuration"}\n- /version.json verification: Yes\n`;
      console.log(report);
      if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
      process.exit(0);
    } catch (error) {
      console.log(`[release] awaiting verification: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 15000));
    }
  }
  throw new Error("Expected artifact was not verified within 25 minutes. No publication is asserted for a failed build.");
} catch (error) { await failAttempt(); throw error; }
