import { getManagedConfigStore } from "../managed-config/storage.ts";
import { privateHash, type InquiryRow } from "./model.ts";
export async function inquiryByKey(key: string) {
  const store = await getManagedConfigStore();
  return (await store.execute("SELECT * FROM wideorder_inquiries WHERE request_key = ?", [privateHash(key)])).rows[0] as InquiryRow | undefined;
}
export async function inquiryById(id: string) {
  return (await (await getManagedConfigStore()).execute("SELECT * FROM wideorder_inquiries WHERE id = ?", [id])).rows[0] as InquiryRow | undefined;
}
export async function recentInquiries() {
  return (await (await getManagedConfigStore()).execute("SELECT id, created_at, stage, status, attempts, accepted_at, last_error, next_attempt_at FROM wideorder_inquiries ORDER BY created_at DESC LIMIT 30")).rows;
}
export async function takeRequestSlot(scope: string, limit = 5, windowMs = 600000) {
  const store = await getManagedConfigStore();
  const now = Date.now();
  const key = `${privateHash(scope)}:${Math.floor(now / windowMs)}`;
  await store.execute("DELETE FROM wideorder_request_limits WHERE expires_at < ?", [new Date(now).toISOString()]);
  try { await store.execute("INSERT INTO wideorder_request_limits (scope_key, uses, expires_at) VALUES (?, 0, ?)", [key, new Date(now + windowMs * 2).toISOString()]); } catch { /* A competing request may already have created this bucket. */ }
  return (await store.execute("UPDATE wideorder_request_limits SET uses = uses + 1 WHERE scope_key = ? AND uses < ?", [key, limit])).changes === 1;
}
