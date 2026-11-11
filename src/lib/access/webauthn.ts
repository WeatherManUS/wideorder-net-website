import { randomBytes, randomUUID } from "node:crypto";
import { generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse, type AuthenticationResponseJSON, type RegistrationResponseJSON, type AuthenticatorTransport } from "@simplewebauthn/server";
import { hashToken, hashAdminPassword } from "../managed-config/crypto.ts";
import { ADMIN_EMAIL } from "../managed-config/definitions.ts";
import { getManagedConfigStore } from "../managed-config/storage.ts";
import { createAdminSession, getEnrollmentAdminFromRequest } from "../managed-config/admin.ts";
import { FRESH_MS, auditSecurity, readAccessState, updateAccessState, requireSession, requireGrant, recoveryReady, securityEvent, sessionLive, type Ceremony, type AccessSession } from "./state.ts";

export const FLOW_COOKIE = "wideorder_webauthn_flow";
export function relyingParty(request: Request) {
  const origin = request.headers.get("origin");
  if (process.env.NODE_ENV === "production") {
    if (origin !== "https://wideorder.net") throw new Error("origin_rejected");
    return { origin, rpID: "wideorder.net" };
  }
  const url = new URL(request.url);
  if (url.hostname !== "localhost" || origin !== url.origin) throw new Error("origin_rejected");
  return { origin: url.origin, rpID: "localhost" };
}
function flowBinding(request: Request) {
  const value = request.headers.get("cookie")?.split(";").map(part => part.trim()).find(part => part.startsWith(`${FLOW_COOKIE}=`))?.slice(FLOW_COOKIE.length + 1);
  if (!value || !/^[A-Za-z0-9_-]{43}$/.test(value)) throw new Error("challenge_rejected");
  return hashToken(value);
}
function text(value: unknown, max = 80) {
  if (typeof value !== "string" || !value.trim() || value.length > max || /[\x00-\x1f\x7f]/.test(value)) throw new Error("invalid_request");
  return value.trim();
}
function validAction(value: unknown) {
  const action = text(value, 100);
  if (!/^(register|cutover|settings|smtp|sessions|rename:[a-f0-9-]{36}|revoke:[a-f0-9-]{36}|test:[a-f0-9-]{36})$/.test(action)) throw new Error("invalid_request");
  return action;
}

export async function ceremonyOptions(request: Request, input: Record<string, unknown>) {
  const rp = relyingParty(request);
  const purpose = input.purpose;
  if (purpose !== "login" && purpose !== "register" && purpose !== "verify") throw new Error("invalid_request");
  const admin = purpose === "login" ? null : await getEnrollmentAdminFromRequest(request);
  if (purpose !== "login" && !admin) throw new Error("unauthenticated");
  const state = await readAccessState();
  if (purpose === "login" && state.mode === "recovery") throw new Error("recovery_restricted");
  const active = state.credentials.filter(key => !key.revokedAt);
  const name = purpose === "register" ? text(input.name) : undefined;
  const recoveryGroup = purpose === "register" ? text(input.recoveryGroup) : undefined;
  const action = purpose === "verify" ? validAction(input.action) : undefined;
  const target = action?.startsWith("test:") ? action.slice(5) : undefined;
  if (target && !active.some(key => key.ref === target)) throw new Error("credential_unknown");
  const options = purpose === "register"
    ? await generateRegistrationOptions({ rpName: "WideOrder administration", rpID: rp.rpID, userID: new Uint8Array(Buffer.from(state.userId, "base64url")), userName: ADMIN_EMAIL, userDisplayName: "WideOrder administrator", timeout: 120000, attestationType: "none", authenticatorSelection: { residentKey: "required", userVerification: "required" }, excludeCredentials: active.map(key => ({ id: key.id, transports: key.transports as AuthenticatorTransport[] })) })
    : await generateAuthenticationOptions({ rpID: rp.rpID, timeout: 120000, userVerification: "required" });
  const token = randomBytes(32).toString("base64url");
  const ceremony: Ceremony = { id: randomUUID(), challenge: options.challenge, binding: hashToken(token), sessionId: admin?.sessionId, purpose, action, target, name, recoveryGroup, ...rp, expiresAt: new Date(Date.now() + 120000).toISOString() };
  await updateAccessState(current => {
    if (current.userId !== state.userId || current.mode !== state.mode) throw new Error("state_changed");
    if (admin) {
      const session = requireSession(current, admin.sessionId);
      if (purpose === "register") {
        if (current.credentials.length >= 200) throw new Error("credential_limit");
        if (current.credentials.filter(key => !key.revokedAt).length >= 20) throw new Error("credential_limit");
        if (current.credentials.some(key => !key.revokedAt)) requireGrant(current, session.id, "register");
        else {
          if (!["transitional", "recovery"].includes(current.mode) || Date.parse(session.createdAt) + FRESH_MS <= Date.now()) throw new Error("fresh_login_required");
          ceremony.initialRegistration = true;
        }
      }
    }
    current.ceremonies = current.ceremonies.filter(item => item.binding !== ceremony.binding).slice(-99);
    current.ceremonies.push(ceremony);
  });
  return { options, ceremonyId: ceremony.id, token };
}

