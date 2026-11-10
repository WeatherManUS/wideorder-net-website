import { sourceFingerprint } from "./release-context.mjs";
import { execFileSync } from "node:child_process";
import { verifyHtmlFooter } from "../src/lib/release/publication.ts";

const origin = "https://wideorder.net";
const sourceHash = sourceFingerprint();
const commit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const maximumWait = 25 * 60 * 1000;
const started = Date.now();
const wait = (duration) => new Promise((resolve) => setTimeout(resolve, duration));
console.log("[release] deployment verification started; waiting for the expected source artifact to answer publicly.");
while (Date.now() - started < maximumWait) {
  try {
    const response = await fetch(`${origin}/version.json?verification=${Date.now()}`, { cache: "no-store", redirect: "error", headers: { "Cache-Control": "no-cache, no-store" }, signal: AbortSignal.timeout(15000) });
    if (!response.ok || !response.headers.get("cache-control")?.includes("no-store")) throw new Error("Version endpoint not ready or cache headers missing.");
    const live = await response.json();
    if (!(live.buildId?.startsWith(`${commit.slice(0, 12)}-`) || live.buildId === `source-${sourceHash.slice(0, 16)}`) || live.environment !== "production" || !live.releaseId) throw new Error("The previous release is still serving.");
    const tokenUrl = new URL(process.env.ACTIONS_ID_TOKEN_REQUEST_URL || "https://invalid.invalid");
    if (tokenUrl.protocol !== "https:" || !process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN) throw new Error("GitHub Actions OIDC permission is required.");
    tokenUrl.searchParams.set("audience", "wideorder-release-publication");
    const tokenResponse = await fetch(tokenUrl, { headers: { Authorization: `Bearer ${process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}` }, signal: AbortSignal.timeout(15000) });
    if (!tokenResponse.ok) throw new Error("GitHub deployment identity unavailable.");
    const { value: token } = await tokenResponse.json();
    if (typeof token !== "string") throw new Error("GitHub deployment identity missing.");
    const confirmed = await fetch(`${origin}/api/release-publication`, {
      method: "POST", redirect: "error", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ releaseId: live.releaseId, sourceHash, commit }), signal: AbortSignal.timeout(45000),
    });
    if (!confirmed.ok) throw new Error(`Publication confirmation returned HTTP ${confirmed.status}.`);
    const recorded = await confirmed.json();
    const finalResponse = await fetch(`${origin}/version.json?verification=${Date.now()}`, { cache: "no-store", headers: { "Cache-Control": "no-cache, no-store" }, signal: AbortSignal.timeout(15000) });
    const final = await finalResponse.json();
    if (!finalResponse.ok || !finalResponse.headers.get("cache-control")?.includes("no-store") || final.releaseId !== live.releaseId || !final.publishedAt || final.publishedAt !== recorded.publishedAt) throw new Error("Final public verification did not agree.");
    const page = await fetch(`${origin}/?release-verification=${final.releaseId}`, { cache: "no-store", headers: { "Cache-Control": "no-cache, no-store" }, signal: AbortSignal.timeout(15000) });
    if (!page.ok) throw new Error("Final public HTML is unavailable.");
    verifyHtmlFooter(await page.text(), final);
    console.log(`[release] deployment completed and publicly verified: ${final.version} / ${final.buildId}; publishedAt=${final.publishedAt}`);
    process.exit(0);
  } catch (error) {
    // No tokens, response bodies, environment values, or private hosting details enter logs.
    console.log(`[release] not yet confirmed: ${error.message}`);
    await wait(15000);
  }
}
throw new Error("Deployment did not become verifiably public within 25 minutes; publication was not asserted.");
