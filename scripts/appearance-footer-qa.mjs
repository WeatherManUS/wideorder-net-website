import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { appearances } from "../src/theme/appearances.ts";
import { formatPublicationTime } from "../src/lib/release/footer.ts";
import { verifyHtmlFooter, recordPublication } from "../src/lib/release/publication.ts";
import { readBuildRecord } from "../src/lib/release/metadata.ts";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || "playwright");
const base = process.env.QA_BASE_URL || "http://localhost:3104";
const output = new URL("../.release/appearance-qa/", import.meta.url);
await mkdir(output, { recursive: true });
const errors = [];
const browser = await chromium.launch();
const paths = ["/", "/what-we-do", "/how-we-work", "/our-work", "/our-approach", "/contact", "/privacy", ...["retail-pricing", "technology-deployment", "remote-infrastructure-printing", "month-end-reporting"].map((slug) => `/our-work/${slug}`)];
try {
  if (process.env.QA_SEED_LOCAL_PUBLICATION === "true") {
    assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname), "Fixtures are allowed only on localhost.");
    assert.ok(!readBuildRecord().versionPolicy, "Policy-managed artifacts use the durable ledger, never local publication fixtures.");
    const previous = await fetch(`${base}/version.json`).then((response) => response.json());
    if (!previous.publishedAt) {
      const html = await fetch(base).then((response) => response.text());
      assert.ok(html.includes("Publication not yet confirmed"));
      await recordPublication(readBuildRecord(), "999999.1");
    }
  }
  const releaseResponse = await fetch(`${base}/version.json`, { cache: "no-store" });
  const release = await releaseResponse.json();
  assert.equal(releaseResponse.status, 200);
  assert.ok(release.publishedAt, "This audit requires a confirmed release or explicitly local fixture.");
  const publication = formatPublicationTime(release.publishedAt);
  for (const path of paths) {
    const response = await fetch(`${base}${path}`, { cache: "no-store" });
    assert.equal(response.status, 200);
    assert.match(response.headers.get("cache-control") || "", /no-store/);
    const html = await response.text();
    assert.equal(verifyHtmlFooter(html, release), true, path);
    const footer = /<footer\b[^>]*>[\s\S]*?<\/footer>/i.exec(html)?.[0];
    assert.ok(footer?.includes(publication), `Publication text must be in the initial HTML: ${path}`);
  }

  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base);
  await page.evaluate(() => document.fonts.ready);
  let trigger = page.getByRole("button", { name: /^Appearance:/ });
  await trigger.hover();
  await page.getByRole("menu", { name: "Choose appearance" }).waitFor();
  assert.equal(await page.getByRole("menuitemradio").count(), 4);
  assert.ok(!/Option [13]/.test(await page.locator(".appearance-menu").innerText()));
  await page.mouse.move(0, 0);
  await page.waitForTimeout(180);
  assert.equal(await page.locator(".appearance-menu").count(), 0);
  await trigger.hover();
  await page.getByRole("menu", { name: "Choose appearance" }).waitFor();
  await page.keyboard.press("Escape");
  assert.equal(await page.locator(".appearance-menu").count(), 0);
  for (const width of [1440, 390, 320, 768, 1140]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const appearance of appearances) {
      await trigger.click();
      await page.getByRole("menuitemradio", { name: appearance.name }).click();
      assert.equal(await page.locator("html").getAttribute("data-theme"), appearance.id);
      assert.equal(await page.evaluate(() => localStorage.getItem("wideorder-theme")), appearance.id);
      await trigger.click();
      assert.equal(await page.getByRole("menuitemradio", { checked: true }).count(), 1);
      assert.equal(await page.getByRole("menuitemradio", { name: appearance.name }).getAttribute("aria-checked"), "true");
      const bounds = await page.locator(".appearance-menu").boundingBox();
      assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width + 1, `Menu fits ${width}px`);
      await page.keyboard.press("Escape");
      await page.reload();
      assert.equal(await page.locator("html").getAttribute("data-theme"), appearance.id);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  trigger = page.getByRole("button", { name: /^Appearance:/ });
  await trigger.focus();
  await trigger.press("ArrowDown");
  await page.waitForFunction(() => document.activeElement.getAttribute("role") === "menuitemradio");
  await page.keyboard.press("Home");
  assert.match(await page.evaluate(() => document.activeElement.textContent), /Ivory & Sage/);
  await page.keyboard.press("End");
  assert.match(await page.evaluate(() => document.activeElement.textContent), /Ink & Indigo/);
  await page.keyboard.press("Enter");
  assert.equal(await page.locator("html").getAttribute("data-theme"), "option3-dark");
  assert.equal(await trigger.evaluate((element) => element === document.activeElement), true);
  await trigger.press("Space");
  await page.waitForFunction(() => document.activeElement.getAttribute("role") === "menuitemradio");
  await page.keyboard.press("ArrowUp");
  assert.match(await page.evaluate(() => document.activeElement.textContent), /Pearl & Indigo/);
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("html").getAttribute("data-theme"), "option3-dark");
  await trigger.press("ArrowDown");
  await page.waitForFunction(() => document.activeElement.getAttribute("role") === "menuitemradio");
  await page.keyboard.press("Tab");
  assert.equal(await page.locator(".appearance-menu").count(), 0);
  assert.equal(await page.evaluate(() => document.activeElement.tagName), "A");
  await trigger.click();
  await page.screenshot({ path: fileURLToPath(new URL("desktop-menu.png", output)) });
  await page.getByRole("heading", { name: "There is a better way.", exact: true }).click();
  assert.equal(await page.locator(".appearance-menu").count(), 0);
  await context.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const touch = await mobile.newPage();
  await touch.goto(base);
  for (const appearance of appearances) {
    await touch.getByRole("button", { name: /^Appearance:/ }).tap();
    await touch.getByRole("menuitemradio", { name: appearance.name }).tap();
    assert.equal(await touch.locator("html").getAttribute("data-theme"), appearance.id);
  }
  await touch.locator("footer").scrollIntoViewIfNeeded();
  await touch.screenshot({ path: fileURLToPath(new URL("mobile-footer.png", output)) });
  await mobile.close();

  const noJS = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const crawler = await noJS.newPage();
  await crawler.goto(base);
  const footer = crawler.locator(".site-footer__release");
  assert.equal(await footer.isVisible(), true);
  assert.ok((await footer.innerText()).includes(`v${release.version}`));
  assert.ok((await footer.innerText()).includes(publication));
  await noJS.close();

  if (process.env.QA_HIDDEN_BASE_URL) {
    const response = await fetch(process.env.QA_HIDDEN_BASE_URL);
    const html = await response.text();
    assert.equal(verifyHtmlFooter(html, release), false);
    assert.ok(!/<footer\b[\s\S]*data-footer-release=/.test(html));
    const hiddenRelease = await fetch(`${process.env.QA_HIDDEN_BASE_URL}/version.json`).then((response) => response.json());
    assert.equal(hiddenRelease.releaseId, release.releaseId);
    assert.equal(hiddenRelease.publishedAt, release.publishedAt);
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ result: "passed", htmlRoutes: paths.length, themeViewportCombinations: 20, keyboard: true, hover: true, touch: true, persistence: true, javascriptDisabledFooter: true, hiddenFlag: Boolean(process.env.QA_HIDDEN_BASE_URL), version: release.version, buildId: release.buildId, published: publication }));
} finally { await browser.close(); }