export async function ceremonyVerify(request: Request, input: Record<string, unknown>) {
  const rp = relyingParty(request);
  const binding = flowBinding(request);
  const id = text(input.ceremonyId, 36);
  const admin = await getEnrollmentAdminFromRequest(request);
  // Consume before cryptographic verification, including failures, with a single CAS commit.
  const ceremony = await updateAccessState(state => {
    const found = state.ceremonies.find(item => item.id === id && item.binding === binding && item.origin === rp.origin && item.rpID === rp.rpID);
    if (!found) throw new Error("challenge_rejected");
    if (found.sessionId) {
      if (admin?.sessionId !== found.sessionId) throw new Error("challenge_rejected");
      requireSession(state, found.sessionId);
    }
    state.ceremonies = state.ceremonies.filter(item => item.id !== id);
    return found;
  });
  const response = input.response;
  if (!response || typeof response !== "object") throw new Error("invalid_request");
  try {
    if (ceremony.purpose === "register") {
      const verified = await verifyRegistrationResponse({ response: response as RegistrationResponseJSON, expectedChallenge: ceremony.challenge, expectedOrigin: rp.origin, expectedRPID: rp.rpID, requireUserVerification: true, requireUserPresence: true });
      if (!verified.verified || !verified.registrationInfo.userVerified) throw new Error("verification_failed");
      const info = verified.registrationInfo;
      await updateAccessState(state => {
        requireSession(state, ceremony.sessionId!);
        if (ceremony.initialRegistration && state.credentials.some(key => !key.revokedAt)) throw new Error("state_changed");
        if (state.credentials.some(key => key.id === info.credential.id)) throw new Error("credential_exists");
        if (state.credentials.filter(key => !key.revokedAt).length >= 20) throw new Error("credential_limit");
        const ref = randomUUID();
        state.credentials.push({ ref, id: info.credential.id, publicKey: Buffer.from(info.credential.publicKey).toString("base64url"), counter: info.credential.counter, name: ceremony.name!, recoveryGroup: ceremony.recoveryGroup!, createdAt: new Date().toISOString(), lastUsedAt: null, testedAt: null, revokedAt: null, deviceType: info.credentialDeviceType, backedUp: info.credentialBackedUp, transports: info.credential.transports ?? [] });
        securityEvent(state, "passkey_registered", "success", { sessionId: ceremony.sessionId, credentialRef: ref });
      });
      return { registered: true };
    }
    const auth = response as AuthenticationResponseJSON;
    const state = await readAccessState();
    const key = state.credentials.find(key => key.id === auth.id && !key.revokedAt);
    if (!key || (ceremony.target && key.ref !== ceremony.target)) throw new Error("credential_unknown");
    // Discoverable login binds the returned user handle to this one account. Never accept another account's handle.
    if (!auth.response || auth.response.userHandle !== state.userId) throw new Error("credential_owner_mismatch");
    const verified = await verifyAuthenticationResponse({ response: auth, expectedChallenge: ceremony.challenge, expectedOrigin: rp.origin, expectedRPID: rp.rpID, requireUserVerification: true, credential: { id: key.id, publicKey: new Uint8Array(Buffer.from(key.publicKey, "base64url")), counter: key.counter, transports: key.transports as AuthenticatorTransport[] } });
    if (!verified.verified || !verified.authenticationInfo.userVerified || verified.authenticationInfo.credentialDeviceType !== key.deviceType || auth.response.clientDataJSON.length > 16000) throw new Error("verification_failed");
    const method = await updateAccessState((current): AccessSession["method"] => {
      let method: AccessSession["method"] = "passkey";
      const saved = current.credentials.find(item => item.ref === key.ref && !item.revokedAt);
      if (!saved || saved.counter !== key.counter) throw new Error("credential_changed");
      if (ceremony.sessionId) {
        const session = requireSession(current, ceremony.sessionId);
        method = session.method === "recovery" ? "recovery" : "passkey";
      } else if (current.mode === "recovery") throw new Error("recovery_restricted");
      saved.counter = verified.authenticationInfo.newCounter;
      saved.lastUsedAt = new Date().toISOString();
      saved.testedAt = saved.lastUsedAt;
      saved.deviceType = verified.authenticationInfo.credentialDeviceType;
      saved.backedUp = verified.authenticationInfo.credentialBackedUp;
      securityEvent(current, "passkey_verified", "success", { sessionId: ceremony.sessionId, credentialRef: key.ref });
      return method;
    });
    const session = await createAdminSession(request, method, key.ref);
    if (ceremony.action) await updateAccessState(current => {
      const saved = current.sessions.find(item => item.hash === hashToken(session.token));
      if (!saved || !sessionLive(current, saved)) throw new Error("unauthenticated");
      saved.grant = { action: ceremony.action!, expiresAt: new Date(Date.now() + 120000).toISOString() };
    });
    return { session, redirect: method === "recovery" ? "/admin/enroll" : "/admin/settings" };
  } catch {
    await auditSecurity(ceremony.purpose === "register" ? "passkey_registration" : "passkey_verification", "failure", { sessionId: ceremony.sessionId });
    throw new Error("verification_failed");
  }
}

