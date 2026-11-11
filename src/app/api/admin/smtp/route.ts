import { NextResponse } from "next/server";
import { ADMIN_NO_STORE_HEADERS, buildTrustedAdminUrl, getAuthenticatedAdminFromRequest, isTrustedAdminOrigin } from "@/lib/managed-config/admin";
import { getSmtpConfig } from "@/lib/managed-config/service";
import { validateSmtpConfig } from "@/lib/smtp/config";
import { runSmtpTest } from "@/lib/inquiries/smtp-tests";
import { drainInquiryQueue, retryInquiry } from "@/lib/inquiries/queue";
import { takeRequestSlot } from "@/lib/inquiries/store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const redirect = (key: string, error = false) => NextResponse.redirect(buildTrustedAdminUrl(request, `/admin/settings?${error ? "error" : "status"}=${key}`), { status: 303, headers: ADMIN_NO_STORE_HEADERS });
  if (!isTrustedAdminOrigin(request)) return NextResponse.json({ error: "csrf" }, { status: 403, headers: ADMIN_NO_STORE_HEADERS });
  try {
    const admin = await getAuthenticatedAdminFromRequest(request);
    if (!admin) return NextResponse.json({ error: "unauthenticated" }, { status: 401, headers: ADMIN_NO_STORE_HEADERS });
    if (!await takeRequestSlot(`smtp:${admin.email}`, 3, 60000)) return redirect("rate_limited", true);
    const form = await request.formData();
    const action = form.get("action");
    if (action === "retry_inquiry") {
      const reference = String(form.get("reference") || "");
      const changed = await retryInquiry(reference);
      return redirect(changed ? "retry_scheduled" : "retry_blocked", !changed);
    }
    const config = await getSmtpConfig();
    if (action === "retry_queue") { if (!validateSmtpConfig(config, false)) return redirect("smtp_not_configured", true); await drainInquiryQueue(); return redirect("queue_processed"); }
    if (!["test_connection", "send_test"].includes(String(action))) return redirect("invalid_setting", true);
    const result = await runSmtpTest(config, action === "test_connection" ? "connection_test" : "test_email");
    return redirect(result.key, result.error);
  } catch { return redirect("smtp_test_failed", true); }
}
