import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const base = process.env.QA_BASE_URL || 'http://localhost:3104';
const output = process.env.QA_OUTPUT_DIRECTORY || '.release/phase02';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const routes = ['/', '/what-we-do', '/how-we-work', '/our-work', '/our-approach', '/contact', ...['month-end-reporting', 'retail-pricing', 'technology-deployment', 'remote-infrastructure-printing'].map(s => '/our-work/' + s)];
const widths = [320, 390, 540, 768, 930, 1100, 1440];
const themes = ['light', 'dark', 'option3-light', 'option3-dark'];
const errors = [], words = {}, captures = [];
let checks = 0;
try {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  await context.route('**/api/marketing-config', r => r.fulfill({ json: { enabled: false } }));
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  for (const route of routes) {
    await page.goto(base + route);
    await page.evaluate(() => document.fonts.ready);
    words[route] = (await page.locator('main').innerText()).split(/\s+/).length;
    for (const width of widths) {
      await page.setViewportSize({ width, height: 1000 });
      for (const theme of themes) {
        await page.evaluate(theme => document.documentElement.setAttribute('data-theme', theme), theme);
        await page.waitForTimeout(300);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${route} ${width} ${theme}`);
        for (const panel of await page.locator('.comparison__panel').all()) assert.equal(await panel.isVisible(), true);
        if ([320, 390, 768, 1100, 1440].includes(width) && theme === 'option3-light' || route === '/' && width === 390) {
          const file = `${route.replaceAll('/', '_') || 'home'}-${width}-${theme}.png`;
          await page.screenshot({ path: `${output}/${file}`, fullPage: true }); captures.push(file);
        }
        checks++;
      }
    }
  }
  await page.setViewportSize({ width: 390, height: 850 });
  await page.goto(base);
  const menu = page.getByRole('button', { name: 'Open navigation menu' });
  await menu.click();
  await page.waitForFunction(() => document.activeElement?.closest('.mobile-navigation__panel'));
  await page.keyboard.press('Escape');
  assert.equal(await menu.getAttribute('aria-expanded'), 'false');
  assert.equal(await menu.evaluate(el => el === document.activeElement), true);
  assert.equal(await page.locator('.mobile-navigation__panel').evaluate(el => el.inert), true);
  await menu.click();
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Our Work', exact: true }).click();
  await page.waitForURL('**/our-work');
  assert.equal(await menu.getAttribute('aria-expanded'), 'false');
  await page.goto(base);
  const order = page.getByRole('button', { name: /Order/ });
  await order.focus(); await order.press('Enter');
  assert.equal(await order.getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('.clarity__node').first().evaluate(el => getComputedStyle(el).transitionDuration), '0s');
  const touch = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 850 } });
  const phone = await touch.newPage(); await phone.goto(base);
  await phone.getByRole('button', { name: /Clarity/ }).tap();
  assert.equal(await phone.locator('.clarity').getAttribute('data-stage'), '1');
  await phone.locator('.comparison summary').last().tap();
  assert.equal(await phone.locator('.comparison details').last().getAttribute('open'), '');
  await touch.close();
  const noJS = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 850 } });
  const plain = await noJS.newPage(); await plain.goto(base + '/our-work/month-end-reporting');
  assert.equal(await plain.locator('.comparison__panel:visible').count(), 2);
  assert.match(await plain.locator('main').innerText(), /99.2%/);
  await plain.locator('.comparison summary').first().click();
  assert.equal(await plain.locator('.comparison details').first().getAttribute('open'), '');
  await noJS.close();
  assert.deepEqual(errors, []);
  const report = { result: 'passed', checks, widths, themes, screenshots: captures.length, captures, words, keyboardNavigation: true, touch: true, reducedMotion: true, noJavaScriptComparison: true, errors };
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, captures: undefined }));
} finally { await browser.close(); }
