import { randomUUID } from "node:crypto";
import { getManagedConfigStore } from "../managed-config/storage.ts";
import { decryptSecretValue } from "../managed-config/crypto.ts";
import { getSmtpConfig } from "../managed-config/service.ts";
import { validateSmtpConfig } from "../smtp/config.ts";
import { createSmtpTransport, smtpFailure } from "../smtp/transport.ts";
import { inquiryMail } from "./mail.ts";
import { inquiryById } from "./store.ts";
import type { Inquiry, InquiryRow } from "./model.ts";

export async function deliverInquiry(id: string, dependencies = { getConfig: getSmtpConfig, createTransport: createSmtpTransport }) {
  const store = await getManagedConfigStore();
  const config = await dependencies.getConfig();
  if (!validateSmtpConfig(config, false)) return;
  const now = new Date().toISOString();
  const lease = randomUUID();
  const claim = await store.execute("UPDATE wideorder_inquiries SET status = 'processing', lease_token = ?, lease_until = ?, attempts = attempts + 1 WHERE id = ? AND status = 'pending' AND next_attempt_at <= ?", [lease, new Date(Date.now() + 120000).toISOString(), id, now]);
  if (!claim.changes) return;
  const row = await inquiryById(id);
  if (!row) return;
  let transport: Awaited<ReturnType<typeof createSmtpTransport>> | undefined;
  let accepted = false;
  try {
    const inquiry = JSON.parse(decryptSecretValue(row.payload)) as Inquiry;
    if (row.stage === "ack" && !config.acknowledgment) {
      await store.execute("UPDATE wideorder_inquiries SET status = 'done', lease_token = NULL, lease_until = NULL WHERE id = ? AND lease_token = ?", [id, lease]);
      return;
    }
    transport = await dependencies.createTransport(config);
    const options = inquiryMail(inquiry, config, row.stage === "ack");
    const result = await transport.sendMail(options);
    if (!result.accepted?.some(address => address.toLowerCase() === options.envelope.to[0].toLowerCase())) throw Object.assign(new Error("smtp_not_accepted"), { responseCode: 450 });
    accepted = true;
    const ackNext = row.stage === "internal" && inquiry.acknowledgment && config.acknowledgment;
    await store.execute("UPDATE wideorder_inquiries SET status = ?, stage = ?, attempts = 0, next_attempt_at = ?, accepted_at = ?, lease_token = NULL, lease_until = NULL, last_error = NULL WHERE id = ? AND lease_token = ?", [ackNext ? "pending" : "done", ackNext ? "ack" : row.stage, now, row.accepted_at || new Date().toISOString(), id, lease]);
  } catch (error) {
    const failure = accepted ? { code: "acceptance_record_failed", retry: false } : smtpFailure(error);
    const retry = failure.retry && row.attempts < 5;
    await store.execute("UPDATE wideorder_inquiries SET status = ?, next_attempt_at = ?, lease_token = NULL, lease_until = NULL, last_error = ? WHERE id = ? AND lease_token = ?", [retry ? "pending" : "review", new Date(Date.now() + Math.min(3600000, 60000 * 2 ** row.attempts)).toISOString(), failure.code, id, lease]);
    // Do not log provider responses: they can contain credentials or inquiry content.
  } finally { transport?.close(); }
}
export async function drainInquiryQueue(deliver = deliverInquiry) {
  const store = await getManagedConfigStore();
  const now = new Date().toISOString();
  // A process may die after SMTP acceptance but before recording it. Quarantine expired leases.
  await store.execute("UPDATE wideorder_inquiries SET status = 'review', last_error = 'delivery_uncertain', lease_token = NULL WHERE status = 'processing' AND lease_until < ?", [now]);
  const rows = (await store.execute("SELECT id FROM wideorder_inquiries WHERE status = 'pending' AND next_attempt_at <= ? ORDER BY created_at LIMIT 10", [now])).rows;
  for (const row of rows) await deliver(String(row.id));
  return rows.length;
}
let running = false;
export function startInquiryWorker() {
  const tick = async () => {
    if (running) return;
    running = true;
    try { await drainInquiryQueue(); } catch { /* Durable rows remain for a later run; never log sensitive errors. */ }
    finally { running = false; }
  };
  const timer = setInterval(() => void tick(), 60000);
  timer.unref();
  void tick();
}
export async function retryInquiry(id: string) {
  // Only definite rejection failures can be manually retried. Uncertain DATA requires mailbox review.
  return (await (await getManagedConfigStore()).execute("UPDATE wideorder_inquiries SET status = 'pending', attempts = 0, next_attempt_at = ? WHERE id = ? AND status = 'review' AND last_error IN ('temporary_rejection', 'permanent_rejection', 'connection_failed')", [new Date().toISOString(), id])).changes;
}
export type { InquiryRow };
