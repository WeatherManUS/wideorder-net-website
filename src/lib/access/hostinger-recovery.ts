import { randomBytes, randomUUID } from "node:crypto";
import { hashToken, isSupportedAdminPasswordHash, verifyAdminPassword } from "../managed-config/crypto.ts";
import { takeRequestSlot } from "../inquiries/store.ts";
import { auditSecurity, securityEvent, updateAccessState } from "./state.ts";
import { relyingParty } from "./webauthn.ts";

// Explicit operator authorization: UUID|UTC start|UTC expiry, at most one hour.
// The hash alone never enables this endpoint or ordinary password login.
export function recoveryWindow(now = Date.now()) {
  const parts = process.env.WIDEORDER_ADMIN_RECOVERY?.trim().split("|");
  if (!parts || parts.length !== 3) return null;
  const [id, start, end] = parts;
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id)) return null;
  if (![start, end].every(value => /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(value))) return null;
  const begins = Date.parse(start), expires = Date.parse(end);
  if (!Number.isFinite(begins) || !Number.isFinite(expires) || begins > now || expires <= now || expires <= begins || expires - begins > 3600000) return null;
  return { id, expiresAt: new Date(expires).toISOString() };
}

export async function redeemHostingerRecovery(request: Request, password: unknown, confirmed: unknown) {
  relyingParty(request);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!await takeRequestSlot(`host-recovery-ip:${ip}`, 5, 900000) || !await takeRequestSlot("host-recovery-account", 10, 900000)) throw new Error("rate_limited");
  try {
    const window = recoveryWindow();
    const hash = process.env.WIDEORDER_ADMIN_PASSWORD_HASH?.trim() || "";
    if (!window || confirmed !== true || typeof password !== "string" || !password || password.length > 128 || !isSupportedAdminPasswordHash(hash) || !verifyAdminPassword(password, hash)) throw new Error("recovery_rejected");
    const token = randomBytes(32).toString("base64url");
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 60000).toISOString();
    await updateAccessState(state => {
      const current = recoveryWindow();
      if (!current || current.id !== window.id || current.expiresAt !== window.expiresAt || state.mode === "transitional") throw new Error("recovery_rejected");
      state.hostRecoveryUses = (state.hostRecoveryUses || []).filter(item => item.expiresAt > now);
      if (state.hostRecoveryUses.some(item => item.id === window.id) || state.hostRecoveryUses.length >= 20) throw new Error("recovery_rejected");
      state.hostRecoveryUses.push(window);
      state.mode = "recovery";
      state.ceremonies = [];
      delete state.recovery;
      state.recoveryReviewedAt = null;
      for (const key of state.credentials) key.revokedAt ||= now;
      const sessionId = randomUUID();
      // Consume authorization, revoke access and issue restricted session in one CAS.
      state.sessions = [{ id: sessionId, hash: hashToken(token), method: "recovery", createdAt: now, lastSeenAt: now, expiresAt, label: "Hostinger-authorized recovery" }];
      securityEvent(state, "hostinger_recovery_redeemed", "success", { sessionId, reference: window.id });
    });
    return { token, expiresAt };
  } catch {
    await auditSecurity("hostinger_recovery_redeemed", "failure");
    throw new Error("recovery_rejected");
  }
}
