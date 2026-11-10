import { NextResponse } from "next/server";
import { authenticatePublication, confirmPublicRelease, recordPublication, matchesBuildSource } from "@/lib/release/publication";
import { deploymentEnvironment, publicRelease, readBuildRecord, RELEASE_HEADERS } from "@/lib/release/metadata";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const reply = (body: object, status = 200) => NextResponse.json(body, { status, headers: RELEASE_HEADERS });
  try {
    if (deploymentEnvironment() !== "production") return reply({ error: "publication_requires_production" }, 409);
    if (!request.headers.get("content-type")?.includes("application/json")) return reply({ error: "invalid_request" }, 400);
    const reader = request.body?.getReader();
    if (!reader) return reply({ error: "invalid_request" }, 400);
    const chunks = []; let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 2048) { await reader.cancel(); return reply({ error: "invalid_request" }, 413); }
      chunks.push(value);
    }
    let body: { releaseId?: string; sourceHash?: string; commit?: string };
    try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { return reply({ error: "invalid_request" }, 400); }
    let verificationId: string;
    try { verificationId = await authenticatePublication(request.headers.get("authorization")?.replace(/^Bearer /, "") ?? ""); }
    catch { return reply({ error: "unauthorized" }, 401); }
    const build = readBuildRecord();
    if (body?.releaseId !== build.releaseId || !matchesBuildSource(build, body)) return reply({ error: "release_mismatch" }, 409);
    await confirmPublicRelease(build);
    const publication = await recordPublication(build, verificationId);
    return reply(publicRelease(build, publication, "production"));
  } catch {
    return reply({ error: "publication_confirmation_unavailable" }, 503);
  }
}
