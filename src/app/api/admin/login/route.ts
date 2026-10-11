import { NextResponse } from "next/server";

import { authenticateAdmin, buildSessionCookie, isTrustedAdminOrigin, ADMIN_NO_STORE_HEADERS } from "@/lib/managed-config/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isTrustedAdminOrigin(request)) {
    return NextResponse.redirect(new URL("/admin/login?error=csrf", request.url), {
      status: 303,
      headers: ADMIN_NO_STORE_HEADERS,
    });
  }

  const formData = await request.formData();
  const password = typeof formData.get("password") === "string" ? String(formData.get("password")).trim() : "";

  if (!password) {
    return NextResponse.redirect(new URL("/admin/login?error=invalid_request", request.url), {
      status: 303,
      headers: ADMIN_NO_STORE_HEADERS,
    });
  }

  const result = await authenticateAdmin(request, password);

  if (!result.ok) {
    return NextResponse.redirect(new URL(`/admin/login?error=${result.error}`, request.url), {
      status: 303,
      headers: ADMIN_NO_STORE_HEADERS,
    });
  }

  const response = NextResponse.redirect(new URL("/admin/settings", request.url), {
    status: 303,
    headers: ADMIN_NO_STORE_HEADERS,
  });
  response.cookies.set(buildSessionCookie(result.session.token, result.session.expiresAt));
  return response;
}
