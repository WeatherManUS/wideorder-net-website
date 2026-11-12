import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
process.env.NODE_ENV = 'test';
process.env.WIDEORDER_LOCAL_CONFIG_DB_PATH = path.join(mkdtempSync(path.join(tmpdir(), 'wideorder-access-')), 'access.sqlite');
process.env.WIDEORDER_CONFIG_ENCRYPTION_KEY = randomUUID();
process.env.WIDEORDER_ADMIN_PASSWORD_HASH = '';
const { readAccessState, updateAccessState, requireGrant, recoveryReady, sessionLive, auditSecurity, FRESH_MS } = await import('./state.ts');
const { createAdminSession, getEnrollmentAdminFromRequest, getAuthenticatedAdminFromRequest } = await import('../managed-config/admin.ts');
const { hashToken } = await import('../managed-config/crypto.ts');
const { ceremonyVerify, relyingParty, manageAccess, redeemRecovery, accessView } = await import('./webauthn.ts');
const { authorizeInfrastructureRecovery } = await import('./recovery.ts');
const { getManagedConfigStore } = await import('../managed-config/storage.ts');
const request = (token = '', flow = '', origin = 'http://localhost:3107') => new Request('http://localhost:3107/api/admin/access', { headers: { origin, cookie: `wideorder_admin_session=${token}; wideorder_webauthn_flow=${flow}` } });
beforeEach(async () => { process.env.WIDEORDER_ADMIN_PASSWORD_HASH = ''; await updateAccessState(state => { state.mode = 'transitional'; state.credentials = []; state.sessions = []; state.ceremonies = []; state.events = []; state.recoveryReviewedAt = null; delete state.recovery; }); });
const key = (ref = randomUUID(), group = ref, deviceType = 'singleDevice') => ({ ref, id: randomBytes(32).toString('base64url'), publicKey: 'fixture-public-key', counter: 0, name: 'Fixture', recoveryGroup: group, deviceType, backedUp: deviceType === 'multiDevice', createdAt: new Date().toISOString(), lastUsedAt: new Date().toISOString(), testedAt: new Date().toISOString(), revokedAt: null, transports: ['usb'] });
async function session(method = 'password', credentialRef) { const value = await createAdminSession(request(), method, credentialRef); const admin = await getEnrollmentAdminFromRequest(request(value.token)); return { ...value, ...admin }; }

test('origin and RP are fixed in production and localhost-only outside production', () => {
  assert.equal(relyingParty(request()).rpID, 'localhost');
  assert.throws(() => relyingParty(request('', '', 'https://evil.example')));
  process.env.NODE_ENV = 'production';
  try { assert.deepEqual(relyingParty(request('', '', 'https://wideorder.net')), { origin: 'https://wideorder.net', rpID: 'wideorder.net' }); for (const origin of ['http://wideorder.net', 'https://www.wideorder.net', 'https://wideorder.net:8443', 'https://wideorder.net.evil.test']) assert.throws(() => relyingParty(request('', '', origin))); }
  finally { process.env.NODE_ENV = 'test'; }
});
test('compare-and-swap preserves concurrent audit events without lost updates', async () => {
  await Promise.all(Array.from({ length: 8 }, (_, index) => auditSecurity('fixture', 'success', { reference: `event-${index}` })));
  assert.equal((await readAccessState()).events.length, 8);
});
test('sessions rotate, reject idle/absolute expiry and follow credential revocation', async () => {
  const one = await session(); const two = await createAdminSession(request(one.token), 'password');
  assert.equal(await getAuthenticatedAdminFromRequest(request(one.token)), null);
  const state = await readAccessState(); const saved = state.sessions.find(item => item.hash === hashToken(two.token));
  assert.equal(sessionLive(state, { ...saved, lastSeenAt: new Date(Date.now() - 31 * 60000).toISOString() }), false);
  assert.equal(sessionLive(state, { ...saved, expiresAt: new Date(Date.now() - 1).toISOString() }), false);
  const credential = key(); await updateAccessState(state => state.credentials.push(credential)); const passkey = await session('passkey', credential.ref);
  await updateAccessState(state => { state.credentials[0].revokedAt = new Date().toISOString(); });
  assert.equal(await getAuthenticatedAdminFromRequest(request(passkey.token)), null);
});
test('fresh grants are single-use, action-scoped, expire and cannot be forged by a browser flag', async () => {
  const active = await session();
  await assert.rejects(updateAccessState(state => requireGrant(state, active.sessionId, 'settings')));
  await updateAccessState(state => { state.sessions[0].grant = { action: 'settings', expiresAt: new Date(Date.now() + FRESH_MS).toISOString() }; });
  await assert.rejects(updateAccessState(state => requireGrant(state, active.sessionId, 'register')));
  await updateAccessState(state => requireGrant(state, active.sessionId, 'settings'));
  await assert.rejects(updateAccessState(state => requireGrant(state, active.sessionId, 'settings')));
  await updateAccessState(state => { state.sessions[0].grant = { action: 'settings', expiresAt: new Date(Date.now() - 1).toISOString() }; });
  await assert.rejects(updateAccessState(state => requireGrant(state, active.sessionId, 'settings')));
});
test('challenge expiry, session binding and consume-before-verification reject reuse', async () => {
  const active = await session(); const flow = randomBytes(32).toString('base64url');
  const make = expiresAt => ({ id: randomUUID(), challenge: randomBytes(32).toString('base64url'), binding: hashToken(flow), sessionId: active.sessionId, purpose: 'register', origin: 'http://localhost:3107', rpID: 'localhost', expiresAt });
  const expired = make(new Date(Date.now() - 1).toISOString()); await updateAccessState(state => state.ceremonies.push(expired));
  await assert.rejects(ceremonyVerify(request(active.token, flow), { ceremonyId: expired.id, response: {} }), /challenge_rejected/);
  const valid = make(new Date(Date.now() + 60000).toISOString()); await updateAccessState(state => state.ceremonies.push(valid));
  await assert.rejects(ceremonyVerify(request('', flow), { ceremonyId: valid.id, response: {} }), /challenge_rejected/);
  await assert.rejects(ceremonyVerify(request(active.token, flow), { ceremonyId: valid.id, response: {} }), /verification_failed/);
  await assert.rejects(ceremonyVerify(request(active.token, flow), { ceremonyId: valid.id, response: {} }), /challenge_rejected/);
});
test('cutover accepts independent synced passkeys but requires tests, distinct groups and bootstrap removal', async () => {
  const a = key(undefined, 'same', 'multiDevice'), b = key(undefined, 'same', 'multiDevice');
  await updateAccessState(state => { state.credentials = [a, b]; });
  assert.equal(recoveryReady(await readAccessState()), false);
  await updateAccessState(state => { state.credentials[1].recoveryGroup = 'independent'; });
  assert.equal(recoveryReady(await readAccessState()), true);
  await updateAccessState(state => { state.credentials[1].testedAt = null; });
  assert.equal(recoveryReady(await readAccessState()), false);
  await updateAccessState(state => { state.credentials[1].testedAt = new Date().toISOString(); });
  assert.equal(recoveryReady(await readAccessState()), true);
  const active = await session('passkey', a.ref);
  process.env.WIDEORDER_ADMIN_PASSWORD_HASH = 'configured';
  await assert.rejects(manageAccess(active.sessionId, { action: 'cutover', confirm: 'ENABLE PASSKEY ONLY', independentConfirmed: true, recoveryReviewed: true }), /remove_bootstrap/);
  assert.equal((await readAccessState()).mode, 'transitional');
});

