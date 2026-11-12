import { NextResponse } from "next/server";
import { ADMIN_NO_STORE_HEADERS, buildSessionCookie, buildClearedSessionCookie, getEnrollmentAdminFromRequest } from "@/lib/managed-config/admin";
import { takeRequestSlot } from "@/lib/inquiries/store";
import { accessView, ceremonyOptions, ceremonyVerify, manageAccess, redeemRecovery, relyingParty, FLOW_COOKIE } from "@/lib/access/webauthn";
import { auditSecurity } from "@/lib/access/state";
import { redeemHostingerRecovery } from "@/lib/access/hostinger-recovery";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const safeErrors = new Set(["origin_rejected", "invalid_request", "unauthenticated", "recovery_restricted", "credential_limit", "credential_unknown", "credential_exists", "fresh_login_required", "fresh_verification_required", "state_changed", "challenge_rejected", "verification_failed", "confirmation_required", "remove_bootstrap_before_cutover", "backup_not_ready", "recovery_rejected", "rate_limited"]);
const json = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: ADMIN_NO_STORE_HEADERS });
async function body(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.startsWith("application/json") || Number(request.headers.get("content-length") || 0) > 65536) throw new Error("invalid_request");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("invalid_request");
  const parts: Uint8Array[] = []; let size = 0;
  while (true) { const result = await reader.read(); if (result.done) break; size += result.value.byteLength; if (size > 65536) { await reader.cancel(); throw new Error("invalid_request"); } parts.push(result.value); }
  const value = JSON.parse(Buffer.concat(parts).toString("utf8"));
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid_request");
  return value;
}
export async function GET(request: Request) {
  try { const admin = await getEnrollmentAdminFromRequest(request); return admin ? json(await accessView(admin.sessionId)) : json({ error: "unauthenticated" }, 401); }
  catch { return json({ error: "service_unavailable" }, 503); }
}
export async function POST(request: Request) {
  try {
    relyingParty(request);
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!await takeRequestSlot(`webauthn-ip:${ip}`, 80, 300000) || !await takeRequestSlot("webauthn-account", 200, 300000)) return json({ error: "rate_limited" }, 429);
    const input = await body(request);
    if (input.operation === "hostinger_recovery") {
      const session = await redeemHostingerRecovery(request, input.password, input.confirmed);
      const response = json({ redirect: "/admin/enroll" });
      response.cookies.set(buildSessionCookie(session.token, session.expiresAt));
      return response;
    }
    if (input.operation === "options") {
      const result = await ceremonyOptions(request, input);
      const response = json({ options: result.options, ceremonyId: result.ceremonyId });
      response.cookies.set({ name: FLOW_COOKIE, value: result.token, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/api/admin/access", maxAge: 120 });
      return response;
    }
    if (input.operation === "verify") {
      const result = await ceremonyVerify(request, input);
      const response = json({ ok: true, redirect: "redirect" in result ? result.redirect : undefined });
      response.cookies.set({ name: FLOW_COOKIE, value: "", httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/api/admin/access", maxAge: 0 });
      if ("session" in result && result.session) response.cookies.set(buildSessionCookie(result.session.token, result.session.expiresAt));
      return response;
    }
    if (input.operation === "redeem_recovery") {
      try { const session = await redeemRecovery(request, input.token); const response = json({ redirect: "/admin/enroll" }); response.cookies.set(buildSessionCookie(session.token, session.expiresAt)); return response; }
      catch { await auditSecurity("recovery_token_redeemed", "failure"); throw new Error("recovery_rejected"); }
    }
    if (input.operation === "manage") {
      const admin = await getEnrollmentAdminFromRequest(request);
      if (!admin) return json({ error: "unauthenticated" }, 401);
      const result = await manageAccess(admin.sessionId, input);
      const response = json(result);
      if ("redirect" in result) response.cookies.set(buildClearedSessionCookie());
      return response;
    }
    return json({ error: "invalid_request" }, 400);
  } catch (error) {
    const code = error instanceof Error && safeErrors.has(error.message) ? error.message : "service_unavailable";
    return json({ error: code }, code === "rate_limited" ? 429 : code === "origin_rejected" ? 403 : code === "unauthenticated" ? 401 : code === "service_unavailable" ? 503 : 400);
  }
}
