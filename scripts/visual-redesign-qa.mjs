import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { appearances } from "../src/theme/appearances.ts";

// Use an existing Playwright installation; this audit adds no application dependency.
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || "playwright");
const baseURL = process.env.QA_BASE_URL || "http://localhost:3100";
const directory = new URL(process.env.QA_OUTPUT_DIRECTORY || "../docs/qa/editorial-redesign/", import.meta.url);
await mkdir(directory, { recursive: true });
const routes = ["/", "/what-we-do", "/how-we-work", "/our-work", "/our-approach", "/contact"];
const themes = ["light", "dark", "option3-light", "option3-dark"];
const browser = await chromium.launch();
const report = { cases: [], contrast: [], interactions: [], pageErrors: [] };

function luminance(hex) {
  const [r, g, b] = hex.match(/[a-f\d]{2}/ig).map((part) => parseInt(part, 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}
function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

try {
  for (const theme of themes) {
    const context = await browser.newContext({ reducedMotion: "reduce", colorScheme: "light" });
    await context.addInitScript((value) => localStorage.setItem("wideorder-theme", value), theme);
    const page = await context.newPage();
    page.on("pageerror", (error) => report.pageErrors.push(error.message));
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      for (const route of routes) {
        const response = await page.goto(`${baseURL}${route}`);
        assert.equal(response.status(), 200, route);
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.locator("main h1").count(), 1, `${route} H1`);
        assert.equal(await page.locator("html").getAttribute("data-theme"), theme);
        const layout = await page.evaluate(() => {
          const nav = document.querySelector(".primary-nav").getBoundingClientRect();
          const actions = document.querySelector(".site-header__actions").getBoundingClientRect();
          const textOverflow = [...document.querySelectorAll("main h1, main h2, .result-display, .proof-story__metric, .contact-card")]
            .filter((element) => element.scrollWidth > element.clientWidth + 1)
            .map((element) => element.className);
          return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            headerOverlap: nav.width > 0 && nav.right > actions.left,
            font: getComputedStyle(document.querySelector("h1")).fontFamily,
            textOverflow,
            language: document.documentElement.lang,
            canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
          };
        });
        assert.equal(layout.overflow, false, `${theme} ${width} ${route}: page overflow`);
        assert.equal(layout.headerOverlap, false, `${width}: header overlap`);
        assert.deepEqual(layout.textOverflow, [], `${theme} ${width} ${route}: text overflow`);
        assert.match(layout.font, /Manrope/);
        assert.equal(layout.language, "en");
        assert.ok(layout.canonical, `${route}: canonical`);
        report.cases.push({ theme, width, route, ...layout });
        if (route === "/" || (theme === "option3-light" && width === 1440) || (theme === "option3-dark" && width === 390 && route === "/contact")) {
          const name = route === "/" ? "home" : route.slice(1);
          await page.screenshot({ path: fileURLToPath(new URL(`${name}-${theme}-${width}.png`, directory)), fullPage: true });
        }
      }
    }
    const tokens = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      const names = ["background", "background-secondary", "surface", "surface-muted", "text", "text-muted", "accent-text", "error", "accent", "accent-strong", "accent-contrast"];
      return Object.fromEntries(names.map((name) => [name, style.getPropertyValue(`--color-${name}`).trim()]));
    });
    for (const foreground of ["text", "text-muted", "accent-text", "error"]) {
      for (const background of ["background", "background-secondary", "surface", "surface-muted"]) {
        const ratio = contrast(tokens[foreground], tokens[background]);
        assert.ok(ratio >= 4.5, `${theme}: ${foreground} on ${background}: ${ratio}`);
        report.contrast.push({ theme, foreground, background, ratio: +ratio.toFixed(2) });
      }
    }
    for (const background of ["accent", "accent-strong"]) {
      assert.ok(contrast(tokens["accent-contrast"], tokens[background]) >= 4.5, `${theme}: button contrast`);
    }
    await context.close();
    console.log(`Validated ${theme} across six routes at desktop and mobile sizes.`);
  }

  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, colorScheme: "light" });
  await page.goto(baseURL);
  await page.evaluate(() => localStorage.setItem("wideorder-theme", "light"));
  await page.reload();
  for (const appearance of appearances) {
    const expected = appearance.id;
    await page.getByRole("button", { name: /^Appearance:/ }).click();
    await page.getByRole("menuitemradio", { name: appearance.name }).click();
    assert.equal(await page.locator("html").getAttribute("data-theme"), expected);
    await page.reload();
    assert.equal(await page.locator("html").getAttribute("data-theme"), expected);
  }
  report.interactions.push("Four-theme appearance selection and reload persistence");
  await page.goto(baseURL);
  assert.equal(await page.locator(".hero__title").innerText(), "There is a better way.");
  assert.match(await page.getByRole("link", { name: "Discuss a Challenge" }).getAttribute("href"), /^mailto:/);
  await page.getByRole("link", { name: /Explore Our Work/ }).click();
  await page.waitForURL("**/our-work");
  await page.locator(".summary-card").first().click();
  await page.waitForURL("**/our-work/retail-pricing");
  report.interactions.push("Hero email/work CTAs and case-study landing-page navigation");
  await page.setViewportSize({ width: 390, height: 844 });
  const menu = page.getByRole("button", { name: "Open navigation menu" });
  await menu.click();
  assert.equal(await page.getByRole("button", { name: "Close navigation menu" }).getAttribute("aria-expanded"), "true");
  await page.keyboard.press("Escape");
  assert.equal(await menu.getAttribute("aria-expanded"), "false");
  await page.waitForFunction(() => document.activeElement === document.querySelector(".mobile-navigation__toggle"));
  await menu.click();
  await page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "Contact", exact: true }).click();
  await page.waitForURL("**/contact");
  assert.equal(await page.locator(".mobile-navigation__toggle").getAttribute("aria-expanded"), "false");
  assert.equal(await page.locator(".contact-form").count(), 1);
  assert.equal(await page.getByLabel("Name", { exact: true }).getAttribute("required"), "");
  report.interactions.push("Mobile menu open, Escape, focus return and route navigation; contact fields retained");
  for (const width of [320, 768, 960, 1024, 1139, 1140, 1280]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ["/", "/our-work", "/contact"]) {
      await page.goto(`${baseURL}${route}`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width} ${route} boundary overflow`);
    }
  }
  report.interactions.push("21 additional responsive boundary checks from 320px through 1280px");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(baseURL);
  await page.locator(".site-footer").scrollIntoViewIfNeeded();
  assert.equal(await page.evaluate(() => document.getAnimations().filter((animation) => animation.playState === "running").length), 0);
  report.interactions.push("Reduced motion: no running animations after scrolling");
  await page.close();
  const noJS = await browser.newContext({ javaScriptEnabled: false, colorScheme: "dark" });
  const fallback = await noJS.newPage();
  await fallback.goto(baseURL);
  assert.equal(await fallback.locator(".hero__title").isVisible(), true);
  assert.equal(await fallback.locator(".summary-card").count(), 4);
  assert.equal(await fallback.locator(".hero__actions a").count(), 2);
  await noJS.close();
  report.interactions.push("JavaScript disabled: headline, case studies, CTAs and system-theme CSS available");
  assert.deepEqual(report.pageErrors, []);
  await writeFile(new URL("audit-report.json", directory), JSON.stringify(report, null, 2) + "\n");
  console.log(`Passed ${report.cases.length} route/theme/viewport cases, ${report.contrast.length} text contrast pairs, and ${report.interactions.length} interaction groups.`);
} finally {
  await browser.close();
}
