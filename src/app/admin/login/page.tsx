import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/site-shell";
import { PasskeyLogin } from "@/components/admin-access";
import { getEnrollmentAdminFromCookies, getAdminCredentialSummary } from "@/lib/managed-config/admin";
import { readAccessState } from "@/lib/access/state";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "WideOrder Admin Login", robots: { index: false, follow: false } };
export default async function AdminLoginPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const admin = await getEnrollmentAdminFromCookies();
  if (admin) redirect(admin.method === "recovery" ? "/admin/enroll" : "/admin/settings");
  const state = await readAccessState();
  const params = await searchParams || {};
  const passwordAllowed = state.mode === "transitional";
  const summary = passwordAllowed ? await getAdminCredentialSummary() : null;
  return <><main className="admin-shell"><div className="admin-card admin-card--narrow">
    <p className="admin-eyebrow">WideOrder internal administration</p><h1>Admin login</h1>
    <p className="admin-copy">Use your device or security key to sign in at https://wideorder.net. No username is needed for passkeys.</p>
    {params.error && <p className="admin-alert" role="alert">Sign-in was not completed or the session expired. Try again. Repeated attempts are rate limited.</p>}
    {params.status === "passkey_only" && <p className="admin-alert">Passkey-only mode is active. Confirm access by signing in with a registered passkey from a fresh browser session.</p>}
    {state.mode !== "recovery" && state.credentials.some(key => !key.revokedAt) && <PasskeyLogin />}
    {passwordAllowed && <><p className="admin-copy">Password access remains available during enrollment. It is disabled only after tested backups and explicit cutover.</p>
    <form className="admin-form" method="post" action="/api/admin/login"><label className="admin-field"><span>Password</span><input name="password" type="password" autoComplete="current-password" maxLength={128} required /></label><button className="button button--secondary" disabled={summary?.effectiveSource === "missing"}>Sign in</button></form></>}
    <p><a href="/admin/recovery">Recovery help</a></p>
  </div></main><SiteFooter utility /></>;
}
