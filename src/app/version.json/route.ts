import { NextResponse } from "next/server";
import { currentRelease, RELEASE_HEADERS } from "@/lib/release/metadata";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export async function GET() {
  try {
    return NextResponse.json(await currentRelease(), { headers: RELEASE_HEADERS });
  } catch {
    return NextResponse.json({ application: "WideOrder", error: "release_metadata_unavailable" }, { status: 503, headers: RELEASE_HEADERS });
  }
}
