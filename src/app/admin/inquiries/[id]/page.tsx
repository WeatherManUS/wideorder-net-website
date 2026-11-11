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
  const inquiry = JSON.parse(decryptSecretValue(row.payload)) as Inquiry;
  return <><main className="admin-shell"><div className="admin-card">
    <Link href="/admin/settings">Back to settings</Link><h1>Inquiry {inquiry.reference}</h1>
    <p>Received {inquiry.submittedAt}</p><p>{row.stage}: {row.status}</p>
    <dl className="admin-summary">{Object.entries(inquiry.contact).map(([key, value]) => <div key={key}><dt>{key}</dt><dd style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{value || "Not provided"}</dd></div>)}</dl>
    <p>Source: {inquiry.sourcePage}</p><dl className="admin-summary">{Object.entries(inquiry.campaign).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>
  </div></main><SiteFooter utility /></>;
}
