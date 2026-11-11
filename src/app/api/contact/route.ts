import { NextResponse } from "next/server";
import { checkAndRecordContactAttempt } from "@/lib/contact-rate-limit";
import { submitInquiry } from "@/lib/inquiries/submit";
import { isTrustedAdminOrigin } from "@/lib/managed-config/admin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };
export function GET() { return NextResponse.json({ ok: false, error: "method_not_allowed" }, { status: 405, headers: { ...headers, Allow: "POST" } }); }
export async function POST(request: Request) {
  if (!isTrustedAdminOrigin(request)) return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 403, headers });
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const limit = checkAndRecordContactAttempt(clientIp);
  if (!limit.allowed) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429, headers: { ...headers, "Retry-After": String(limit.retryAfterSeconds) } });
  try {
    if (!request.headers.get("content-type")?.includes("application/json")) throw new Error("invalid_request");
    const reader = request.body?.getReader();
    if (!reader) throw new Error("invalid_request");
    let text = "";
    let size = 0;
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 32768) { await reader.cancel(); throw new Error("too_large"); }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    const result = await submitInquiry(JSON.parse(text), clientIp);
    return NextResponse.json(result.body, { status: result.status, headers });
  } catch { return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400, headers }); }
}
