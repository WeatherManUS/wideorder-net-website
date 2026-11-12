import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
Object.assign(process.env, { NODE_ENV: 'test', WIDEORDER_DATABASE_URL: '', MYSQL_HOST: '', DB_HOST: '', WIDEORDER_LOCAL_CONFIG_DB_PATH: path.join(mkdtempSync(path.join(tmpdir(), 'wideorder-host-recovery-')), 'fixture.sqlite'), WIDEORDER_CONFIG_ENCRYPTION_KEY: randomUUID() });
const { hashAdminPassword } = await import('../managed-config/crypto.ts');
const { getManagedConfigStore } = await import('../managed-config/storage.ts');
const { readAccessState, updateAccessState, consumeSensitiveGrant } = await import('./state.ts');
const { redeemHostingerRecovery, recoveryWindow } = await import('./hostinger-recovery.ts');
const { createAdminSession, getAuthenticatedAdminFromRequest, getEnrollmentAdminFromRequest, authenticateAdmin } = await import('../managed-config/admin.ts');
const { manageAccess } = await import('./webauthn.ts');
const password = `Fixture-${randomUUID()}`;
const hash = hashAdminPassword(password);
const request = (token = '', origin = 'http://localhost:3107', ip = 'fixture') => new Request('http://localhost:3107/api/admin/access', { headers: { origin, cookie: `wideorder_admin_session=${token}`, 'x-forwarded-for': ip } });
const window = (start = Date.now()-1000, end = Date.now()+3500000, id = randomUUID()) => `${id}|${new Date(start).toISOString()}|${new Date(end).toISOString()}`;
const key = group => ({ ref: randomUUID(), id: randomUUID(), publicKey: 'fixture', counter: 0, name: group, recoveryGroup: group, deviceType: 'multiDevice', backedUp: true, createdAt: new Date().toISOString(), testedAt: new Date().toISOString(), lastUsedAt: null, revokedAt: null, transports: ['internal'] });
beforeEach(async () => {
  process.env.WIDEORDER_ADMIN_PASSWORD_HASH = '';
  process.env.WIDEORDER_ADMIN_RECOVERY = '';
  await updateAccessState(state => { state.mode = 'passkey'; state.credentials = [key('Provider A'),key('Provider B')]; state.sessions = []; state.ceremonies = []; state.events = []; delete state.recovery; delete state.hostRecoveryUses; });
  const store = await getManagedConfigStore();
  // Ensure limiter schema exists without using production storage.
  const { takeRequestSlot } = await import('../inquiries/store.ts'); await takeRequestSlot('fixture-setup',1,1);
  await store.execute('DELETE FROM wideorder_request_limits');
});

