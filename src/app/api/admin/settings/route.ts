import { NextResponse } from "next/server";

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
  if (!isTrustedAdminOrigin(request)) {
    return NextResponse.redirect(buildTrustedAdminUrl(request, "/admin/settings?error=csrf"), {
      status: 303,
      headers: ADMIN_NO_STORE_HEADERS,
    });
  }

  const admin = await getAuthenticatedAdminFromRequest(request);

  if (!admin) {
    return NextResponse.redirect(buildTrustedAdminUrl(request, "/admin/login?error=unauthenticated"), {
      status: 303,
      headers: ADMIN_NO_STORE_HEADERS,
    });
  }

  const formData = await request.formData();
  const action = typeof formData.get("action") === "string" ? String(formData.get("action")) : "save_settings";

  if (action === "change_password") {
    const result = await changeAdminPassword({
      currentPassword: typeof formData.get("currentPassword") === "string" ? String(formData.get("currentPassword")).trim() : "",
      newPassword: typeof formData.get("newPassword") === "string" ? String(formData.get("newPassword")) : "",
      confirmNewPassword: typeof formData.get("confirmNewPassword") === "string" ? String(formData.get("confirmNewPassword")) : "",
      adminIdentity: admin.email,
    });

    if (!result.ok) {
      return NextResponse.redirect(buildTrustedAdminUrl(request, `/admin/settings?error=${result.error}`), {
        status: 303,
        headers: ADMIN_NO_STORE_HEADERS,
      });
    }

    const status = result.credentialSourceBeforeChange === "bootstrap" ? "password_initialized" : "password_changed";
    const response = NextResponse.redirect(buildTrustedAdminUrl(request, `/admin/login?status=${status}`), {
      status: 303,
      headers: ADMIN_NO_STORE_HEADERS,
    });
    response.cookies.set(buildClearedSessionCookie());
    return response;
  }

  const inputs = Object.fromEntries(
    MANAGED_SETTING_DEFINITIONS.map((definition) => [definition.key, typeof formData.get(definition.key) === "string" ? String(formData.get(definition.key)) : ""]),
  );

  try {
    await updateManagedSettings(inputs, admin.email);
    return NextResponse.redirect(buildTrustedAdminUrl(request, "/admin/settings?status=saved"), {
      status: 303,
      headers: ADMIN_NO_STORE_HEADERS,
    });
  } catch {
    return NextResponse.redirect(buildTrustedAdminUrl(request, "/admin/settings?error=invalid_setting"), {
      status: 303,
      headers: ADMIN_NO_STORE_HEADERS,
    });
  }
}
