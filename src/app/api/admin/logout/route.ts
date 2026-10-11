import { NextResponse } from "next/server";

import {
  ADMIN_NO_STORE_HEADERS,
  buildClearedSessionCookie,
  clearAdminSession,
  getAdminSessionTokenFromRequest,
  getAuthenticatedAdminFromRequest,
  isTrustedAdminOrigin,
} from "@/lib/managed-config/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isTrustedAdminOrigin(request)) {
    return NextResponse.redirect(new URL("/admin/settings?error=csrf", request.url), {
      status: 303,
      headers: ADMIN_NO_STORE_HEADERS,
    });
  }

  const admin = await getAuthenticatedAdminFromRequest(request);

  if (!admin) {
    const response = NextResponse.redirect(new URL("/admin/login", request.url), {
      status: 303,
      headers: ADMIN_NO_STORE_HEADERS,
    });
    response.cookies.set(buildClearedSessionCookie());
    return response;
  }

  const token = getAdminSessionTokenFromRequest(request);
  await clearAdminSession(token);

  const response = NextResponse.redirect(new URL("/admin/login", request.url), {
    status: 303,
    headers: ADMIN_NO_STORE_HEADERS,
  });
  response.cookies.set(buildClearedSessionCookie());
  return response;
}
