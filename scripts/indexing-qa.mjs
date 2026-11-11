import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { releaseRoutes } from './release-routes.mjs';
import { crawlerDiagnostic } from './crawler-diagnostic.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const base = process.env.QA_BASE_URL || 'http://localhost:3106';
const indexable = process.env.QA_EXPECT_INDEXABLE === 'true';
const output = process.env.QA_OUTPUT_DIRECTORY || '.release/googlebot/qa';
const browser = await chromium.launch();
const report = { base, checkedAt: new Date().toISOString(), expectedIndexable: indexable, pages: [], privateRoutes: [], crawler: [], genuineGooglebot: 'not tested' };
try {
  const page = await browser.newPage();
  for (const path of releaseRoutes) {
    const response = await page.goto(base + path);
    assert.equal(response.status(), 200, path);
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    assert.equal(robots, indexable ? 'index, follow' : 'noindex, nofollow', path);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    assert.equal(new URL(canonical).href, new URL(path, 'https://wideorder.net').href, path);
    const headers = await response.allHeaders();
    if (indexable) assert.ok(!/noindex|none/i.test(headers['x-robots-tag'] || ''), path);
    report.pages.push({ path, status: response.status(), robots, canonical, xRobotsTag: headers['x-robots-tag'] ?? null, requestId: headers['x-hcdn-request-id'] ?? null });
  }
  const robotsResponse = await page.request.get(base + '/robots.txt');
  assert.equal(robotsResponse.status(), 200);
  const robots = await robotsResponse.text();
  if (indexable) {
    assert.match(robots, /^Allow: \/$/m);
    for (const path of ['/admin', '/api', '/version.json']) assert.ok(robots.includes(`Disallow: ${path}`));
    assert.match(robots, /Sitemap: https:\/\/wideorder.net\/sitemap.xml/);
  } else { assert.match(robots, /^Disallow: \/$/m); assert.ok(!robots.includes('Allow: /')); }
  report.robots = robots;
  const sitemap = await page.request.get(base + '/sitemap.xml');
  assert.equal(sitemap.status(), 200);
  const xml = await sitemap.text();
  const entries = await page.evaluate(xml => {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (doc.querySelector('parsererror')) throw new Error('Invalid XML');
    if (doc.documentElement.namespaceURI !== 'http://www.sitemaps.org/schemas/sitemap/0.9') throw new Error('Invalid sitemap namespace');
    return [...doc.querySelectorAll('loc')].map(el => el.textContent);
  }, xml);
  assert.deepEqual(entries.map(url => new URL(url).pathname).sort(), [...releaseRoutes].sort());
  assert.equal(new Set(entries).size, entries.length);
  for (const url of entries) assert.equal(new URL(url).origin, 'https://wideorder.net');
  report.sitemap = entries;
  for (const path of ['/admin/login', '/admin/settings', '/admin/inquiries/00000000-0000-0000-0000-000000000000', '/api/contact-config']) {
    const response = await page.request.get(base + path, { maxRedirects: 0 });
    assert.match(response.headers()['x-robots-tag'] || '', /noindex/);
    if (path.startsWith('/admin/') && path !== '/admin/login') assert.ok([303, 307].includes(response.status()), path);
    report.privateRoutes.push({ path, status: response.status(), xRobotsTag: response.headers()['x-robots-tag'] });
  }
  const admin = await page.goto(base + '/admin/login');
  assert.equal(admin.status(), 200);
  assert.match(await page.locator('meta[name="robots"]').getAttribute('content'), /noindex/);
  for (const path of ['/', '/robots.txt', '/sitemap.xml']) report.crawler.push(await crawlerDiagnostic(new URL(path, base)));
  report.result = 'passed';
  await mkdir(output, { recursive: true });
  await writeFile(`${output}/indexing-report.json`, JSON.stringify(report, null, 2));
  console.log(`PASS: 11 rendered public routes, canonical URLs, robots metadata, XML sitemap, private-route noindex/authentication. Indexable=${indexable}. Crawler claims recorded separately; genuine Googlebot not tested.`);
} finally { await browser.close(); }
