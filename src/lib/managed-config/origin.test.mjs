import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isTrustedBrowserOrigin, isTrustedBrowserReferer, resolveTrustedPublicOrigin } from './origin.ts';
import { isTrustedAdminOrigin } from './admin.ts';

function runtime(mode, run) {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = mode;
  try { run(); } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
}
const request = headers => new Request('https://wideorder.net/api/admin/settings', { method: 'POST', headers });

test('production Origin and Referer accept only approved URL origins', () => runtime('production', () => {
  for (const origin of ['https://wideorder.net', 'https://www.wideorder.net', 'https://wideorder.net:443', 'https://WIDEORDER.NET']) {
    assert.equal(isTrustedBrowserOrigin(origin), true, origin);
    assert.equal(isTrustedBrowserReferer(origin + '/admin/settings?category=security'), true, origin);
    assert.equal(isTrustedAdminOrigin(request({ origin })), true, origin);
    assert.equal(isTrustedAdminOrigin(request({ referer: origin + '/admin/settings' })), true, origin);
  }
  for (const origin of ['https://wideorder.net:8443', 'https://www.wideorder.net:8443', 'https://wideorder.net:80', 'http://wideorder.net', 'https://wideorder.net.', 'https://wideorder.net.evil.example', 'https://evil.example', 'http://localhost:3000', 'null', 'not a URL', '']) {
    assert.equal(isTrustedBrowserOrigin(origin), false, origin);
    assert.equal(isTrustedBrowserReferer(origin + '/admin/settings'), false, origin);
    assert.equal(isTrustedAdminOrigin(request({ origin, referer: 'https://evil.example/form' })), false, origin);
    assert.equal(isTrustedAdminOrigin(request({ referer: origin + '/admin/settings' })), false, origin);
  }
}));

test('admin CSRF rejects missing headers and never overrides a rejected Origin with Referer', () => runtime('production', () => {
  assert.equal(isTrustedAdminOrigin(request({})), false);
  for (const origin of ['https://wideorder.net:8443', 'https://evil.example', 'null']) {
    assert.equal(isTrustedAdminOrigin(request({ origin, referer: 'https://wideorder.net/admin/settings' })), false);
  }
  assert.equal(resolveTrustedPublicOrigin(request({ 'x-forwarded-host': 'wideorder.net:8443', 'x-forwarded-proto': 'https' })), 'https://wideorder.net');
}));

test('development retains localhost ports and loopback support without permitting unexpected production ports', () => runtime('development', () => {
  for (const origin of ['http://localhost:3105', 'https://localhost:8443', 'http://127.0.0.1:3000', 'http://[::1]:3107']) {
    assert.equal(isTrustedBrowserOrigin(origin), true);
    assert.equal(isTrustedBrowserReferer(origin + '/admin/settings'), true);
    assert.equal(isTrustedAdminOrigin(request({ origin })), true);
    assert.equal(resolveTrustedPublicOrigin(new Request(origin + '/admin/settings')), origin);
  }
  assert.equal(isTrustedBrowserOrigin('https://wideorder.net'), true);
  assert.equal(isTrustedBrowserOrigin('https://wideorder.net:8443'), false);
  assert.equal(isTrustedBrowserOrigin('http://localhost.evil.example:3105'), false);
}));
