import { verifyContactTurnstile } from "./turnstile.ts";
import { randomUUID } from "node:crypto";
import { validateContactSubmission } from "../contact.ts";
import { mailbox } from "../smtp/config.ts";
import { getInquirySecurityConfig, getSmtpConfig } from "../managed-config/service.ts";
import { getManagedConfigStore } from "../managed-config/storage.ts";
import { encryptSecretValue } from "../managed-config/crypto.ts";
import { inquiryByKey, inquiryById, takeRequestSlot } from "./store.ts";
import { privateHash, inquiryContext, inquiryResult, type Inquiry } from "./model.ts";
import { deliverInquiry } from "./queue.ts";

export async function submitInquiry(body: unknown, clientIp: string, dependencies = {
  security: getInquirySecurityConfig, smtp: getSmtpConfig, deliver: deliverInquiry,
  verify: verifyContactTurnstile,
}) {
  const { data, fieldErrors } = validateContactSubmission(body);
  if (!data) return { status: 400, body: { ok: false, error: "validation_error", fieldErrors } };
  if (!mailbox(data.email)) return { status: 400, body: { ok: false, error: "validation_error", fieldErrors: { email: "Enter a single valid email address." } } };
  if (data.website) return { status: 200, body: { ok: true } }; // Honeypots never create a lead/reference.
  const record = body as Record<string, unknown>;
  if (typeof record.requestKey !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(record.requestKey)) return { status: 400, body: { ok: false, error: "invalid_request" } };
  try {
    if (!await takeRequestSlot(`inquiry:${clientIp}`)) return { status: 429, body: { ok: false, error: "rate_limited" } };
    const contact = { name: data.name, company: data.company, email: data.email, phone: data.phone, message: data.message };
    const fingerprint = privateHash(JSON.stringify(contact));
    const security = await dependencies.security();
    if (!security.secretKey || !security.siteKey) return { status: 503, body: { ok: false, error: "service_unavailable" } };
    if (!data.turnstileToken || data.turnstileToken.length > 2048 || !await dependencies.verify(data.turnstileToken, security.secretKey)) return { status: 400, body: { ok: false, error: "security_verification_failed" } };
    const existing = await inquiryByKey(record.requestKey);
    if (existing) return existing.fingerprint === fingerprint ? { status: 200, body: inquiryResult(existing) } : { status: 409, body: { ok: false, error: "invalid_request" } };
    const config = await dependencies.smtp();
    const inquiry: Inquiry = { reference: randomUUID(), submittedAt: new Date().toISOString(), contact, ...inquiryContext(record), acknowledgment: config.acknowledgment };
    const store = await getManagedConfigStore();
    try {
      await store.execute("INSERT INTO wideorder_inquiries (id, request_key, fingerprint, payload, created_at, stage, status, attempts, next_attempt_at) VALUES (?, ?, ?, ?, ?, 'internal', 'pending', 0, ?)",
        [inquiry.reference, privateHash(record.requestKey), fingerprint, encryptSecretValue(JSON.stringify(inquiry)), inquiry.submittedAt, inquiry.submittedAt]);
    } catch {
      const concurrent = await inquiryByKey(record.requestKey);
      if (concurrent?.fingerprint === fingerprint) return { status: 200, body: inquiryResult(concurrent) };
      throw new Error("capture_failed");
    }
    // Durable receipt already succeeded: a delivery or status-read outage cannot erase that fact.
    try {
      await dependencies.deliver(inquiry.reference);
      const row = await inquiryById(inquiry.reference);
      if (row) return { status: row.accepted_at ? 200 : 202, body: inquiryResult(row) };
    } catch { /* The durable worker will handle pending delivery. */ }
    return { status: 202, body: { ok: true, reference: inquiry.reference, conversionId: inquiry.reference, delivery: "queued" } };
  } catch {
    return { status: 503, body: { ok: false, error: "service_unavailable", message: "We couldn't receive your inquiry. Your information is still in the form. Please try again or email info@wideorder.net." } };
  }
}
