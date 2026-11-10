import { durableArtifactRelease, versionParts } from "./ledger.ts";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

export const RELEASE_HEADERS = { "Cache-Control": "no-store, max-age=0", "CDN-Cache-Control": "no-store", "Surrogate-Control": "no-store", Pragma: "no-cache", Expires: "0" };
export const PUBLIC_ORIGIN = "https://wideorder.net";
export type BuildRecord = { application: "WideOrder"; version: string; versionPolicy?: number; phase?: { major: number; minor: number }; commit?: string; buildId: string; releaseId: string; sourceHash: string; buildStartedAt: string; buildTime: string };
export type Publication = { releaseId: string; publishedAt: string; verificationId: string };
export function releaseDirectory() { return process.env.WIDEORDER_RELEASE_DIRECTORY || path.join(process.cwd(), ".release"); }
export function releaseIdentity() {
  return { version: process.env.WIDEORDER_RELEASE_VERSION || "development", buildId: process.env.WIDEORDER_RELEASE_BUILD_ID || "development", releaseId: process.env.WIDEORDER_RELEASE_ID || "development" };
}
export const utcTimestamp = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
export function readBuildRecord(directory = releaseDirectory()): BuildRecord {
  const record = JSON.parse(readFileSync(path.join(directory, "release.json"), "utf8")) as BuildRecord;
  if (record.application !== "WideOrder" || !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.+-]+)?$/.test(record.version) || !/^(?:[a-f\d]{12}|source)-[a-f\d]{16}$/.test(record.buildId)
    || !/^[a-f\d-]{36}$/.test(record.releaseId) || !/^[a-f\d]{64}$/.test(record.sourceHash) || !utcTimestamp(record.buildStartedAt) || !utcTimestamp(record.buildTime) || record.buildTime < record.buildStartedAt) throw new Error("Invalid completed release metadata.");
  if (existsSync(path.join(directory, "BUILD_ID")) && readFileSync(path.join(directory, "BUILD_ID"), "utf8").trim() !== record.releaseId) throw new Error("Release artifact mismatch.");
  if (record.versionPolicy && (record.versionPolicy !== 1 || !/^[a-f\d]{40,64}$/.test(record.commit ?? "") || !record.phase || ![record.phase.major, record.phase.minor].every(value => Number.isSafeInteger(value) && value >= 0))) throw new Error("Invalid policy-managed artifact.");
  return record;
}
export function readPublication(record: BuildRecord, directory = releaseDirectory()): Publication | null {
  try {
    const value = JSON.parse(readFileSync(path.join(directory, "release-publication.json"), "utf8")) as Publication;
    return value.releaseId === record.releaseId && utcTimestamp(value.publishedAt) && value.publishedAt >= record.buildTime && /^\d+\.\d+$/.test(value.verificationId) ? value : null;
  } catch { return null; }
}
export function deploymentEnvironment() {
  const value = process.env.RELEASE_ENVIRONMENT || (process.env.NODE_ENV === "production" ? "production" : "development");
  if (!["production", "staging", "development"].includes(value)) throw new Error("Invalid release environment.");
  return value;
}
export function publicRelease(record: BuildRecord, publication: Publication | null, environment: string) {
  return { application: "WideOrder", version: record.version, buildId: record.buildId, releaseId: record.releaseId, buildStartedAt: record.buildStartedAt,
    buildTime: record.buildTime, publishedAt: environment === "production" ? publication?.publishedAt ?? null : null,
    publicationSource: environment === "production" && publication ? "github-actions-public-probe" : null, environment };
}

/** Shared by the endpoint and server-rendered footer; publication never falls back to build time. */
export async function currentRelease() {
  const environment = deploymentEnvironment();
  if (environment === "development" && process.env.NODE_ENV !== "production") return { application: "WideOrder", ...releaseIdentity(), buildStartedAt: null, buildTime: null, publishedAt: null, publicationSource: null, environment };
  const build = readBuildRecord();
  const identity = releaseIdentity();
  if (build.buildId !== identity.buildId || build.releaseId !== identity.releaseId || build.version !== identity.version) throw new Error("Compiled identity mismatch.");
  const value = publicRelease(build, readPublication(build), environment);
  if (!build.versionPolicy) return { ...value, ...legacyVersionParts(value.version), deploymentStatus: value.publishedAt ? "published" : "unverified" };
  const event = environment === "production" ? await durableArtifactRelease(build.releaseId) : null;
  if (event && (event.buildId !== build.buildId || event.commit !== build.commit || event.buildTime !== build.buildTime || (event.publishedAt && event.publishedAt < build.buildTime))) throw new Error("Durable artifact identity mismatch.");
  const version = event?.version ?? "unallocated";
  const publishedAt = event?.type === "published" ? event.publishedAt ?? null : null;
  const parts = event?.version ? versionParts(event.version) : { ...build.phase!, release: null };
  return { ...value, versionPolicy: 1, version, ...parts, publishedAt,
    publicationSource: publishedAt ? "github-actions-public-probe" : null,
    deploymentStatus: publishedAt ? "published" : event ? "verifying" : "awaiting-allocation" };
}
function legacyVersionParts(version: string) {
  const [major, minor, release] = version.split(".").map(Number);
  return { major, minor, release };
}