test('recovery authorization rejects malformed, future, expired and overlong windows', () => {
  for (const value of ['', 'true', window(Date.now()+60000, Date.now()+120000), window(Date.now()-120000,Date.now()-1), window(Date.now()-1000,Date.now()+3600001), 'not-a-uuid|2026-01-01T00:00:00Z|2026-01-01T00:30:00Z']) {
    process.env.WIDEORDER_ADMIN_RECOVERY=value; assert.equal(recoveryWindow(),null);
  }
  process.env.WIDEORDER_ADMIN_RECOVERY=window(); assert.ok(recoveryWindow());
});
test('restored hash alone cannot enable recovery or ordinary password authentication', async () => {
  process.env.WIDEORDER_ADMIN_PASSWORD_HASH=hash;
  await assert.rejects(redeemHostingerRecovery(request(),password,true), /recovery_rejected/);
  assert.equal((await authenticateAdmin(request(),password)).error,'password_disabled');
  assert.equal((await readAccessState()).mode,'passkey');
  assert.ok((await readAccessState()).credentials.every(key=>!key.revokedAt));
});
test('wrong origin, wrong password and missing explicit confirmation preserve existing access', async () => {
  process.env.WIDEORDER_ADMIN_PASSWORD_HASH=hash; process.env.WIDEORDER_ADMIN_RECOVERY=window();
  await assert.rejects(redeemHostingerRecovery(request('', 'https://evil.example'),password,true),/origin_rejected/);
  for (const [candidate,confirmed] of [['wrong',true],[password,false],[hash,true]]) await assert.rejects(redeemHostingerRecovery(request(),candidate,confirmed),/recovery_rejected/);
  assert.equal((await readAccessState()).mode,'passkey');
  assert.ok((await readAccessState()).credentials.every(key=>!key.revokedAt));
});
test('concurrent redemption is single-use and issues only restricted, expiring enrollment access', async () => {
  const state = await readAccessState(); const old=await createAdminSession(request(),'passkey',state.credentials[0].ref);
  process.env.WIDEORDER_ADMIN_PASSWORD_HASH=hash; process.env.WIDEORDER_ADMIN_RECOVERY=window();
  const outcomes=await Promise.allSettled([redeemHostingerRecovery(request(),password,true),redeemHostingerRecovery(request(),password,true)]);
  assert.equal(outcomes.filter(value=>value.status==='fulfilled').length,1);
  const recovered=outcomes.find(value=>value.status==='fulfilled').value;
  assert.ok(Date.parse(recovered.expiresAt)<=Date.now()+30*60000);
  assert.equal(await getAuthenticatedAdminFromRequest(request(old.token)),null);
  assert.equal(await getAuthenticatedAdminFromRequest(request(recovered.token)),null);
  const admin=await getEnrollmentAdminFromRequest(request(recovered.token)); assert.equal(admin.method,'recovery');
  await assert.rejects(consumeSensitiveGrant(admin.sessionId,'settings'),/recovery_restricted/);
  await assert.rejects(consumeSensitiveGrant(admin.sessionId,'smtp'),/recovery_restricted/);
  await assert.rejects(redeemHostingerRecovery(request(),password,true),/recovery_rejected/);
  const saved=await readAccessState(); assert.ok(saved.credentials.every(key=>key.revokedAt));
  const events=JSON.stringify(saved.events); assert.ok(!events.includes(password)); assert.ok(!events.includes(hash)); assert.ok(!events.includes(recovered.token));
  await updateAccessState(state=>{state.sessions[0].expiresAt=new Date(Date.now()-1).toISOString();});
  assert.equal(await getEnrollmentAdminFromRequest(request(recovered.token)),null);
});
test('recovery is unavailable before first cutover and obeys persistent per-IP throttling', async () => {
  process.env.WIDEORDER_ADMIN_PASSWORD_HASH=hash; process.env.WIDEORDER_ADMIN_RECOVERY=window();
  await updateAccessState(state=>{state.mode='transitional';});
  await assert.rejects(redeemHostingerRecovery(request(),password,true),/recovery_rejected/);
  for(let i=0;i<4;i++) await assert.rejects(redeemHostingerRecovery(request(),'wrong',true),/recovery_rejected/);
  await assert.rejects(redeemHostingerRecovery(request(),password,true),/rate_limited/);
});
test('account-wide recovery throttling holds even when reported IP changes', async () => {
  process.env.WIDEORDER_ADMIN_PASSWORD_HASH=hash; process.env.WIDEORDER_ADMIN_RECOVERY=window();
  for(let i=0;i<10;i++) await assert.rejects(redeemHostingerRecovery(request('','http://localhost:3107',`fixture-${i}`),'wrong',true),/recovery_rejected/);
  await assert.rejects(redeemHostingerRecovery(request('','http://localhost:3107','new-ip'),password,true),/rate_limited/);
});
test('cutover requires recovery controls removed and two newly tested independent passkeys', async () => {
  process.env.WIDEORDER_ADMIN_PASSWORD_HASH=hash; process.env.WIDEORDER_ADMIN_RECOVERY=window();
  const recovered=await redeemHostingerRecovery(request(),password,true);
  const admin=await getEnrollmentAdminFromRequest(request(recovered.token));
  const input={action:'cutover',confirm:'ENABLE PASSKEY ONLY',independentConfirmed:true,recoveryReviewed:true};
  await updateAccessState(state=>{state.sessions[0].grant={action:'cutover',expiresAt:new Date(Date.now()+60000).toISOString()};});
  process.env.WIDEORDER_ADMIN_PASSWORD_HASH='';
  await assert.rejects(manageAccess(admin.sessionId,input),/remove_bootstrap/);
  process.env.WIDEORDER_ADMIN_RECOVERY='';
  await assert.rejects(manageAccess(admin.sessionId,input),/backup_not_ready/);
  await updateAccessState(state=>{state.credentials.push(key('New provider A'),key('New provider B'));});
  await manageAccess(admin.sessionId,input);
  assert.equal((await readAccessState()).mode,'passkey');
  assert.equal(await getEnrollmentAdminFromRequest(request(recovered.token)),null);
  assert.equal((await authenticateAdmin(request(),password)).error,'password_disabled');
});
