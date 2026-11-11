import { randomUUID } from "node:crypto";
import { getManagedConfigStore } from "../managed-config/storage.ts";
import { encryptSecretValue, decryptSecretValue } from "../managed-config/crypto.ts";

export type MailOperation = "connection_test" | "test_email" | "internal" | "ack";
type MailOutcome = "started" | "accepted" | "verified" | "failed";
const safeErrors = new Set(["temporary_rejection", "permanent_rejection", "connection_failed", "delivery_uncertain", "acceptance_record_failed", "inquiry_unreadable", "smtp_not_configured", "smtp_configuration_invalid"]);
const commands = new Set(["CONN", "EHLO", "HELO", "STARTTLS", "AUTH", "MAIL FROM", "RCPT TO", "DATA"]);

export function smtpDiagnostic(error: unknown) {
  const value = error as { responseCode?: unknown; command?: unknown } | null;
  return {
    smtpCode: typeof value?.responseCode === "number" && Number.isInteger(value.responseCode) && value.responseCode >= 200 && value.responseCode <= 599 ? value.responseCode : null,
    smtpCommand: typeof value?.command === "string" && commands.has(value.command) ? value.command : null,
  };
}

export async function recordMailEvent(event: { operation: MailOperation; outcome: MailOutcome; inquiryId?: string; code?: string; error?: unknown; recipient?: string; response?: string }) {
  const store = await getManagedConfigStore();
  const diagnostic = smtpDiagnostic(event.error);
  const acceptedCode = event.outcome === "accepted" && typeof event.response === "string" ? /^([2][0-9]{2})\b/.exec(event.response)?.[1] : undefined;
  await store.execute("INSERT INTO wideorder_mail_events (id, inquiry_id, event_at, operation, outcome, error_code, smtp_code, smtp_command, recipient) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [
    randomUUID(), event.inquiryId ?? null, new Date().toISOString(), event.operation, event.outcome,
    event.code && safeErrors.has(event.code) ? event.code : null, acceptedCode ? Number(acceptedCode) : diagnostic.smtpCode, diagnostic.smtpCommand,
    event.recipient && event.operation !== "ack" ? encryptSecretValue(event.recipient) : null,
  ]);
}

// Diagnostics must never turn an accepted SMTP submission into a resend or a failed receipt.
export async function recordMailEventSafely(event: Parameters<typeof recordMailEvent>[0]) {
  try { await recordMailEvent(event); } catch { /* Queue state remains authoritative. Never log secret-bearing errors. */ }
}

export async function recordWorkerHealth(status: "ok" | "failed") {
  const store = await getManagedConfigStore();
  try { await store.execute("INSERT INTO wideorder_mail_health (id, checked_at, status) VALUES ('queue', ?, ?)", [new Date().toISOString(), status]); }
  catch { await store.execute("UPDATE wideorder_mail_health SET checked_at = ?, status = ? WHERE id = 'queue'", [new Date().toISOString(), status]); }
  await store.execute("DELETE FROM wideorder_mail_events WHERE event_at < ?", [new Date(Date.now() - 90 * 86400000).toISOString()]);
}

export async function mailDiagnostics(reference?: string) {
  const store = await getManagedConfigStore();
  const [summary, lastTest, events, worker, failures, lastSubmission] = await Promise.all([
    store.execute("SELECT COUNT(*) AS total, MAX(accepted_at) AS last_accepted, SUM(CASE WHEN stage = 'internal' AND status = 'pending' THEN 1 ELSE 0 END) AS pending, SUM(CASE WHEN stage = 'internal' AND status = 'processing' THEN 1 ELSE 0 END) AS processing, SUM(CASE WHEN status = 'review' THEN 1 ELSE 0 END) AS review FROM wideorder_inquiries"),
    store.execute("SELECT event_at, outcome, error_code, smtp_code FROM wideorder_mail_events WHERE operation = 'connection_test' AND outcome <> 'started' ORDER BY event_at DESC LIMIT 1"),
    reference ? store.execute("SELECT * FROM wideorder_mail_events WHERE inquiry_id = ? ORDER BY event_at DESC LIMIT 50", [reference]) : store.execute("SELECT * FROM wideorder_mail_events ORDER BY event_at DESC LIMIT 30"),
    store.execute("SELECT checked_at, status FROM wideorder_mail_health WHERE id = 'queue'"),
    store.execute("SELECT id, created_at, stage, status, attempts, accepted_at, last_error, next_attempt_at FROM wideorder_inquiries WHERE last_error IS NOT NULL ORDER BY created_at DESC LIMIT 20"),
    store.execute("SELECT MAX(event_at) AS accepted_at FROM wideorder_mail_events WHERE operation = 'internal' AND outcome = 'accepted'"),
  ]);
  const accepted = [summary.rows[0]?.last_accepted, lastSubmission.rows[0]?.accepted_at].filter((value): value is string => typeof value === "string").sort().at(-1) ?? null;
  return { summary: { ...summary.rows[0], last_accepted: accepted } as Record<string, unknown>, lastTest: lastTest.rows[0], worker: worker.rows[0], failures: failures.rows,
    events: events.rows.map((row): Record<string, unknown> & { recipient: string | null } => {
      let recipient: string | null = null;
      if (typeof row.recipient === "string") { try { recipient = decryptSecretValue(row.recipient); } catch { recipient = "Unavailable"; } }
      return { ...row, recipient };
    }),
  };
}
