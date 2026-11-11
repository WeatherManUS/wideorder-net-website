// Offline infrastructure operation. Never expose this command through a web endpoint.
import { authorizeInfrastructureRecovery } from '../src/lib/access/recovery.ts';

const [command, confirmation, reference] = process.argv.slice(2);
if (command !== 'begin-total-loss' || confirmation !== '--owner-authorized' || !/^[A-Za-z0-9._-]{8,80}$/.test(reference || '')) {
  throw new Error('Usage: node --experimental-transform-types scripts/admin-recovery.mjs begin-total-loss --owner-authorized AUTHORIZATION-REFERENCE');
}
if (!process.stdout.isTTY) throw new Error('Recovery authorization must be displayed only in an interactive operator terminal, never redirected to logs.');
const token = await authorizeInfrastructureRecovery(reference);
process.stdout.write(`One-time restricted enrollment authorization (15 minutes):\n${token}\nOpen https://wideorder.net/admin/recovery in a trusted browser. Do not email or log this value.\n`);
