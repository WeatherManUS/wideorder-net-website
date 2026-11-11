import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
process.env.NODE_ENV = "test";
process.env.WIDEORDER_LOCAL_CONFIG_DB_PATH = path.join(mkdtempSync(path.join(tmpdir(), "wideorder-admin-")), "settings.sqlite");
process.env.WIDEORDER_CONFIG_ENCRYPTION_KEY = randomUUID();
const { hashAdminPassword, hashToken } = await import("./crypto.ts");
const password = `Fixture-${randomUUID()}!`;
process.env.WIDEORDER_ADMIN_PASSWORD_HASH = hashAdminPassword(password);
const { authenticateAdmin, buildSessionCookie, getAuthenticatedAdminFromRequest, clearAdminSession, isTrustedAdminOrigin, changeAdminPassword } = await import("./admin.ts");
const { getManagedConfigStore } = await import("./storage.ts");
const request = (ip = "qa") => new Request("http://localhost:3105/api/admin/login", { headers: { "x-forwarded-for": ip, origin: "http://localhost:3105" } });

test("authorized session, secure production cookie, forged/expired sessions and logout", async () => {
  const result = await authenticateAdmin(request(), password); assert.equal(result.ok, true);
  const authenticated = new Request("http://localhost:3105/admin/settings", { headers: { cookie: `wideorder_admin_session=${result.session.token}` } });
  assert.equal((await getAuthenticatedAdminFromRequest(authenticated)).email, "info@wideorder.net");
  process.env.NODE_ENV = "production";
  const cookie = buildSessionCookie(result.session.token, result.session.expiresAt); assert.equal(cookie.secure, true); assert.equal(cookie.httpOnly, true); assert.equal(cookie.sameSite, "strict");
  process.env.NODE_ENV = "test";
  assert.equal(await getAuthenticatedAdminFromRequest(new Request("http://localhost/admin", { headers: { cookie: "wideorder_admin_session=forged" } })), null);
  const store = await getManagedConfigStore();
  await store.upsertSession({ sessionIdHash: hashToken("other"), adminEmail: "other@example.test", createdAt: new Date().toISOString(), lastSeenAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 100000).toISOString() });
  assert.equal(await getAuthenticatedAdminFromRequest(new Request("http://localhost/admin", { headers: { cookie: "wideorder_admin_session=other" } })), null);
  await clearAdminSession(result.session.token); assert.equal(await getAuthenticatedAdminFromRequest(authenticated), null);
  assert.equal(isTrustedAdminOrigin(new Request("http://localhost/admin", { headers: { origin: "https://evil.example" } })), false);
  assert.equal(isTrustedAdminOrigin(request()), true);
});
test("persistent login throttling bounds concurrent guesses", async () => {
  const results = await Promise.all(Array.from({ length: 8 }, () => authenticateAdmin(request("rate-test"), "wrong")));
  assert.ok(results.filter(result => result.error === "throttled").length >= 3);
  assert.equal((await authenticateAdmin(request("rate-test"), password)).error, "throttled");
});
test("managed password rotation invalidates existing sessions", async () => {
  const result = await authenticateAdmin(request("rotation"), password); assert.equal(result.ok, true);
  const replacement = `Replacement-${randomUUID()}!`;
  assert.equal((await changeAdminPassword({ currentPassword: password, newPassword: replacement, confirmNewPassword: replacement, adminIdentity: "info@wideorder.net" })).ok, true);
  assert.equal(await getAuthenticatedAdminFromRequest(new Request("http://localhost/admin", { headers: { cookie: `wideorder_admin_session=${result.session.token}` } })), null);
  assert.equal((await authenticateAdmin(request("new-password"), replacement)).ok, true);
});