export async function manageAccess(sessionId: string, input: Record<string, unknown>) {
  const action = text(input.action, 100);
  if (action === "cutover") {
    if (input.independentConfirmed !== true || input.recoveryReviewed !== true || input.confirm !== "ENABLE PASSKEY ONLY") throw new Error("confirmation_required");
    if (process.env.WIDEORDER_ADMIN_PASSWORD_HASH?.trim()) throw new Error("remove_bootstrap_before_cutover");
    await updateAccessState(state => {
      requireGrant(state, sessionId, "cutover");
      if (!recoveryReady(state)) throw new Error("backup_not_ready");
      state.mode = "cutover";
      state.recoveryReviewedAt = new Date().toISOString();
      state.sessions = state.sessions.filter(session => session.id === sessionId);
      state.ceremonies = [];
      delete state.recovery;
      securityEvent(state, "cutover_started", "success", { sessionId });
    });
    // Irrecoverable random managed hash prevents older password-only binaries from accepting a known password.
    const store = await getManagedConfigStore();
    await store.upsertAdminCredential({ adminEmail: ADMIN_EMAIL, passwordHash: hashAdminPassword(randomBytes(48).toString("base64url")), updatedAt: new Date().toISOString(), updatedBy: ADMIN_EMAIL });
    await store.deleteSessionsForAdmin(ADMIN_EMAIL);
    await updateAccessState(state => {
      if (state.mode !== "cutover" || !recoveryReady(state)) throw new Error("state_changed");
      state.mode = "passkey";
      state.sessions = [];
      securityEvent(state, "authentication_mode_changed", "success", { sessionId });
    });
    return { redirect: "/admin/login?status=passkey_only" };
  }
  return updateAccessState(state => {
    const grantAction = action === "rename" || action === "revoke" ? `${action}:${text(input.ref, 36)}` : "sessions";
    const session = requireGrant(state, sessionId, grantAction);
    if (action === "rename" || action === "revoke") {
      const key = state.credentials.find(item => item.ref === input.ref && !item.revokedAt);
      if (!key) throw new Error("credential_unknown");
      if (action === "rename") { key.name = text(input.name); securityEvent(state, "passkey_renamed", "success", { sessionId, credentialRef: key.ref }); }
      else {
        key.revokedAt = new Date().toISOString();
        if (!state.credentials.some(item => !item.revokedAt) || (state.mode !== "transitional" && !recoveryReady(state))) throw new Error("backup_not_ready");
        state.sessions = state.sessions.filter(item => item.credentialRef !== key.ref);
        securityEvent(state, "passkey_revoked", "success", { sessionId, credentialRef: key.ref });
      }
    } else if (action === "revoke_sessions") {
      if (session.method === "recovery") throw new Error("recovery_restricted");
      state.sessions = state.sessions.filter(item => item.id === sessionId);
      securityEvent(state, "other_sessions_revoked", "success", { sessionId });
    } else throw new Error("invalid_request");
    return { ok: true };
  });
}

export async function redeemRecovery(request: Request, value: unknown) {
  relyingParty(request);
  const token = text(value, 100);
  await updateAccessState(state => {
    if (state.mode !== "recovery" || !state.recovery || state.recovery.expiresAt <= new Date().toISOString() || state.recovery.hash !== hashToken(token)) throw new Error("recovery_rejected");
    delete state.recovery;
    securityEvent(state, "recovery_token_redeemed", "success");
  });
  return createAdminSession(request, "recovery");
}

export async function accessView(sessionId: string) {
  const state = await readAccessState();
  const session = requireSession(state, sessionId);
  return { mode: state.mode, recoveryOnly: session.method === "recovery", backupReady: recoveryReady(state), bootstrapPresent: Boolean(process.env.WIDEORDER_ADMIN_PASSWORD_HASH?.trim()), credentials: state.credentials.map(({ ref, name, recoveryGroup, createdAt, lastUsedAt, testedAt, revokedAt, deviceType, backedUp }) => ({ ref, name, recoveryGroup, createdAt, lastUsedAt, testedAt, revokedAt, deviceType, backedUp })), sessions: state.sessions.filter(item => sessionLive(state, item)).map(({ id, label, method, createdAt, lastSeenAt, expiresAt }) => ({ id, label, method, createdAt, lastSeenAt, expiresAt, current: id === sessionId })), events: state.events.slice(-40).reverse() };
}
