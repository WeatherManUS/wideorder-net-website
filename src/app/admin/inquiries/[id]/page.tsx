import { LocalTime } from "@/components/local-time";
import { MailEventList } from "@/components/admin-mail-diagnostics";
import { mailDiagnostics } from "@/lib/inquiries/diagnostics";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAuthenticatedAdminFromCookies } from "@/lib/managed-config/admin";
import { decryptSecretValue } from "@/lib/managed-config/crypto";
import { inquiryById } from "@/lib/inquiries/store";
import type { Inquiry } from "@/lib/inquiries/model";
import { SiteFooter } from "@/components/site-shell";
export const dynamic = "force-dynamic";
export const metadata = { title: "Inquiry | WideOrder administration", robots: { index: false, follow: false } };
export default async function InquiryPage({ params }: { params: Promise<{ id: string }> }) {
  if (!await getAuthenticatedAdminFromCookies()) redirect("/admin/login?error=unauthenticated");
  const { id } = await params;
  const row = await inquiryById(id);
  if (!row) notFound();
  const diagnostics = await mailDiagnostics(id);
  const inquiry = JSON.parse(decryptSecretValue(row.payload)) as Inquiry;
  return <><main className="admin-shell"><div className="admin-card">
    <Link href="/admin/settings">Back to settings</Link><h1>Inquiry {inquiry.reference}</h1>
    <p>Received <LocalTime value={inquiry.submittedAt} /></p><p>{row.stage}: {row.status}</p>
    <p>Internal SMTP acceptance: <LocalTime value={row.accepted_at} />. Inbox delivery is not confirmed by SMTP acceptance.</p>
    <p>Attempts in current stage: {row.attempts}. {row.status === "pending" ? <>Next attempt: <LocalTime value={row.next_attempt_at} /></> : ""}</p>
    <p>Last error: {row.last_error || "None recorded"}. Customer acknowledgment requested at capture: {inquiry.acknowledgment ? "Yes (still subject to current settings)" : "No"}.</p>
    <h2>Mail operation history</h2><MailEventList events={diagnostics.events} />
    <dl className="admin-summary">{Object.entries(inquiry.contact).map(([key, value]) => <div key={key}><dt>{key}</dt><dd style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{value || "Not provided"}</dd></div>)}</dl>
    <p>Source: {inquiry.sourcePage}</p><dl className="admin-summary">{Object.entries(inquiry.campaign).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>
  </div></main><SiteFooter utility /></>;
}
