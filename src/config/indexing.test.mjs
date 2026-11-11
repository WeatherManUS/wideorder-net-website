import test from 'node:test';
import assert from 'node:assert/strict';
import { indexingEnabled, indexingRobots, indexingMetadata } from './indexing.ts';
import sitemap from '../app/sitemap.ts';
import { buildPageMetadata, siteConfig } from './site.ts';
import { crawlerDiagnostic } from '../../scripts/crawler-diagnostic.mjs';
import nextConfig from '../../next.config.mjs';

test('indexing requires exact approval and production; preview/local stay closed', () => {
  assert.equal(indexingEnabled({ NODE_ENV: 'production', SITE_INDEXABLE: 'true' }), true);
  for (const flag of [undefined, '', 'false', 'TRUE', '1']) assert.equal(indexingEnabled({ NODE_ENV: 'production', SITE_INDEXABLE: flag }), false);
  for (const environment of ['staging', 'development', 'preview', 'unknown']) assert.equal(indexingEnabled({ NODE_ENV: 'production', RELEASE_ENVIRONMENT: environment, SITE_INDEXABLE: 'true' }), false);
  assert.equal(indexingEnabled({ NODE_ENV: 'development', RELEASE_ENVIRONMENT: 'production', SITE_INDEXABLE: 'true' }), false);
});
test('preview robots block all; production excludes private namespaces without blocking public assets', () => {
  assert.deepEqual(indexingRobots(false, siteConfig.domain), { rules: { userAgent: '*', disallow: '/' } });
  const robots = indexingRobots(true, siteConfig.domain);
  assert.equal(robots.rules.allow, '/');
  assert.deepEqual(robots.rules.disallow, ['/admin', '/api', '/version.json']);
  assert.equal(robots.sitemap, 'https://wideorder.net/sitemap.xml');
  assert.deepEqual(indexingMetadata(false), { index: false, follow: false });
  assert.deepEqual(indexingMetadata(true), { index: true, follow: true });
});
test('sitemap is unique, canonical, HTTPS and public-only', () => {
  const entries = sitemap();
  assert.equal(entries.length, 11);
  assert.equal(new Set(entries.map(entry => entry.url)).size, entries.length);
  for (const entry of entries) {
    const url = new URL(entry.url);
    assert.equal(url.origin, 'https://wideorder.net');
    assert.equal(url.search + url.hash, '');
    assert.ok(!/^\/(admin|api)(\/|$)/.test(url.pathname));
    const metadata = buildPageMetadata({ title: 'QA', description: 'QA', path: url.pathname });
    assert.equal(new URL(metadata.alternates.canonical, siteConfig.domain).href, url.href);
  }
});
test('private namespaces have noindex HTTP headers independent of launch approval', async () => {
  const headers = await nextConfig.headers();
  for (const source of ['/admin/:path*', '/api/:path*', '/version.json']) assert.ok(headers.some(rule => rule.source === source && rule.headers.some(header => header.key === 'X-Robots-Tag' && header.value === 'noindex, nofollow')));
});
test('spoofed crawler rejection or probe failure is diagnostic, never genuine-crawler proof', async () => {
  const blocked = await crawlerDiagnostic('https://wideorder.net/', async () => new Response('', { status: 403, headers: { server: 'hcdn', 'x-hcdn-request-id': 'fixture' } }));
  assert.equal(blocked.status, 403); assert.equal(blocked.headers['x-hcdn-request-id'], 'fixture'); assert.equal(blocked.genuineGooglebot, 'not tested');
  const ok = await crawlerDiagnostic('https://wideorder.net/', async () => new Response('OK'));
  assert.equal(ok.status, 200); assert.equal(ok.genuineGooglebot, 'not tested');
  const failed = await crawlerDiagnostic('https://wideorder.net/', async () => { throw new Error('fixture'); });
  assert.equal(failed.status, null); assert.equal(failed.genuineGooglebot, 'not tested');
});
