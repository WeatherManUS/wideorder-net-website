import { randomBytes, randomUUID } from "node:crypto";
import { getManagedConfigStore } from "../managed-config/storage.ts";

export const IDLE_MS = 30 * 60_000;
export const FRESH_MS = 5 * 60_000;
export type AccessMode = "transitional" | "cutover" | "passkey" | "recovery";
export type Passkey = { ref: string; id: string; publicKey: string; counter: number; name: string; recoveryGroup: string; createdAt: string; lastUsedAt: string | null; testedAt: string | null; revokedAt: string | null; deviceType: "singleDevice" | "multiDevice"; backedUp: boolean; transports: string[] };
export type AccessSession = { id: string; hash: string; method: "password" | "passkey" | "recovery"; credentialRef?: string; createdAt: string; expiresAt: string; lastSeenAt: string; label: string; grant?: { action: string; expiresAt: string } };
export type Ceremony = { id: string; challenge: string; binding: string; sessionId?: string; initialRegistration?: boolean; purpose: "register" | "login" | "verify"; action?: string; target?: string; name?: string; recoveryGroup?: string; origin: string; rpID: string; expiresAt: string };
export type SecurityEvent = { id: string; type: string; at: string; result: "success" | "failure"; sessionId?: string; credentialRef?: string; reference?: string };
export type AccessState = { schema: 1; userId: string; mode: AccessMode; credentials: Passkey[]; sessions: AccessSession[]; ceremonies: Ceremony[]; events: SecurityEvent[]; recoveryReviewedAt: string | null; recovery?: { hash: string; expiresAt: string; reference: string } };

let schemaReady: Promise<unknown> | undefined;
async function load() {
  try {
  const store = await getManagedConfigStore();
  schemaReady ??= store.execute("CREATE TABLE IF NOT EXISTS wideorder_access_state (id VARCHAR(16) PRIMARY KEY, version INTEGER NOT NULL, body LONGTEXT NOT NULL)").catch(error => { schemaReady = undefined; throw error; });
  await schemaReady;
  let row = (await store.execute("SELECT version, body FROM wideorder_access_state WHERE id = 'admin'")).rows[0];
  if (!row) {
    const initial: AccessState = { schema: 1, userId: randomBytes(32).toString("base64url"), mode: "transitional", credentials: [], sessions: [], ceremonies: [], events: [], recoveryReviewedAt: null };
    try { await store.execute("INSERT INTO wideorder_access_state (id, version, body) VALUES ('admin', 1, ?)", [JSON.stringify(initial)]); }
    catch { /* A competing instance may initialize the same singleton. The following read must succeed. */ }
    row = (await store.execute("SELECT version, body FROM wideorder_access_state WHERE id = 'admin'")).rows[0];
  }
  if (!row || typeof row.body !== "string") throw new Error("access_store_unavailable");
  const state = JSON.parse(row.body) as AccessState;
  if (state.schema !== 1 || !["transitional", "cutover", "passkey", "recovery"].includes(state.mode)) throw new Error("access_schema_invalid");
  return { store, state, version: Number(row.version) };
  } catch { throw new Error("access_store_unavailable"); }
}
export async function readAccessState() { return (await load()).state; }

// The callback is synchronous and may run again after a CAS conflict. Never perform I/O in it.
export async function updateAccessState<T>(change: (state: AccessState) => T): Promise<T> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const { store, state, version } = await load();
    const now = new Date().toISOString();
    state.ceremonies = state.ceremonies.filter(item => item.expiresAt > now);
    state.sessions = state.sessions.filter(item => sessionLive(state, item));
    state.events = state.events.filter(item => Date.parse(item.at) > Date.now() - 365 * 86400_000).slice(-999);
    const result = change(state);
    const saved = await store.execute("UPDATE wideorder_access_state SET body = ?, version = version + 1 WHERE id = 'admin' AND version = ?", [JSON.stringify(state), version]).catch(() => { throw new Error("access_store_unavailable"); });
    if (saved.changes === 1) return result;
  }
  throw new Error("access_busy");
}
export function sessionLive(state: AccessState, session: AccessSession, now = Date.now()) {
  if (Date.parse(session.expiresAt) <= now || Date.parse(session.lastSeenAt) + IDLE_MS <= now) return false;
  if (session.method === "password" && state.mode !== "transitional") return false;
  if (state.mode === "recovery" && session.method !== "recovery") return false;
  if (session.method === "recovery" && state.mode !== "recovery") return false;
  return !session.credentialRef || state.credentials.some(key => key.ref === session.credentialRef && !key.revokedAt);
}
export function requireSession(state: AccessState, id: string) {
  const session = state.sessions.find(item => item.id === id && sessionLive(state, item));
  if (!session) throw new Error("unauthenticated");
  return session;
}
export function securityEvent(state: AccessState, type: string, result: "success" | "failure", context: Pick<SecurityEvent, "sessionId" | "credentialRef" | "reference"> = {}) {
  state.events.push({ id: randomUUID(), at: new Date().toISOString(), type, result, ...context });
}
export async function auditSecurity(type: string, result: "success" | "failure", context: Pick<SecurityEvent, "sessionId" | "credentialRef" | "reference"> = {}) {
  await updateAccessState(state => securityEvent(state, type, result, context));
}
export function requireGrant(state: AccessState, sessionId: string, action: string) {
  const session = requireSession(state, sessionId);
  if (!session.grant || session.grant.action !== action || Date.parse(session.grant.expiresAt) <= Date.now()) throw new Error("fresh_verification_required");
  delete session.grant;
  return session;
}
export function recoveryReady(state: AccessState) {
  const tested = state.credentials.filter(key => !key.revokedAt && key.testedAt);
  return tested.length >= 2 && new Set(tested.map(key => key.recoveryGroup.toLowerCase())).size >= 2 && tested.some(key => key.deviceType === "singleDevice");
}
export async function consumeSensitiveGrant(sessionId: string, action: string) {
  return updateAccessState(state => {
    const session = requireSession(state, sessionId);
    if (session.method === "recovery" || state.mode === "cutover") throw new Error("recovery_restricted");
    if (state.credentials.some(key => !key.revokedAt)) requireGrant(state, sessionId, action);
    else if (state.mode !== "transitional" || Date.parse(session.createdAt) + FRESH_MS < Date.now()) throw new Error("fresh_login_required");
  });
}
