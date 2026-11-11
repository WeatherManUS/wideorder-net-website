import type { Metadata } from "next";
import { RecoveryLogin } from "@/components/admin-access";
import { SiteFooter } from "@/components/site-shell";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administrator recovery", robots: { index: false, follow: false } };
export default function RecoveryPage() {
  return <><main className="admin-shell"><div className="admin-card admin-card--narrow"><h1>Administrator recovery</h1><p>Use a previously registered independent backup passkey whenever possible. <a href="/admin/login">Return to passkey sign-in</a>.</p><p>If every authenticator is lost, an authorized infrastructure operator must confirm your manual authorization through separately authenticated hosting/database access and follow docs/PASSKEY_SECURITY.md. Email, SMS and your old password cannot authorize recovery.</p><p>The one-time authorization below grants restricted enrollment only, expires after 15 minutes, and does not expose Settings or inquiries. Never send it by email or paste it into support logs.</p><RecoveryLogin /></div></main><SiteFooter utility /></>;
}
