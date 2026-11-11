import { readAccessState, updateAccessState, sessionLive, securityEvent, type AccessSession } from "../access/state.ts";
import { takeRequestSlot } from "../inquiries/store.ts";
import { randomBytes, randomUUID } from "node:crypto";

import { cookies } from "next/headers";

import {
  ADMIN_EMAIL,
  LOGIN_BLOCK_MS,
  LOGIN_FAILURE_LIMIT,
  LOGIN_FAILURE_WINDOW_MS,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
} from "@/lib/managed-config/definitions";
import { hashAdminPassword, hashToken, isSupportedAdminPasswordHash, verifyAdminPassword } from "@/lib/managed-config/crypto";
import { buildTrustedPublicUrl, isTrustedBrowserOrigin, isTrustedBrowserReferer } from "@/lib/managed-config/origin";
import { getManagedConfigStore } from "@/lib/managed-config/storage";

const ADMIN_PASSWORD_MIN_LENGTH = 12;
const ADMIN_PASSWORD_MAX_LENGTH = 128;

export type AuthenticatedAdmin = {
  email: string;
  expiresAt: string;
  sessionId: string;
  method: AccessSession["method"];
};

export type AdminCredentialSource = "managed" | "bootstrap" | "missing";

export type AdminCredentialSummary = {
  bootstrapConfigured: boolean;
  hasManagedPassword: boolean;
  effectiveSource: AdminCredentialSource;
  passwordUpdatedAt: string | null;
  passwordUpdatedBy: string | null;
};

export const ADMIN_NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
  "X-Robots-Tag": "noindex, nofollow",
} as const;

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "";
  }

  return request.headers.get("x-real-ip")?.trim() ?? "";
}

function getThrottleScopeKey(request: Request) {
  const clientIp = getClientIp(request) || "unknown";
  return `${ADMIN_EMAIL}:${clientIp}`;
}

function getCookieSettings(expiresAt: string) {
  return {
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  };
}

function getSessionCookieValue(cookieHeader: string | null) {
  if (!cookieHeader) {
    return "";
  }

  const cookiesMap = cookieHeader.split(";").map((entry) => entry.trim());

  for (const cookieEntry of cookiesMap) {
    if (cookieEntry.startsWith(`${SESSION_COOKIE_NAME}=`)) {
      try { return decodeURIComponent(cookieEntry.slice(SESSION_COOKIE_NAME.length + 1)); } catch { return ""; }
    }
  }

  return "";
}

function getBootstrapAdminPasswordHash() {
  return process.env.WIDEORDER_ADMIN_PASSWORD_HASH?.trim() ?? "";
}

async function getAdminPasswordState() {
  const store = await getManagedConfigStore();
  const bootstrapHash = getBootstrapAdminPasswordHash();
  const managedCredential = await store.getAdminCredential(ADMIN_EMAIL);
  const managedHash = managedCredential?.passwordHash.trim() ?? "";
  const usableBootstrapHash = isSupportedAdminPasswordHash(bootstrapHash) ? bootstrapHash : "";
  const usableManagedHash = isSupportedAdminPasswordHash(managedHash) ? managedHash : "";

  return {
    store,
    bootstrapHash: usableBootstrapHash,
    bootstrapConfigured: Boolean(usableBootstrapHash),
    managedCredential,
    managedHash: usableManagedHash,
    activeHash: usableManagedHash || usableBootstrapHash,
    effectiveSource: usableManagedHash ? ("managed" as const) : usableBootstrapHash ? ("bootstrap" as const) : ("missing" as const),
  };
}

function validateNewAdminPassword(currentPassword: string, newPassword: string, confirmNewPassword: string) {
  if (!currentPassword) {
    return "current_password_required";
  }

  if (!newPassword) {
    return "new_password_required";
  }

  if (newPassword.length < ADMIN_PASSWORD_MIN_LENGTH || newPassword.length > ADMIN_PASSWORD_MAX_LENGTH) {
    return "password_strength";
  }

  const characterGroupCount = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) => pattern.test(newPassword)).length;

  if (characterGroupCount < 3) {
    return "password_strength";
  }

  if (newPassword !== confirmNewPassword) {
    return "password_confirmation_mismatch";
  }

  if (newPassword === currentPassword) {
    return "password_reuse";
  }

  return null;
}

