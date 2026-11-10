import { NextResponse } from "next/server";
import { deploymentEnvironment, publicRelease, readBuildRecord, readPublication, releaseIdentity, RELEASE_HEADERS } from "@/lib/release/metadata";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export function GET() {
  try {
    const environment = deploymentEnvironment();
    if (environment === "development" && process.env.NODE_ENV !== "production") return NextResponse.json({ application: "WideOrder", ...releaseIdentity(), buildStartedAt: null, buildTime: null, publishedAt: null, publicationSource: null, environment }, { headers: RELEASE_HEADERS });
    const build = readBuildRecord();
    const identity = releaseIdentity();
    if (build.buildId !== identity.buildId || build.releaseId !== identity.releaseId || build.version !== identity.version) throw new Error("Compiled identity mismatch.");
    return NextResponse.json(publicRelease(build, readPublication(build), environment), { headers: RELEASE_HEADERS });
  } catch {
    return NextResponse.json({ application: "WideOrder", error: "release_metadata_unavailable" }, { status: 503, headers: RELEASE_HEADERS });
  }
}
