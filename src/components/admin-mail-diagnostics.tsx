import Link from "next/link";
import type { mailDiagnostics } from "@/lib/inquiries/diagnostics";

import { LocalTime } from "./local-time";

export function MailDiagnostics({ data, recipient, sender, acknowledgment, configured }: {
  data: Awaited<ReturnType<typeof mailDiagnostics>>; recipient: string; sender: string; acknowledgment: boolean; configured: boolean;
}) {
  return <section className="admin-section" aria-labelledby="mail-diagnostics-title">
    <h2 id="mail-diagnostics-title">Mail delivery diagnostics</h2>
    <p className="admin-copy">SMTP acceptance is a submission to the mail server, not proof of inbox delivery. Check the recipient mailbox, Spam/Junk and any downstream rejection before claiming delivery.</p>
    <dl className="admin-summary admin-summary--grid">
      <div><dt>SMTP configuration</dt><dd>{configured ? "Present and structurally valid; connection requires testing" : "Missing or invalid; notifications remain stored"}</dd></div>
      <div><dt>Notification recipient</dt><dd>{recipient || "Not configured"}</dd></div>
      <div><dt>Sender</dt><dd>{sender || "Not configured"}</dd></div>
      <div><dt>Customer acknowledgments</dt><dd>{acknowledgment ? "Enabled" : "Disabled"}</dd></div>
      <div><dt>Last connection test</dt><dd>{data.lastTest ? <><LocalTime value={data.lastTest.event_at} /> - {String(data.lastTest.outcome)} {data.lastTest.error_code ? `(${String(data.lastTest.error_code)})` : ""}</> : "Not recorded. Run Test connection below."}</dd></div>
      <div><dt>Last successful internal SMTP submission</dt><dd><LocalTime value={data.summary?.last_accepted} />. Inbox delivery unverified.</dd></div>
      <div><dt>Pending internal notifications</dt><dd>{String(data.summary?.pending ?? 0)}</dd></div>
      <div><dt>Internal notifications processing</dt><dd>{String(data.summary?.processing ?? 0)}</dd></div>
      <div><dt>Inquiries requiring review</dt><dd>{String(data.summary?.review ?? 0)}</dd></div>
      <div><dt>Total inquiries captured</dt><dd>{String(data.summary?.total ?? 0)}</dd></div>
      <div><dt>Last queue worker check</dt><dd>{data.worker ? <><LocalTime value={data.worker.checked_at} /> - {String(data.worker.status)}</> : "Not recorded yet"}</dd></div>
    </dl>
    <h3>Recent delivery failures</h3>
    <ul className="admin-audit-list">{data.failures.map(row => <li key={String(row.id)}>
      <Link href={`/admin/inquiries/${row.id}`}>{String(row.id)}</Link>
      <span>Received: <LocalTime value={row.created_at} /></span><span>{String(row.stage)}: {String(row.status)} — {String(row.last_error)}</span>
      <span>Attempts in this stage: {String(row.attempts)}. {row.status === "pending" ? <>Next attempt: <LocalTime value={row.next_attempt_at} /></> : "Operator review required."}</span>
    </li>)}</ul>
    {!data.failures.length && <p className="admin-copy">No current inquiry failures recorded.</p>}
    <h3>Recent mail operations</h3>
    <p className="admin-copy">Persistent operation history starts with v0.2.0002 and is retained for 90 days. Older inquiries retain their existing queue status and acceptance timestamp. Missing historical detail does not prove that no attempt occurred.</p>
    <MailEventList events={data.events} />
  </section>;
}

export function MailEventList({ events }: { events: Awaited<ReturnType<typeof mailDiagnostics>>["events"] }) {
  return events.length ? <ul className="admin-audit-list">{events.map(row => <li key={String(row.id)}>
    <span><LocalTime value={row.event_at} /> — {String(row.operation)}: {String(row.outcome)}</span>
    {row.inquiry_id ? <Link href={`/admin/inquiries/${row.inquiry_id}`}>{String(row.inquiry_id)}</Link> : null}
    {row.recipient ? <span>Notification destination: {row.recipient}</span> : null}
    {row.error_code ? <span>{String(row.error_code)}</span> : null}
    {row.smtp_code ? <span>SMTP reply code: {String(row.smtp_code)}</span> : null}
    {row.smtp_command ? <span>SMTP phase: {String(row.smtp_command)}</span> : null}
    {row.outcome === "accepted" ? <span>Server accepted submission; inbox delivery unverified.</span> : null}
  </li>)}</ul> : <p className="admin-copy">No operation history recorded yet.</p>;
}
