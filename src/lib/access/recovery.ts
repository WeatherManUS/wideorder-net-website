// Infrastructure-only entry point. No HTTP route imports this module.
import { randomBytes } from "node:crypto";
import { readAccessState, updateAccessState, securityEvent } from "./state.ts";
import { hashToken, hashAdminPassword } from "../managed-config/crypto.ts";
import { getManagedConfigStore } from "../managed-config/storage.ts";
import { ADMIN_EMAIL } from "../managed-config/definitions.ts";
export async function authorizeInfrastructureRecovery(reference: string) {
  if (!/^[A-Za-z0-9._-]{8,80}$/.test(reference)) throw new Error("authorization_reference_required");
  if (process.env.WIDEORDER_ADMIN_PASSWORD_HASH?.trim()) throw new Error("remove_bootstrap_before_recovery");
  if ((await readAccessState()).mode === "transitional") throw new Error("initial_enrollment_required");
  const token = randomBytes(32).toString("base64url");
  await updateAccessState(state => {
    if (state.mode === "transitional") throw new Error("state_changed");
    state.mode = "recovery"; state.sessions = []; state.ceremonies = []; delete state.recovery;
    const now = new Date().toISOString();
    for (const key of state.credentials) key.revokedAt ||= now;
    state.recoveryReviewedAt = null;
    securityEvent(state, "infrastructure_recovery_started", "success", { reference });
  });
  const store = await getManagedConfigStore();
  await store.upsertAdminCredential({ adminEmail: ADMIN_EMAIL, passwordHash: hashAdminPassword(randomBytes(48).toString("base64url")), updatedAt: new Date().toISOString(), updatedBy: "authorized infrastructure recovery" });
  await store.deleteSessionsForAdmin(ADMIN_EMAIL);
  await updateAccessState(state => {
    if (state.mode !== "recovery") throw new Error("state_changed");
    state.recovery = { hash: hashToken(token), expiresAt: new Date(Date.now() + 15 * 60000).toISOString(), reference };
    securityEvent(state, "infrastructure_recovery_authorized", "success", { reference });
  });
  return token;
}
