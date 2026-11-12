import { settingsReturnPath } from "@/lib/settings-navigation";
import { NextResponse } from "next/server";
import { boundedAdminForm } from "@/lib/access/request";
import { consumeSensitiveGrant, auditSecurity, readAccessState } from "@/lib/access/state";

import {
  ADMIN_NO_STORE_HEADERS,
  buildClearedSessionCookie,
  buildTrustedAdminUrl,
  changeAdminPassword,
  getAuthenticatedAdminFromRequest,
  isTrustedAdminOrigin,
} from "@/lib/managed-config/admin";
import { MANAGED_SETTING_DEFINITIONS } from "@/lib/managed-config/definitions";
import { updateManagedSettings } from "@/lib/managed-config/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const destination = (path: string) => buildTrustedAdminUrl(request, settingsReturnPath(request.url, path));
  if (!isTrustedAdminOrigin(request)) {
    return NextResponse.redirect(destination("/admin/settings?error=csrf"), {
      status: 303,
      headers: ADMIN_NO_STORE_HEADERS,
    });
  }

  const admin = await getAuthenticatedAdminFromRequest(request);

  if (!admin) {
    return NextResponse.redirect(destination("/admin/login?error=unauthenticated"), {
      status: 303,
      headers: ADMIN_NO_STORE_HEADERS,
    });
  }

  try { await consumeSensitiveGrant(admin.sessionId, "settings"); }
  catch (error) { const key = error instanceof Error && error.message === "fresh_login_required" ? "fresh_login_required" : "fresh_verification_required"; return NextResponse.redirect(destination(`/admin/settings?error=${key}`), { status: 303, headers: ADMIN_NO_STORE_HEADERS }); }
  let formData;
  try { formData = await boundedAdminForm(request); } catch { return NextResponse.redirect(destination("/admin/settings?error=invalid_setting"), { status: 303, headers: ADMIN_NO_STORE_HEADERS }); }
  const action = typeof formData.get("action") === "string" ? String(formData.get("action")) : "save_settings";

  if (action === "change_password") {
    const access = await readAccessState();
    if (access.mode !== "transitional" || access.credentials.length) return NextResponse.redirect(destination("/admin/settings?error=password_change_disabled"), { status: 303, headers: ADMIN_NO_STORE_HEADERS });
    const result = await changeAdminPassword({
      currentPassword: typeof formData.get("currentPassword") === "string" ? String(formData.get("currentPassword")) : "",
      newPassword: typeof formData.get("newPassword") === "string" ? String(formData.get("newPassword")) : "",
      confirmNewPassword: typeof formData.get("confirmNewPassword") === "string" ? String(formData.get("confirmNewPassword")) : "",
      adminIdentity: admin.email,
    });

    if (!result.ok) {
      return NextResponse.redirect(destination(`/admin/settings?error=${result.error}`), {
        status: 303,
        headers: ADMIN_NO_STORE_HEADERS,
      });
    }

    const status = result.credentialSourceBeforeChange === "bootstrap" ? "password_initialized" : "password_changed";
    const response = NextResponse.redirect(destination(`/admin/login?status=${status}`), {
      status: 303,
      headers: ADMIN_NO_STORE_HEADERS,
    });
    response.cookies.set(buildClearedSessionCookie());
    return response;
  }

  const inputs = Object.fromEntries(
    MANAGED_SETTING_DEFINITIONS.filter(definition => formData.has(definition.key) && definition.key !== "RESEND_API_KEY").map((definition) => [definition.key, typeof formData.get(definition.key) === "string" ? String(formData.get(definition.key)) : ""]),
  );

  try {
    await updateManagedSettings(inputs, admin.email);
    await auditSecurity("settings_changed", "success", { sessionId: admin.sessionId });
    return NextResponse.redirect(destination("/admin/settings?status=saved"), {
      status: 303,
      headers: ADMIN_NO_STORE_HEADERS,
    });
  } catch {
    return NextResponse.redirect(destination("/admin/settings?error=invalid_setting"), {
      status: 303,
      headers: ADMIN_NO_STORE_HEADERS,
    });
  }
}
