import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const base = 'http://localhost:3107';
const fixture = JSON.parse(readFileSync(new URL('../.release/security-qa.json', import.meta.url)));
assert.ok(fixture.dbPath.includes('inquiry-qa-security-'));
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await cdp.send('WebAuthn.enable');
const devices = new Map(); let current;
const results = [], errors = [];
page.on('pageerror', error => errors.push(error.message));
const post = (data, headers = {}) => context.request.post(base + '/api/admin/access', { data, headers: { Origin: base, ...headers } });
async function api(data) { const r = await post(data); const value = await r.json(); assert.equal(r.status(), 200, JSON.stringify(value)); return value; }
async function device(name, synced = false) {
  if (current) { devices.get(current.name).credentials = (await cdp.send('WebAuthn.getCredentials', { authenticatorId: current.id })).credentials; await cdp.send('WebAuthn.removeVirtualAuthenticator', { authenticatorId: current.id }); }
  if (!devices.has(name)) devices.set(name, { synced, credentials: [] });
  const saved = devices.get(name);
  const { authenticatorId } = await cdp.send('WebAuthn.addVirtualAuthenticator', { options: { protocol: 'ctap2', transport: saved.synced ? 'internal' : 'usb', hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true, defaultBackupEligibility: saved.synced, defaultBackupState: saved.synced } });
  for (const credential of saved.credentials) await cdp.send('WebAuthn.addCredential', { authenticatorId, credential });
  current = { name, id: authenticatorId };
}
async function signed(options, register = false) {
  return page.evaluate(async ({ options, register }) => {
    const decode = value => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const publicKey = { ...options, challenge: decode(options.challenge) };
    if (register) { publicKey.user = { ...options.user, id: decode(options.user.id) }; publicKey.excludeCredentials = (options.excludeCredentials || []).map(item => ({ ...item, id: decode(item.id) })); }
    else if (options.allowCredentials) publicKey.allowCredentials = options.allowCredentials.map(item => ({ ...item, id: decode(item.id) }));
    const result = register ? await navigator.credentials.create({ publicKey }) : await navigator.credentials.get({ publicKey });
    return result.toJSON();
  }, { options, register });
}
async function verify(action) {
  const options = await api({ operation: 'options', purpose: action ? 'verify' : 'login', action });
  const response = await signed(options.options);
  return api({ operation: 'verify', ceremonyId: options.ceremonyId, response });
}
async function register(name, recoveryGroup) {
  const options = await api({ operation: 'options', purpose: 'register', name, recoveryGroup });
  assert.equal(options.options.authenticatorSelection.residentKey, 'required');
  assert.equal(options.options.authenticatorSelection.userVerification, 'required');
  await api({ operation: 'verify', ceremonyId: options.ceremonyId, response: await signed(options.options, true) });
}
const view = async () => (await context.request.get(base + '/api/admin/access')).json();
try {
  assert.equal((await post({ operation: 'options', purpose: 'login' }, { Origin: 'https://evil.example' })).status(), 403);
  assert.equal((await post({ operation: 'options', purpose: 'register', name: 'blocked', recoveryGroup: 'blocked' })).status(), 401);
  const login = await context.request.post(base + '/api/admin/login', { form: { password: fixture.password }, headers: { Origin: base }, maxRedirects: 0 });
  assert.equal(login.status(), 303);
  await page.goto(base + '/admin/settings?category=security');
  await page.getByRole('heading', { name: 'Security & Access', exact: true }).waitFor();
  await page.waitForLoadState('networkidle');
  await device('invalid-registration');
  const badRegistration = await api({ operation: 'options', purpose: 'register', name: 'Rejected', recoveryGroup: 'Rejected' });
  const badResponse = await signed(badRegistration.options, true);
  const badClient = JSON.parse(Buffer.from(badResponse.response.clientDataJSON, 'base64url')); badClient.origin = 'https://evil.example';
  badResponse.response.clientDataJSON = Buffer.from(JSON.stringify(badClient)).toString('base64url');
  assert.equal((await post({ operation: 'verify', ceremonyId: badRegistration.ceremonyId, response: badResponse })).status(), 400);
  assert.equal((await view()).credentials.length, 0);
  results.push('registration origin mismatch rejected');
  await device('primary', true);
  // Exercise the actual enrollment UI and SimpleWebAuthn browser client.
  await page.getByLabel('Passkey name', { exact: true }).fill('Primary synced');
  await page.getByLabel('Independent recovery group', { exact: true }).fill('Provider A');
  await page.getByRole('button', { name: 'Add passkey', exact: true }).click();
  await page.getByRole('heading', { name: 'Primary synced', exact: true }).waitFor();
  let state = await view(); const primary = state.credentials[0].ref;
  assert.equal(state.credentials[0].testedAt, null);
  assert.equal(state.backupReady, false);
  assert.equal((await post({ operation: 'options', purpose: 'register', name: 'No step-up', recoveryGroup: 'blocked' })).status(), 400);
  await verify(`test:${primary}`);
  // Rejection cases use real authenticator output, then alter one security property.
  const mutations = {
    unknown: r => { r.id = 'unknown'; r.rawId = 'unknown'; },
    challenge: r => { const client = JSON.parse(Buffer.from(r.response.clientDataJSON, 'base64url')); client.challenge = 'wrong'; r.response.clientDataJSON = Buffer.from(JSON.stringify(client)).toString('base64url'); },
    origin: r => { const client = JSON.parse(Buffer.from(r.response.clientDataJSON, 'base64url')); client.origin = 'https://evil.example'; r.response.clientDataJSON = Buffer.from(JSON.stringify(client)).toString('base64url'); },
    relyingParty: r => { const data = Buffer.from(r.response.authenticatorData, 'base64url'); data.fill(0, 0, 32); r.response.authenticatorData = data.toString('base64url'); },
    userVerification: r => { const data = Buffer.from(r.response.authenticatorData, 'base64url'); data[32] &= ~4; r.response.authenticatorData = data.toString('base64url'); },
    signature: r => { r.response.signature = Buffer.alloc(64).toString('base64url'); },
    owner: r => { r.response.userHandle = 'another-account'; },
  };
  for (const [name, mutate] of Object.entries(mutations)) {
    const options = await api({ operation: 'options', purpose: 'verify', action: `test:${primary}` });
    const response = await signed(options.options); mutate(response);
    const rejected = await post({ operation: 'verify', ceremonyId: options.ceremonyId, response });
    assert.equal(rejected.status(), 400, name); results.push(`reject ${name}`);
  }
  const replay = await api({ operation: 'options', purpose: 'verify', action: `test:${primary}` });
  const response = await signed(replay.options);
  const concurrent = await Promise.all([post({ operation: 'verify', ceremonyId: replay.ceremonyId, response }), post({ operation: 'verify', ceremonyId: replay.ceremonyId, response })]);
  assert.deepEqual(concurrent.map(r => r.status()).sort(), [200, 400]); results.push('single-use concurrent replay rejection');
  await verify('register'); await device('backup', true); await register('Backup key', 'Independent synced provider');
  state = await view(); const backup = state.credentials.find(key => key.name === 'Backup key').ref;
  assert.equal(state.backupReady, false); await verify(`test:${backup}`); assert.equal((await view()).backupReady, true);
  assert.ok((await view()).credentials.filter(key => !key.revokedAt).every(key => key.deviceType === 'multiDevice'));
  // No fresh grant: ordinary Settings and SMTP mutations remain blocked.
  for (const path of ['/api/admin/settings', '/api/admin/smtp']) {
    const blocked = await context.request.post(base + path, { form: { action: path.includes('smtp') ? 'test_connection' : 'save_settings' }, headers: { Origin: base }, maxRedirects: 0 });
    assert.match(blocked.headers().location, /fresh_verification_required/);
  }
  await page.reload();
  await page.getByLabel('Rename Backup key', { exact: true }).fill('Offline backup');
  await page.getByLabel('Rename Backup key', { exact: true }).locator('..').locator('..').getByRole('button', { name: 'Save passkey name' }).click();
  await page.getByRole('heading', { name: 'Offline backup', exact: true }).waitFor();
  await verify('cutover');
  assert.equal((await post({ operation: 'manage', action: 'cutover', independentConfirmed: false, recoveryReviewed: true, confirm: 'ENABLE PASSKEY ONLY' })).status(), 400);
  await verify('cutover');
  const cutover = await api({ operation: 'manage', action: 'cutover', independentConfirmed: true, recoveryReviewed: true, confirm: 'ENABLE PASSKEY ONLY' });
  assert.match(cutover.redirect, /passkey_only/);
  assert.equal((await context.request.get(base + '/api/admin/access')).status(), 401);
  const oldPassword = await context.request.post(base + '/api/admin/login', { form: { password: fixture.password }, headers: { Origin: base }, maxRedirects: 0 });
  assert.match(oldPassword.headers().location, /password_disabled/);
  await context.clearCookies(); await page.goto(base + '/admin/login');
  assert.equal(await page.locator('input[name="password"]').count(), 0);
  await page.getByRole('button', { name: 'Sign in with a passkey' }).click(); await page.waitForURL(base + '/admin/settings');
  assert.equal((await view()).mode, 'passkey');
  await verify(`revoke:${backup}`);
  assert.equal((await post({ operation: 'manage', action: 'revoke', ref: backup })).status(), 400);
  await verify('register'); await device('replacement'); await register('Replacement key', 'Replacement hardware');
  const replacement = (await view()).credentials.find(key => key.name === 'Replacement key').ref;
  await verify(`test:${replacement}`); await verify(`revoke:${backup}`); await api({ operation: 'manage', action: 'revoke', ref: backup });
  await device('backup');
  const revoked = await api({ operation: 'options', purpose: 'login' });
  assert.equal((await post({ operation: 'verify', ceremonyId: revoked.ceremonyId, response: await signed(revoked.options) })).status(), 400);
  await device('primary'); await context.clearCookies(); await verify();
  results.push('primary and independent backup registration/test', 'rename with step-up', 'explicit cutover', 'password endpoint disabled', 'fresh passkey-only login with each authenticator', 'unsafe revocation prevented', 'lost-key replacement and revocation');
  // Independent second session, then revoke all others and confirm old token fails.
  const oldCookies = await context.cookies(base);
  await context.clearCookies(); await device('replacement'); await verify(); await verify('sessions'); await api({ operation: 'manage', action: 'revoke_sessions' });
  const staleCookie = oldCookies.find(cookie => cookie.name === 'wideorder_admin_session');
  assert.equal((await context.request.get(base + '/api/admin/access', { headers: { Cookie: `wideorder_admin_session=${staleCookie.value}` } })).status(), 401);
  await page.goto(base + '/admin/settings?category=communications');
  await page.locator('[name="SMTP_FROM_NAME"]').fill('WideOrder QA');
  await page.getByRole('button', { name: 'Save settings', exact: true }).click();
  await page.waitForURL(/status=saved/);
  assert.equal(await page.locator('[name="SMTP_FROM_NAME"]').inputValue(), 'WideOrder QA');
  await page.getByRole('button', { name: 'Test connection', exact: true }).click();
  await page.waitForURL(/smtp_not_configured/);
  results.push('Settings save and SMTP controls require and accept fresh passkey verification');
  await page.goto(base + '/admin/settings?category=security');
  mkdirSync('.release/passkey-qa', { recursive: true });
  await page.locator('#security-access').screenshot({ path: '.release/passkey-qa/security-access.png' });
  const content = await page.content();
  const database = new DatabaseSync(fixture.dbPath); const stored = JSON.parse(database.prepare("SELECT body FROM wideorder_access_state WHERE id='admin'").get().body);
  for (const key of stored.credentials) { assert.ok(!content.includes(key.id)); assert.ok(!content.includes(key.publicKey)); }
  // Idle expiry is tested against the server's persisted clock fields, not a client timer.
  for (const session of stored.sessions) session.lastSeenAt = new Date(Date.now() - 31 * 60000).toISOString();
  database.prepare("UPDATE wideorder_access_state SET body=?, version=version+1 WHERE id='admin'").run(JSON.stringify(stored)); database.close();
  assert.equal((await context.request.get(base + '/api/admin/access')).status(), 401);
  await verify();
  const logout = await context.request.post(base + '/api/admin/logout', { headers: { Origin: base }, maxRedirects: 0 }); assert.equal(logout.status(), 303);
  assert.equal((await context.request.get(base + '/api/admin/access')).status(), 401);
  results.push('session rotation, other-session revocation, idle expiration, logout', 'no raw credential IDs/keys in rendered UI', 'CSRF and unauthorized registration rejection');
  assert.deepEqual(errors, []);
  writeFileSync('.release/passkey-qa/report.json', JSON.stringify({ results, pageErrors: errors, productionEnrollment: 'not performed; virtual authenticators only' }, null, 2));
  console.log(`PASS: ${results.length} passkey/security scenario groups using real Chromium WebAuthn signatures. Production device enrollment was not performed.`);
} finally { await browser.close(); }
