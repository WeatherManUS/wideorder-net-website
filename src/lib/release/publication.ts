import { createPublicKey, verify, randomUUID, type webcrypto } from "node:crypto";
import { link, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { PUBLIC_ORIGIN, readPublication, releaseDirectory, type BuildRecord, type Publication } from "./metadata.ts";

const ISSUER = "https://token.actions.githubusercontent.com";
const REPOSITORY = "WeatherManUS/wideorder-net-website";
export const OIDC_AUDIENCE = "wideorder-release-publication";
export function matchesBuildSource(build: BuildRecord, expected: { commit?: string; sourceHash?: string }) {
  if (build.commit) return /^[a-f\d]{40,64}$/.test(build.commit) && build.commit === expected.commit;
  return build.sourceHash === expected.sourceHash;
}
type Claims = { iss: string; aud: string; repository: string; repository_id: string; repository_owner_id: string; ref: string; workflow_ref: string; event_name: string; run_id: string; run_attempt: string; iat: number; nbf: number; exp: number };
type SigningKey = webcrypto.JsonWebKey & { kid?: string; alg?: string };
let keys: SigningKey[] = [];
let keysFetchedAt = 0;

export function validateClaims(claims: Claims, now = Date.now()) {
  const time = Math.floor(now / 1000);
  if (claims.iss !== ISSUER || claims.aud !== OIDC_AUDIENCE || claims.repository !== REPOSITORY || claims.repository_id !== "1413811290" || claims.repository_owner_id !== "247812451"
    || claims.ref !== "refs/heads/main" || claims.workflow_ref !== `${REPOSITORY}/.github/workflows/publication.yml@refs/heads/main`
    || !["push", "workflow_dispatch"].includes(claims.event_name) || !/^\d+$/.test(claims.run_id) || !/^\d+$/.test(claims.run_attempt)
    || ![claims.iat, claims.nbf, claims.exp].every(Number.isSafeInteger) || claims.exp <= time || claims.nbf > time + 30 || claims.iat > time + 30 || claims.exp - claims.iat > 600 || claims.iat < time - 600) throw new Error("Unauthorized publication identity.");
}

export async function authenticatePublication(token: string, fetcher: typeof fetch = fetch, now = Date.now()) {
  if (token.length > 12000 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) throw new Error("Invalid publication token.");
  const [encodedHeader, encodedClaims, signature] = token.split(".");
  const header = JSON.parse(Buffer.from(encodedHeader, "base64url").toString("utf8"));
  const claims = JSON.parse(Buffer.from(encodedClaims, "base64url").toString("utf8")) as Claims;
  if (header.alg !== "RS256" || header.typ !== "JWT" || typeof header.kid !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(header.kid)) throw new Error("Invalid signing algorithm.");
  validateClaims(claims, now);
  if (!keys.length || now - keysFetchedAt > 300000 || (!keys.some((key) => key.kid === header.kid) && now - keysFetchedAt > 60000)) {
    const response = await fetcher(`${ISSUER}/.well-known/jwks`, { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error("Signing keys unavailable.");
    const data = await response.json() as { keys: SigningKey[] };
    if (!Array.isArray(data.keys) || data.keys.length > 20) throw new Error("Invalid signing keys.");
    keys = data.keys;
    keysFetchedAt = now;
  }
  const key = keys.find((candidate) => candidate.kid === header.kid && candidate.kty === "RSA" && (!candidate.alg || candidate.alg === "RS256"));
  if (!key || !verify("RSA-SHA256", Buffer.from(`${encodedHeader}.${encodedClaims}`), createPublicKey({ key, format: "jwk" }), Buffer.from(signature, "base64url"))) throw new Error("Invalid publication signature.");
  return `${claims.run_id}.${claims.run_attempt}`;
}

export function htmlReleaseIdentity(html: string) {
  const found: Record<string, string> = {};
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const name = /\bname=["']([^"']+)["']/i.exec(tag)?.[1];
    const value = /\bcontent=["']([^"']*)["']/i.exec(tag)?.[1];
    if (name?.startsWith("wideorder-") && value) found[name] = value;
  }
  return found;
}

export function verifyHtmlFooter(html: string, expected: { version: string; releaseId: string; publishedAt: string | null }) {
  const footer = /<footer\b[^>]*>[\s\S]*?<\/footer>/i.exec(html)?.[0] ?? "";
  const enabled = /\bdata-footer-version-enabled=["']([^"']+)["']/i.exec(footer)?.[1];
  if (enabled === "false") return false; // The single display flag may deliberately hide this line.
  if (enabled !== "true") throw new Error("Server-rendered footer release visibility is missing.");
  const releaseId = /\bdata-footer-release=["']([^"']+)["']/i.exec(footer)?.[1];
  const version = /\bdata-release-version=["']([^"']+)["']/i.exec(footer)?.[1];
  const publishedAt = /<time\b[^>]*\bdatetime=["']([^"']+)["']/i.exec(footer)?.[1] ?? null;
  if (releaseId !== expected.releaseId || version !== expected.version || publishedAt !== expected.publishedAt) throw new Error("Server-rendered footer differs from the release endpoint.");
  return true;
}

export async function confirmPublicRelease(build: BuildRecord, fetcher: typeof fetch = fetch) {
  const options: RequestInit = { cache: "no-store", redirect: "error", headers: { "Cache-Control": "no-cache, no-store" }, signal: AbortSignal.timeout(15000) };
  const response = await fetcher(`${PUBLIC_ORIGIN}/version.json?verification=${build.releaseId}`, options);
  if (!response.ok || !response.headers.get("cache-control")?.includes("no-store")) throw new Error("Public release is not ready.");
  const live = await response.json() as Record<string, unknown>;
  if (live.releaseId !== build.releaseId || live.buildId !== build.buildId || live.version !== build.version || live.environment !== "production") throw new Error("Public release differs from this artifact.");
  const page = await fetcher(`${PUBLIC_ORIGIN}/?release-verification=${build.releaseId}`, options);
  if (!page.ok) throw new Error("Public application is not ready.");
  const tags = htmlReleaseIdentity(await page.text());
  if (tags["wideorder-version"] !== build.version || tags["wideorder-build"] !== build.buildId || tags["wideorder-release"] !== build.releaseId) throw new Error("Public HTML differs from the release endpoint.");
}

export async function recordPublication(build: BuildRecord, verificationId: string, directory = releaseDirectory(), now = new Date()) {
  const existing = readPublication(build, directory);
  if (existing) return existing; // A restart, verifier retry or rollback never rewrites original publication.
  if (!/^\d+\.\d+$/.test(verificationId) || now.toISOString() < build.buildTime) throw new Error("Invalid publication observation.");
  const publication: Publication = { releaseId: build.releaseId, publishedAt: now.toISOString(), verificationId };
  const temporary = path.join(directory, `.publication-${randomUUID()}.tmp`);
  const destination = path.join(directory, "release-publication.json");
  await writeFile(temporary, JSON.stringify(publication) + "\n", { flag: "wx", mode: 0o600 });
  try {
    // An atomic create-if-absent prevents races and readers seeing a partial JSON record.
    await link(temporary, destination);
  } catch (error) {
    const winner = readPublication(build, directory);
    if (winner) return winner;
    throw error;
  } finally { await unlink(temporary); }
  return publication;
}
