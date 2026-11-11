// Loaded only by the isolated local QA launcher, never by application code.
if (process.env.NODE_ENV !== 'development' || !process.env.WIDEORDER_LOCAL_CONFIG_DB_PATH?.includes('inquiry-qa-') || process.env.WIDEORDER_DATABASE_URL) {
  throw new Error('Refusing provider fixture outside isolated local QA');
}
const original = globalThis.fetch;
const redeemed = new Set();
globalThis.fetch = async (input, init) => {
  if (String(input) !== 'https://challenges.cloudflare.com/turnstile/v0/siteverify') return original(input, init);
  const body = new URLSearchParams(init?.body);
  const token = body.get('response') || '';
  const valid = body.get('secret') === process.env.TURNSTILE_SECRET_KEY && /^fixture-[a-f0-9-]+$/.test(token) && !redeemed.has(token);
  if (valid) redeemed.add(token);
  return Response.json({ success: valid, action: 'contact', hostname: 'localhost', 'error-codes': valid ? [] : ['invalid-input-response'] });
};
