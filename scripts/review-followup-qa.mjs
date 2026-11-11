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
      const comparison = page.locator('.comparison');
      assert.equal(await comparison.locator('.comparison__panel').count(), 2);
      for (const summary of await comparison.locator('summary').all()) {
        if (touch) await summary.tap(); else { await summary.focus(); await summary.press('Enter'); }
        assert.equal(await summary.evaluate(el => el.parentElement.open), true);
        if (touch) await summary.tap(); else await summary.press('Space');
        assert.equal(await summary.evaluate(el => el.parentElement.open), false);
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }
    await page.goto(base);
    assert.equal(await page.locator('h1').innerText(), "Your business shouldn't have to work this hard.");
    assert.equal(await page.locator('.comparison[data-story="month-end-reporting"]').count(), 1);
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
