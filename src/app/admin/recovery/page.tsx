import type { Metadata } from "next";
import { RecoveryLogin, HostingerRecoveryLogin } from "@/components/admin-access";
import { SiteFooter } from "@/components/site-shell";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administrator recovery", robots: { index: false, follow: false } };
export default function RecoveryPage() {
  return <><main className="admin-shell"><div className="admin-card admin-card--narrow"><h1>Administrator recovery</h1><p>Use a previously registered independent backup passkey whenever possible. <a href="/admin/login">Return to passkey sign-in</a>.</p><p>If every authenticator is lost, follow docs/PASSKEY_SECURITY.md using separately MFA-protected infrastructure access. Recovery grants passkey enrollment only, never Settings, SMTP or inquiry access. Restoring a password hash alone does not unlock a passkey-only account.</p><HostingerRecoveryLogin /><details><summary>Offline operator recovery authorization</summary><p>The alternative one-time authorization expires after 15 minutes. Never send it by email or paste it into support logs.</p><RecoveryLogin /></details></div></main><SiteFooter utility /></>;
}
