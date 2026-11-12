import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { hashAdminPassword } from '../src/lib/managed-config/crypto.ts';
mkdirSync(new URL('../.release/', import.meta.url), { recursive: true });
const password = `Qa-${randomUUID()}!`;
const dbPath = path.join(tmpdir(), `inquiry-qa-security-${randomUUID()}.sqlite`);
Object.assign(process.env, { NODE_ENV: 'development', RELEASE_ENVIRONMENT: 'development', SITE_INDEXABLE: 'false', WIDEORDER_DATABASE_URL: '', MYSQL_HOST: '', DB_HOST: '', WIDEORDER_LOCAL_CONFIG_DB_PATH: dbPath, WIDEORDER_CONFIG_ENCRYPTION_KEY: randomUUID(), WIDEORDER_ADMIN_PASSWORD_HASH: '', WIDEORDER_ADMIN_RECOVERY: '', SMTP_USER: '', SMTP_PASSWORD: '', SMTP_FROM_EMAIL: '', SMTP_RECIPIENT: '', SMTP_ACKNOWLEDGMENT: 'false', NEXT_PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA', TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA' });
const { getManagedConfigStore } = await import('../src/lib/managed-config/storage.ts');
await (await getManagedConfigStore()).upsertAdminCredential({ adminEmail: 'info@wideorder.net', passwordHash: hashAdminPassword(password), updatedAt: new Date().toISOString(), updatedBy: 'isolated QA' });
if (process.argv.includes('--host-recovery')) {
  process.env.WIDEORDER_ADMIN_PASSWORD_HASH = hashAdminPassword(password);
  process.env.WIDEORDER_ADMIN_RECOVERY = `${randomUUID()}|${new Date().toISOString()}|${new Date(Date.now()+3500000).toISOString()}`;
  const { updateAccessState } = await import('../src/lib/access/state.ts');
  await updateAccessState(state => { state.mode = 'passkey'; });
}
writeFileSync(new URL('../.release/security-qa.json', import.meta.url), JSON.stringify({ password, dbPath }));
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--webpack', '--port', '3107'], { env: { ...process.env, NODE_OPTIONS: `${process.env.NODE_OPTIONS || ''} --import=${new URL('./inquiry-qa-provider.mjs', import.meta.url).href}` }, stdio: 'inherit' });
process.on('SIGINT', () => child.kill());
