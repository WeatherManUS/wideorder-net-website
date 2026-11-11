import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
const fixture = JSON.parse(readFileSync(new URL('../.release/security-qa.json', import.meta.url)));
assert.ok(fixture.dbPath.includes('inquiry-qa-security-'));
// The preceding suite intentionally exercises many failures; reset only this isolated fixture's limiter between suites.
const fixtureDb = new DatabaseSync(fixture.dbPath); fixtureDb.exec('DELETE FROM wideorder_request_limits'); fixtureDb.close();
Object.assign(process.env, { NODE_ENV: 'test', WIDEORDER_DATABASE_URL: '', MYSQL_HOST: '', DB_HOST: '', WIDEORDER_LOCAL_CONFIG_DB_PATH: fixture.dbPath, WIDEORDER_ADMIN_PASSWORD_HASH: '' });
const { authorizeInfrastructureRecovery } = await import('../src/lib/access/recovery.ts');
const token = await authorizeInfrastructureRecovery('LOCAL-QA-OWNER-AUTHORIZATION');
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const browser = await chromium.launch();
const context = await browser.newContext(); const page = await context.newPage();
const cdp = await context.newCDPSession(page); await cdp.send('WebAuthn.enable');
const base = 'http://localhost:3107';
const post = data => context.request.post(base + '/api/admin/access', { data, headers: { Origin: base } });
const api = async data => { const r = await post(data); const body = await r.json(); assert.equal(r.status(), 200, JSON.stringify(body)); return body; };
async function verify(action) {
  const opts = await api({ operation: 'options', purpose: 'verify', action });
  const response = await page.evaluate(async options => { const b = value => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)); return (await navigator.credentials.get({ publicKey: { ...options, challenge: b(options.challenge) } })).toJSON(); }, opts.options);
  return api({ operation: 'verify', ceremonyId: opts.ceremonyId, response });
}
try {
  await page.goto(base + '/admin/recovery');
  await page.getByLabel('One-time infrastructure recovery authorization').fill(token);
  await page.getByRole('button', { name: 'Begin restricted recovery' }).click();
  await page.waitForURL(base + '/admin/enroll');
  assert.equal((await post({ operation: 'redeem_recovery', token })).status(), 400);
  assert.equal((await context.request.get(base + '/admin/settings', { maxRedirects: 0 })).status(), 307);
  const smtp = await context.request.post(base + '/api/admin/smtp', { form: { action: 'send_test' }, headers: { Origin: base }, maxRedirects: 0 }); assert.equal(smtp.status(), 401);
  assert.equal((await post({ operation: 'options', purpose: 'login' })).status(), 400);
  let authenticator;
  for (const name of ['Recovery primary', 'Recovery backup']) {
    if (authenticator) { await verify('register'); await cdp.send('WebAuthn.removeVirtualAuthenticator', { authenticatorId: authenticator }); }
    authenticator = (await cdp.send('WebAuthn.addVirtualAuthenticator', { options: { protocol: 'ctap2', transport: 'usb', hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true } })).authenticatorId;
    await page.getByLabel('Passkey name', { exact: true }).fill(name);
    await page.getByLabel('Independent recovery group', { exact: true }).fill(name);
    // The UI performs its own fresh step-up before subsequent registration; finish using API after the already granted step-up.
    if (name === 'Recovery primary') {
      await page.getByRole('button', { name: 'Add passkey', exact: true }).click();
      await page.getByRole('heading', { name, exact: true }).waitFor();
    } else {
      const opts = await api({ operation: 'options', purpose: 'register', name, recoveryGroup: name });
      const response = await page.evaluate(async options => { const b = value => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)); return (await navigator.credentials.create({ publicKey: { ...options, challenge: b(options.challenge), user: { ...options.user, id: b(options.user.id) }, excludeCredentials: options.excludeCredentials.map(item => ({ ...item, id: b(item.id) })) } })).toJSON(); }, opts.options);
      await api({ operation: 'verify', ceremonyId: opts.ceremonyId, response });
    }
    const state = await (await context.request.get(base + '/api/admin/access')).json();
    await verify(`test:${state.credentials.find(key => key.name === name && !key.revokedAt).ref}`);
    assert.equal((await context.request.get(base + '/admin/settings', { maxRedirects: 0 })).status(), 307);
    await page.reload();
  }
  await verify('cutover');
  await api({ operation: 'manage', action: 'cutover', independentConfirmed: true, recoveryReviewed: true, confirm: 'ENABLE PASSKEY ONLY' });
  await page.goto(base + '/admin/login');
  await page.getByRole('button', { name: 'Sign in with a passkey' }).click(); await page.waitForURL(base + '/admin/settings');
  assert.equal((await (await context.request.get(base + '/api/admin/access')).json()).mode, 'passkey');
  console.log('PASS: infrastructure-authorized total-loss recovery, one-time token, restricted enrollment, no Settings/SMTP access, two newly tested authenticators, explicit cutover and fresh passkey-only login. Local fixture only.');
} finally { await browser.close(); }