test('readiness excludes revoked credentials and normalizes recovery-group labels', async () => {
  const a = key(undefined, 'Google account', 'multiDevice'), b = key(undefined, '  GOOGLE ACCOUNT  ', 'multiDevice');
  await updateAccessState(state => { state.credentials = [a, b]; });
  assert.equal(recoveryReady(await readAccessState()), false);
  await updateAccessState(state => { state.credentials[1].recoveryGroup = 'Separate provider'; state.credentials[1].revokedAt = new Date().toISOString(); });
  assert.equal(recoveryReady(await readAccessState()), false);
});
test('interrupted cutover stays password-disabled and can resume with registered passkeys', async () => {
  const a = key(), b = key(); await updateAccessState(state => { state.mode = 'cutover'; state.credentials = [a, b]; });
  await assert.rejects(createAdminSession(request(), 'password'), /password_disabled/);
  const active = await session('passkey', a.ref);
  await updateAccessState(state => { state.sessions[0].grant = { action: 'cutover', expiresAt: new Date(Date.now() + 60000).toISOString() }; });
  await manageAccess(active.sessionId, { action: 'cutover', confirm: 'ENABLE PASSKEY ONLY', independentConfirmed: true, recoveryReviewed: true });
  assert.equal((await readAccessState()).mode, 'passkey');
  assert.equal(await getAuthenticatedAdminFromRequest(request(active.token)), null);
});
test('infrastructure recovery is one-time, revokes old access and cannot access routine administration', async () => {
  await assert.rejects(authorizeInfrastructureRecovery('TEST-OWNER-APPROVAL'), /initial_enrollment/);
  const a = key(), b = key(); await updateAccessState(state => { state.mode = 'passkey'; state.credentials = [a, b]; });
  const old = await session('passkey', a.ref);
  const token = await authorizeInfrastructureRecovery('TEST-OWNER-APPROVAL');
  const state = await readAccessState(); assert.equal(state.mode, 'recovery'); assert.ok(state.credentials.every(key => key.revokedAt)); assert.ok(!JSON.stringify(state).includes(token));
  assert.equal(await getAuthenticatedAdminFromRequest(request(old.token)), null);
  const recovered = await redeemRecovery(request(), token);
  assert.equal(await getAuthenticatedAdminFromRequest(request(recovered.token)), null);
  assert.equal((await getEnrollmentAdminFromRequest(request(recovered.token))).method, 'recovery');
  await assert.rejects(redeemRecovery(request(), token), /recovery_rejected/);
  await assert.rejects(createAdminSession(request(), 'password'), /password_disabled/);
  const admin = await getEnrollmentAdminFromRequest(request(recovered.token)); const view = await accessView(admin.sessionId);
  assert.equal(view.recoveryOnly, true); assert.equal(view.backupReady, false);
  assert.ok(!JSON.stringify(view).includes(a.id)); assert.ok(!JSON.stringify(view).includes(hashToken(recovered.token)));
});
test('recovery expiry and audit retention are enforced without retaining tokens', async () => {
  await updateAccessState(state => { state.mode = 'passkey'; });
  const token = await authorizeInfrastructureRecovery('TEST-EXPIRED-APPROVAL');
  await updateAccessState(state => { state.recovery.expiresAt = new Date(Date.now() - 1).toISOString(); state.events.push({ id: 'old', type: 'fixture', at: new Date(Date.now() - 366 * 86400000).toISOString(), result: 'success' }); });
  await assert.rejects(redeemRecovery(request(), token), /recovery_rejected/);
  await auditSecurity('fixture', 'success');
  assert.ok(!(await readAccessState()).events.some(event => event.id === 'old'));
  assert.ok((await (await getManagedConfigStore()).getAdminCredential('info@wideorder.net')).passwordHash.startsWith('scrypt'));
});