export function isTrustedAdminOrigin(request: Request) {
  const originHeader = request.headers.get("origin");

  if (originHeader) {
    return isTrustedBrowserOrigin(originHeader);
  }

  const refererHeader = request.headers.get("referer");

  return Boolean(refererHeader && isTrustedBrowserReferer(refererHeader));
}

export function buildTrustedAdminUrl(request: Request, path: string) {
  return buildTrustedPublicUrl(request, path);
}

export async function createAdminSession(request: Request, method: AccessSession["method"], credentialRef?: string) {
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + (method === "recovery" ? 30 * 60000 : SESSION_TTL_MS)).toISOString();
  const token = randomBytes(32).toString("base64url");
  const hash = hashToken(token);
  const oldHash = hashToken(getAdminSessionTokenFromRequest(request));
  const ua = request.headers.get("user-agent") || "";
  const browser = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const platform = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "Apple mobile" : /Windows/.test(ua) ? "Windows" : /Macintosh/.test(ua) ? "Mac" : "device";
  await updateAccessState(state => {
    if (method === "password" && state.mode !== "transitional") throw new Error("password_disabled");
    if (method === "recovery" ? state.mode !== "recovery" : state.mode === "recovery") throw new Error("recovery_restricted");
    if (credentialRef && !state.credentials.some(key => key.ref === credentialRef && !key.revokedAt)) throw new Error("credential_revoked");
    state.sessions = state.sessions.filter(session => session.hash !== oldHash).slice(-19);
    const session: AccessSession = { id: randomUUID(), hash, method, credentialRef, createdAt: issuedAt.toISOString(), lastSeenAt: issuedAt.toISOString(), expiresAt, label: `${browser} on ${platform}` };
    state.sessions.push(session);
    securityEvent(state, "sign_in", "success", { sessionId: session.id, credentialRef });
  });
  return { token, expiresAt };
}

export async function clearAdminSession(token: string) {
  if (!token) return;
  const hash = hashToken(token);
  await updateAccessState(state => {
    const session = state.sessions.find(item => item.hash === hash);
    state.sessions = state.sessions.filter(item => item.hash !== hash);
    if (session) securityEvent(state, "session_revoked", "success", { sessionId: session.id });
  });
  await (await getManagedConfigStore()).deleteSession(hash);
}

export function getAdminSessionTokenFromRequest(request: Request) {
  return getSessionCookieValue(request.headers.get("cookie"));
}

async function authenticateSessionToken(token: string): Promise<AuthenticatedAdmin | null> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const hash = hashToken(token);
  return updateAccessState(state => {
    const session = state.sessions.find(item => item.hash === hash && sessionLive(state, item));
    if (!session) return null;
    session.lastSeenAt = new Date().toISOString();
    return { email: ADMIN_EMAIL, expiresAt: session.expiresAt, sessionId: session.id, method: session.method };
  });
}
export async function getAuthenticatedAdminFromRequest(request: Request): Promise<AuthenticatedAdmin | null> {
  const admin = await authenticateSessionToken(getAdminSessionTokenFromRequest(request));
  return admin?.method === "recovery" ? null : admin;
}
export async function getEnrollmentAdminFromRequest(request: Request) {
  return authenticateSessionToken(getAdminSessionTokenFromRequest(request));
}
export async function getAuthenticatedAdminFromCookies(): Promise<AuthenticatedAdmin | null> {
  const admin = await authenticateSessionToken((await cookies()).get(SESSION_COOKIE_NAME)?.value ?? "");
  return admin?.method === "recovery" ? null : admin;
}
export async function getEnrollmentAdminFromCookies() {
  return authenticateSessionToken((await cookies()).get(SESSION_COOKIE_NAME)?.value ?? "");
}

export async function getAdminCredentialSummary(): Promise<AdminCredentialSummary> {
  const state = await getAdminPasswordState();

  return {
    bootstrapConfigured: state.bootstrapConfigured,
    hasManagedPassword: Boolean(state.managedHash),
    effectiveSource: state.effectiveSource,
    passwordUpdatedAt: state.managedCredential?.updatedAt ?? null,
    passwordUpdatedBy: state.managedCredential?.updatedBy ?? null,
  };
}

