import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

export const RELEASE_HEADERS = { "Cache-Control": "no-store, max-age=0", "CDN-Cache-Control": "no-store", "Surrogate-Control": "no-store", Pragma: "no-cache", Expires: "0" };
export const PUBLIC_ORIGIN = "https://wideorder.net";
export type BuildRecord = { application: "WideOrder"; version: string; commit?: string; buildId: string; releaseId: string; sourceHash: string; buildStartedAt: string; buildTime: string };
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
