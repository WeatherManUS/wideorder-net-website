import { randomBytes } from "node:crypto";

import { cookies } from "next/headers";

import {
  ADMIN_EMAIL,
  LOGIN_BLOCK_MS,
  LOGIN_FAILURE_LIMIT,
  LOGIN_FAILURE_WINDOW_MS,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
} from "@/lib/managed-config/definitions";
import { hashAdminPassword, hashToken, verifyAdminPassword } from "@/lib/managed-config/crypto";
import { getManagedConfigStore } from "@/lib/managed-config/storage";

const ADMIN_PASSWORD_MIN_LENGTH = 12;
const ADMIN_PASSWORD_MAX_LENGTH = 128;

export type AuthenticatedAdmin = {
  email: string;
  expiresAt: string;
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
      return decodeURIComponent(cookieEntry.slice(SESSION_COOKIE_NAME.length + 1));
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

  return {
    store,
    bootstrapHash,
    bootstrapConfigured: Boolean(bootstrapHash),
    managedCredential,
    managedHash,
    activeHash: managedHash || bootstrapHash,
    effectiveSource: managedHash ? ("managed" as const) : bootstrapHash ? ("bootstrap" as const) : ("missing" as const),
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
  const requestOrigin = new URL(request.url).origin;
  const originHeader = request.headers.get("origin");

  if (originHeader) {
    return originHeader === requestOrigin;
  }

  const refererHeader = request.headers.get("referer");

  return Boolean(refererHeader && refererHeader.startsWith(`${requestOrigin}/`));
}

async function createSession(adminEmail: string) {
  const store = await getManagedConfigStore();
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + SESSION_TTL_MS);
  const token = randomBytes(32).toString("base64url");

  await store.purgeExpiredSessions(issuedAt.toISOString());
  await store.upsertSession({
    sessionIdHash: hashToken(token),
    adminEmail,
    createdAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    lastSeenAt: issuedAt.toISOString(),
  });

  return {
    token,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function clearAdminSession(token: string) {
  if (!token) {
    return;
  }

  const store = await getManagedConfigStore();
  await store.deleteSession(hashToken(token));
}

export function getAdminSessionTokenFromRequest(request: Request) {
  return getSessionCookieValue(request.headers.get("cookie"));
}

export async function getAuthenticatedAdminFromRequest(request: Request): Promise<AuthenticatedAdmin | null> {
  const token = getAdminSessionTokenFromRequest(request);

  if (!token) {
    return null;
  }

  const store = await getManagedConfigStore();
  const nowIso = new Date().toISOString();

  await store.purgeExpiredSessions(nowIso);

  const session = await store.getSession(hashToken(token));

  if (!session || session.expiresAt <= nowIso) {
    if (session) {
      await store.deleteSession(session.sessionIdHash);
    }

    return null;
  }

  await store.touchSession(session.sessionIdHash, nowIso);

  return {
    email: session.adminEmail,
    expiresAt: session.expiresAt,
  };
}

export async function getAuthenticatedAdminFromCookies(): Promise<AuthenticatedAdmin | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? "";

  if (!token) {
    return null;
  }

  const store = await getManagedConfigStore();
  const nowIso = new Date().toISOString();

  await store.purgeExpiredSessions(nowIso);

  const session = await store.getSession(hashToken(token));

  if (!session || session.expiresAt <= nowIso) {
    if (session) {
      await store.deleteSession(session.sessionIdHash);
    }

    return null;
  }

  await store.touchSession(session.sessionIdHash, nowIso);

  return {
    email: session.adminEmail,
    expiresAt: session.expiresAt,
  };
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

  const isValid = verifyAdminPassword(password, adminPasswordHash);

  if (!isValid) {
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

  const session = await createSession(ADMIN_EMAIL);

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
