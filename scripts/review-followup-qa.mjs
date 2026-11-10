import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const base = process.env.QA_BASE_URL || 'http://localhost:3104';
const browser = await chromium.launch();
const errors = [];
try {
  for (const touch of [false, true]) {
    const context = await browser.newContext({ viewport: { width: touch ? 390 : 1440, height: 1000 }, hasTouch: touch, isMobile: touch });
    const page = await context.newPage();
    await context.route('**/api/marketing-config', route => route.fulfill({ json: { enabled: false } }));
    page.on('pageerror', error => errors.push(error.message));
    for (const slug of ['retail-pricing', 'technology-deployment', 'remote-infrastructure-printing', 'month-end-reporting']) {
      await page.goto(`${base}/our-work/${slug}`);
      const comparison = page.locator('.case-comparison');
      await comparison.scrollIntoViewIfNeeded();
      const before = await comparison.locator('p').innerText();
      const after = comparison.getByRole('button', { name: 'After', exact: true });
      if (touch) await after.tap(); else { await after.focus(); await after.press('Enter'); }
      assert.equal(await after.getAttribute('aria-pressed'), 'true');
      assert.notEqual(await comparison.locator('p').innerText(), before);
      const reset = comparison.getByRole('button', { name: 'Before', exact: true });
      if (touch) await reset.tap(); else { await reset.focus(); await reset.press('Space'); }
      assert.equal(await comparison.locator('p').innerText(), before);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }
    await page.goto(base);
    assert.equal(await page.locator('h1').innerText(), 'Solve the problems holding your business back.');
    await page.locator('.flagship-story').getByRole('button', { name: 'After', exact: true }).click();
    assert.equal(await page.locator('.flagship-story [aria-pressed="true"]').innerText(), 'After');
    await context.close();
  }
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const route of ['/admin/login', '/missing-review-page', '/our-work/retail-pricing']) {
    await page.goto(`${base}${route}`);
    assert.equal(await page.locator('footer [data-footer-release]').count(), 1, route);
  }
  await context.close();
  assert.deepEqual(errors, []);
  console.log('Passed: 8 case-study keyboard/touch comparisons, featured comparison, responsive layout, initial HTML utility footers, no browser errors.');
} finally { await browser.close(); }
