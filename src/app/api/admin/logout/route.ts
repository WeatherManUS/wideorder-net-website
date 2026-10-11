import { NextResponse } from "next/server";

import {
  ADMIN_NO_STORE_HEADERS,
  buildClearedSessionCookie,
  buildTrustedAdminUrl,
  clearAdminSession,
  getAdminSessionTokenFromRequest,
  getAuthenticatedAdminFromRequest,
  isTrustedAdminOrigin,
} from "@/lib/managed-config/admin";

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
    const response = NextResponse.redirect(buildTrustedAdminUrl(request, "/admin/login"), {
      status: 303,
      headers: ADMIN_NO_STORE_HEADERS,
    });
    response.cookies.set(buildClearedSessionCookie());
    return response;
  }

  const token = getAdminSessionTokenFromRequest(request);
  await clearAdminSession(token);

  const response = NextResponse.redirect(buildTrustedAdminUrl(request, "/"), {
    status: 303,
    headers: ADMIN_NO_STORE_HEADERS,
  });
  response.cookies.set(buildClearedSessionCookie());
  return response;
}