export async function authenticateAdmin(request: Request, password: string) {
  if ((await readAccessState()).mode !== "transitional") return { ok: false as const, error: "password_disabled" };
  const state = await getAdminPasswordState();
  const adminPasswordHash = state.activeHash;

  if (!adminPasswordHash) {
    return {
      ok: false as const,
      error: "bootstrap_missing",
    };
  }

  const store = state.store;
  const now = new Date();
  const nowIso = now.toISOString();
  const scopeKey = getThrottleScopeKey(request);
  const attempt = await store.getLoginAttempt(scopeKey);

  if (attempt?.blockedUntil && attempt.blockedUntil > nowIso) {
    return {
      ok: false as const,
      error: "throttled",
    };
  }

  if (!await takeRequestSlot(`admin-login:${scopeKey}`, LOGIN_FAILURE_LIMIT, LOGIN_FAILURE_WINDOW_MS)
    || !await takeRequestSlot(`admin-login-account:${ADMIN_EMAIL}`, 30, LOGIN_FAILURE_WINDOW_MS)) return { ok: false as const, error: "throttled" };
  const isValid = verifyAdminPassword(password, adminPasswordHash);

  if (!isValid) {
    await updateAccessState(state => securityEvent(state, "sign_in", "failure"));
    const withinWindow = attempt && new Date(attempt.firstFailedAt).getTime() >= now.getTime() - LOGIN_FAILURE_WINDOW_MS;
    const nextFailCount = withinWindow ? (attempt?.failCount ?? 0) + 1 : 1;
    const firstFailedAt = withinWindow && attempt ? attempt.firstFailedAt : nowIso;
    const blockedUntil = nextFailCount >= LOGIN_FAILURE_LIMIT ? new Date(now.getTime() + LOGIN_BLOCK_MS).toISOString() : null;

    await store.upsertLoginAttempt({
      scopeKey,
      failCount: nextFailCount,
      firstFailedAt,
      updatedAt: nowIso,
      blockedUntil,
    });

    return {
      ok: false as const,
      error: blockedUntil ? "throttled" : "invalid_credentials",
    };
  }

  await store.deleteLoginAttempt(scopeKey);

  const session = await createAdminSession(request, "password");

  return {
    ok: true as const,
    session,
    credentialSource: state.effectiveSource,
  };
}

export async function changeAdminPassword({
  currentPassword,
  newPassword,
  confirmNewPassword,
  adminIdentity,
}: {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  adminIdentity: string;
}) {
  const validationError = validateNewAdminPassword(currentPassword, newPassword, confirmNewPassword);

  if (validationError) {
    return {
      ok: false as const,
      error: validationError,
    };
  }

  const state = await getAdminPasswordState();

  if (!state.activeHash) {
    return {
      ok: false as const,
      error: "bootstrap_missing",
    };
  }

  if (!verifyAdminPassword(currentPassword, state.activeHash)) {
    return {
      ok: false as const,
      error: "current_password_invalid",
    };
  }

  const nowIso = new Date().toISOString();

  await updateAccessState(access => {
    if (access.mode !== "transitional" || access.credentials.length) throw new Error("password_change_disabled");
    access.sessions = [];
    securityEvent(access, "password_changed", "success");
  });

  await state.store.upsertAdminCredential({
    adminEmail: ADMIN_EMAIL,
    passwordHash: hashAdminPassword(newPassword),
    updatedAt: nowIso,
    updatedBy: adminIdentity,
  });

  await state.store.appendAudit({
    id: crypto.randomUUID(),
    settingKey: "ADMIN_PASSWORD_HASH",
    category: "auth",
    changedAt: nowIso,
    adminIdentity,
  });

  await state.store.deleteSessionsForAdmin(ADMIN_EMAIL);

  return {
    ok: true as const,
    credentialSourceBeforeChange: state.effectiveSource,
  };
}

export function buildSessionCookie(token: string, expiresAt: string) {
  return {
    ...getCookieSettings(expiresAt),
    value: token,
  };
}

export function buildClearedSessionCookie() {
  return {
    ...getCookieSettings(new Date(0).toISOString()),
    value: "",
    maxAge: 0,
  };
}
