import { createHmac } from "node:crypto";
import { publicPageId, readCampaign, type Campaign } from "../marketing/model.ts";
import type { ContactSubmission } from "../contact.ts";
export type Inquiry = { reference: string; submittedAt: string; contact: Omit<ContactSubmission, "website" | "turnstileToken">; sourcePage: string; campaign: Campaign; acknowledgment: boolean };
export type InquiryRow = { id: string; request_key: string; fingerprint: string; payload: string; created_at: string; stage: "internal" | "ack"; status: "pending" | "processing" | "done" | "review"; attempts: number; next_attempt_at: string; lease_token: string | null; lease_until: string | null; accepted_at: string | null; last_error: string | null };
export function privateHash(value: string) {
  const key = process.env.WIDEORDER_CONFIG_ENCRYPTION_KEY;
  if (!key) throw new Error("missing_config_encryption_key");
  return createHmac("sha256", key).update(value).digest("hex");
}
export function inquiryContext(body: Record<string, unknown>) {
  const sourcePage = typeof body.sourcePage === "string" ? publicPageId(body.sourcePage) : "/contact";
  const campaign = body.analyticsConsent === true && body.campaign && typeof body.campaign === "object" && !Array.isArray(body.campaign)
    ? readCampaign(new URLSearchParams(Object.entries(body.campaign).filter((entry): entry is [string, string] => typeof entry[1] === "string")).toString()) : {};
  return { sourcePage, campaign };
}
export function inquiryResult(row: InquiryRow) {
  return { ok: true as const, reference: row.id, conversionId: row.id, delivery: row.accepted_at ? "accepted" as const : "queued" as const };
}
