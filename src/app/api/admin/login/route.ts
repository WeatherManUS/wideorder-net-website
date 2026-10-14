import { NextResponse } from "next/server";

import { authenticateAdmin, buildSessionCookie, buildTrustedAdminUrl, isTrustedAdminOrigin, ADMIN_NO_STORE_HEADERS } from "@/lib/managed-config/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isTrustedAdminOrigin(request)) {
    return NextResponse.redirect(buildTrustedAdminUrl(request, "/admin/login?error=csrf"), {
      status: 303,
      headers: ADMIN_NO_STORE_HEADERS,
    });
  }

  const formData = await request.formData();
  const password = typeof formData.get("password") === "string" ? String(formData.get("password")).trim() : "";

  if (!password) {
    return NextResponse.redirect(buildTrustedAdminUrl(request, "/admin/login?error=invalid_request"), {
      status: 303,
      headers: ADMIN_NO_STORE_HEADERS,
    });
  }

  let result;

  try {
    result = await authenticateAdmin(request, password);
  } catch {
    return NextResponse.redirect(buildTrustedAdminUrl(request, "/admin/login?error=service_unavailable"), {
      status: 303,
      headers: ADMIN_NO_STORE_HEADERS,
    });
  }

  if (!result.ok) {
    return NextResponse.redirect(buildTrustedAdminUrl(request, `/admin/login?error=${result.error}`), {
      status: 303,
      headers: ADMIN_NO_STORE_HEADERS,
    });
  }

  const response = NextResponse.redirect(buildTrustedAdminUrl(request, "/admin/settings"), {
    status: 303,
    headers: ADMIN_NO_STORE_HEADERS,
  });
  response.cookies.set(buildSessionCookie(result.session.token, result.session.expiresAt));
  return response;
}
