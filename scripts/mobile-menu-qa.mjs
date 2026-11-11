import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const base = process.env.QA_BASE_URL || 'http://localhost:3104';
const out = process.env.QA_OUTPUT_DIRECTORY || '.release/v020002/menu';
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const report = [], errors = [];
try {
  for (const theme of ['light', 'dark', 'option3-light', 'option3-dark']) {
    const context = await browser.newContext({ hasTouch: true, reducedMotion: 'reduce' });
    await context.addInitScript(theme => localStorage.setItem('wideorder-theme', theme), theme);
    const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
    for (const width of [320, 360, 375, 390, 430, 768]) for (const orientation of ['portrait', 'landscape']) {
      const height = orientation === 'portrait' ? Math.max(844, width + 200) : Math.min(375, width - 80);
      await page.setViewportSize({ width, height }); await page.goto(base);
      await page.getByRole('button', { name: 'Open navigation menu' }).tap();
      await page.waitForFunction(() => document.activeElement?.closest('.mobile-navigation__panel'));
      const panel = page.locator('.mobile-navigation__panel');
      const bounds = await panel.boundingBox();
      assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width + 1, `${width} ${orientation}: panel outside horizontal viewport`);
      assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= height + 1, `${width} ${orientation}: panel outside vertical viewport`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      const file = `${theme}-${width}-${orientation}.png`;
      await page.screenshot({ path: `${out}/${file}` });
      for (const link of await panel.locator('a').all()) {
        await link.scrollIntoViewIfNeeded();
        const visible = await link.evaluate(el => {
          const r = el.getBoundingClientRect(), p = el.closest('.mobile-navigation__panel').getBoundingClientRect();
          const range = document.createRange(); range.selectNodeContents(el); const text = range.getBoundingClientRect();
          return r.left >= p.left && r.right <= p.right && text.left >= p.left && text.right <= p.right &&
            el.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2));
        });
        assert.equal(visible, true, `Clipped or covered label: ${await link.innerText()} (${width}, ${theme}, ${orientation})`);
      }
      if (orientation === 'landscape') await page.screenshot({ path: `${out}/${theme}-${width}-landscape-scrolled.png` });
      await page.keyboard.press('Escape');
      const trigger = page.getByRole('button', { name: 'Open navigation menu' });
      await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Open navigation menu');
      assert.equal(await trigger.evaluate(el => el === document.activeElement), true);
      assert.equal(await panel.evaluate(el => el.inert), true);
      await trigger.press('Enter');
      await page.locator('.site-header .brand-mark').click();
      assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
      await trigger.tap();
      await panel.getByRole('link', { name: 'Our Work', exact: true }).tap();
      await page.waitForURL('**/our-work');
      assert.equal(await page.getByRole('button', { name: 'Open navigation menu' }).getAttribute('aria-expanded'), 'false');
      assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
      report.push({ width, height, orientation, theme, bounds, file });
    }
    await context.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(`${out}/report.json`, JSON.stringify({ result: 'passed', cases: report, errors }, null, 2));
  console.log(`PASS: ${report.length} open-menu viewport/theme combinations; 72 screenshots, full-label hit testing, scrolling, touch, keyboard, Escape/focus return, outside dismissal and selection closure.`);
} finally { await browser.close(); }
