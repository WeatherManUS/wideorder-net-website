import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SecurityAccess } from "@/components/admin-access";
import { SiteFooter } from "@/components/site-shell";
import { getEnrollmentAdminFromCookies } from "@/lib/managed-config/admin";
import { accessView } from "@/lib/access/webauthn";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Restricted recovery enrollment", robots: { index: false, follow: false } };
export default async function EnrollmentPage() {
  const admin = await getEnrollmentAdminFromCookies();
  if (!admin) redirect("/admin/recovery");
  if (admin.method !== "recovery") redirect("/admin/settings");
  return <><main className="admin-shell"><div className="admin-card"><h1>Restricted recovery enrollment</h1><p>Settings, inquiries and mail operations remain inaccessible. Complete enrollment and explicit passkey-only cutover before routine administration resumes.</p><SecurityAccess view={await accessView(admin.sessionId)} /></div></main><SiteFooter utility /></>;
}
