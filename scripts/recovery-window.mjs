import { randomUUID } from 'node:crypto';
// This prints non-secret authorization metadata only; it does not enable recovery.
const starts = new Date();
console.log(`${randomUUID()}|${starts.toISOString()}|${new Date(starts.getTime() + 3600000).toISOString()}`);
