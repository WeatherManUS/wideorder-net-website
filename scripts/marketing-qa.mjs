import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || "playwright");
const sharp = require("sharp");
const base = process.env.QA_BASE_URL || "http://localhost:3102";
const output = new URL("../docs/qa/marketing/", import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const report = { metadata: [], layouts: [], interactions: [], requests: {}, pageErrors: [] };
const vendors = /googletagmanager\.com|licdn\.com|connect\.facebook\.net|ads-twitter\.com/;
const configured = { enabled: true, ga4: "G-TEST1234", gtm: "", linkedin: "1234567", meta: "123456789012345", googleAds: "AW-123456789", googleAdsLabel: "test_label", x: "test123", xLeadEvent: "tw-test123-lead123", linkedinLeadConversion: "123456" };
const leadID = "10000000-0000-4000-8000-000000000001";

async function scenario(name, config = configured, signal = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  const requests = [];
  await context.addInitScript((signals) => {
    if (signals.gpc) Object.defineProperty(navigator, "globalPrivacyControl", { value: true });
    if (signals.dnt) Object.defineProperty(navigator, "doNotTrack", { value: "1" });
  }, signal);
  await context.route("**/api/marketing-config", (route) => route.fulfill({ json: config }));
  await context.route("**/api/contact-config", (route) => route.fulfill({ json: { turnstileSiteKey: "" } }));
  // Never load a real third-party SDK or transmit test events.
  await context.route(vendors, (route) => { requests.push(route.request().url()); return route.fulfill({ contentType: "application/javascript", body: "/* offline SDK test fixture */" }); });
  const page = await context.newPage();
  page.on("pageerror", (error) => report.pageErrors.push(error.message));
  const goto = async (path = "/?utm_source=linkedin&utm_medium=organic_social&utm_campaign=process_improvement&utm_content=reporting_v1") => {
    await page.goto(`${base}${path}`); await page.getByRole("heading", { name: "Your tracking choices" }).waitFor();
  };
  report.requests[name] = requests;
  return { context, page, requests, goto };
}
const commands = (page) => page.evaluate(() => (window.dataLayer || []).map((item) => typeof item?.length === "number" ? Array.from(item) : item));
async function submitFixture(page, response = { ok: true, conversionId: leadID }) {
  await page.route("**/api/contact", (route) => route.fulfill({ json: response }));
  await page.getByLabel("Name", { exact: true }).fill("PII_MARKER_NAME");
  await page.getByLabel("Email", { exact: true }).fill("pii_marker@example.test");
  await page.getByLabel("Business challenge", { exact: true }).fill("PII_MARKER_MESSAGE");
  await page.getByRole("button", { name: /^Send enquiry/ }).click();
  await page.getByText("Thank you. Your message has been sent.", { exact: true }).waitFor();
}

try {
  const initial = await scenario("analytics");
  const { page, requests } = initial;
  await initial.goto();
  assert.deepEqual(requests, []);
  assert.equal(await page.locator("main").evaluate((element) => element.inert), true);
  await page.keyboard.press("Shift+Tab");
  assert.match(await page.evaluate(() => document.activeElement.textContent), /Close without changing choices/);
  assert.equal(await page.evaluate(() => sessionStorage.getItem("wideorder-attribution-v1")), null);
  await page.screenshot({ path: fileURLToPath(new URL("consent-desktop.png", output)) });
  await page.getByRole("button", { name: "Reject optional", exact: true }).click();
  assert.equal(await page.locator("main").evaluate((element) => element.inert), false);
  assert.deepEqual(requests, []);
  await page.getByRole("button", { name: "Tracking preferences", exact: true }).click();
  await page.getByRole("checkbox", { name: /^Analytics/ }).check();
  await page.getByRole("button", { name: "Save choices", exact: true }).click();
  await page.waitForFunction(() => document.querySelector("#wideorder-google"));
  assert.equal(requests.length, 1);
  assert.ok(requests[0].includes("G-TEST1234"));
  assert.equal((await commands(page)).filter((command) => command[0] === "event" && command[1] === "page_view").length, 1);
  const googleConfig = (await commands(page)).find((command) => command[0] === "config" && command[1] === "G-TEST1234");
  assert.equal(googleConfig[2].campaign_name, "process_improvement");
  const firstView = (await commands(page)).find((command) => command[0] === "event" && command[1] === "page_view");
  assert.equal(firstView[2].campaign_name, "process_improvement");
  assert.equal(firstView[2].campaign_id, undefined);
  let attribution = await page.evaluate(() => JSON.parse(sessionStorage.getItem("wideorder-attribution-v1")));
  assert.equal(attribution.first.utm_source, "linkedin");
  report.interactions.push("No optional requests/storage before consent or after rejection; analytics-only loads only GA4, with one manual initial page view");

  await page.goto(`${base}/contact?utm_source=instagram&utm_medium=organic_social&utm_campaign=process_improvement&utm_content=reporting_v2`);
  await page.waitForFunction(() => document.querySelector("#wideorder-google"));
  attribution = await page.evaluate(() => JSON.parse(sessionStorage.getItem("wideorder-attribution-v1")));
  assert.equal(attribution.first.utm_source, "linkedin"); assert.equal(attribution.last.utm_source, "instagram");
  await submitFixture(page);
  await submitFixture(page);
  let data = await commands(page);
  const leads = data.filter((command) => command[0] === "event" && command[1] === "generate_lead");
  assert.equal(leads.length, 1);
  assert.equal(leads[0][2].first_source, "linkedin"); assert.equal(leads[0][2].last_source, "instagram");
  assert.equal(leads[0][2].lead_id, leadID);
  assert.ok(!JSON.stringify(data).includes("PII_MARKER")); assert.ok(!JSON.stringify(data).includes("pii_marker@example.test"));
  await submitFixture(page, { ok: true });
  data = await commands(page);
  assert.equal(data.filter((command) => command[0] === "event" && command[1] === "generate_lead").length, 1);
  report.interactions.push("First/last campaign attribution survives navigation; accepted inquiry produces one opaque-ID conversion; duplicate response and honeypot-style success do not add conversions; no form values enter SDK queues");
  const secondTab = await initial.context.newPage();
  await secondTab.goto(base);
  await secondTab.waitForFunction(() => document.querySelector("#wideorder-google"));
  await page.evaluate(() => { document.cookie = "_ga_test=fixture; path=/"; });
  const beforeWithdrawal = requests.length;
  await page.getByRole("button", { name: "Tracking preferences", exact: true }).click();
  await Promise.all([page.waitForNavigation(), secondTab.waitForNavigation(), page.getByRole("button", { name: "Reject optional", exact: true }).click()]);
  await page.waitForLoadState("networkidle");
  await secondTab.waitForLoadState("networkidle");
  assert.equal(requests.length, beforeWithdrawal);
  assert.equal(await page.evaluate(() => sessionStorage.getItem("wideorder-attribution-v1")), null);
  assert.equal(await page.evaluate(() => document.cookie.includes("_ga_test")), false);
  report.interactions.push("Withdrawal reloads both tabs, clears attribution/accessibly scoped vendor cookies, and prevents further optional SDK loads");
  await initial.context.close();

  for (const signal of [{ gpc: true }, { dnt: true }]) {
    const run = await scenario(signal.gpc ? "gpc" : "dnt", configured, signal);
    await run.goto();
    await run.page.getByRole("button", { name: "Accept optional", exact: true }).click();
    await run.page.waitForTimeout(150);
    assert.equal(run.requests.some((url) => /licdn|facebook|ads-twitter|AW-/.test(url)), false);
    if (signal.dnt) assert.deepEqual(run.requests, []);
    else assert.equal(run.requests.length, 1);
    await run.context.close();
  }
  report.interactions.push("GPC blocks advertising despite acceptance; DNT blocks both categories");

  const ads = await scenario("advertising_only");
  await ads.goto("/contact");
  await ads.page.getByRole("checkbox", { name: /^Advertising/ }).check();
  await ads.page.getByRole("button", { name: "Save choices", exact: true }).click();
  await ads.page.waitForFunction(() => document.querySelector("#wideorder-x"));
  assert.equal(ads.requests.length, 4);
  assert.ok(!ads.requests.some((url) => url.includes("G-TEST1234")));
  assert.equal(await ads.page.evaluate(() => sessionStorage.getItem("wideorder-attribution-v1")), null);
  await submitFixture(ads.page);
  await submitFixture(ads.page);
  const adEvents = await ads.page.evaluate(() => ({ google: (window.dataLayer || []).map((entry) => Array.from(entry)), meta: window.fbq.queue, linkedin: window.lintrk.q, x: window.twq.queue }));
  assert.equal(adEvents.google.filter((command) => command[0] === "event" && command[1] === "conversion").length, 1);
  assert.equal(adEvents.meta.filter((command) => command[2] === "Lead").length, 1);
  assert.equal(adEvents.linkedin.filter((command) => command[0] === "track").length, 1);
  assert.equal(adEvents.x.filter((command) => command[0] === "event").length, 1);
  assert.ok(!JSON.stringify(adEvents).includes("PII_MARKER"));
  await ads.context.close();
  report.interactions.push("Advertising-only loads the four configured provider SDKs, stores no session attribution, and deduplicates lead commands across Google Ads, Meta, LinkedIn and X");

  const container = await scenario("gtm", { ...configured, gtm: "GTM-TEST1234" });
  await container.goto();
  await container.page.getByRole("checkbox", { name: /^Analytics/ }).check();
  await container.page.getByRole("button", { name: "Save choices", exact: true }).click();
  assert.deepEqual(container.requests, []);
  await container.page.getByRole("button", { name: "Tracking preferences", exact: true }).click();
  await container.page.getByRole("button", { name: "Accept optional", exact: true }).click();
  await container.page.waitForFunction(() => document.querySelector("#wideorder-gtm"));
  assert.equal(container.requests.length, 1); assert.ok(container.requests[0].includes("gtm.js"));
  await container.context.close();
  report.interactions.push("GTM requires both categories and suppresses every direct-provider transport");

  const unsafe = await scenario("unsafe_query");
  await unsafe.goto("/contact?email=private@example.test");
  await unsafe.page.getByRole("button", { name: "Accept optional", exact: true }).click();
  await unsafe.page.waitForTimeout(150);
  assert.deepEqual(unsafe.requests, []);
  await unsafe.context.close();
  report.interactions.push("A personal/unknown query key prevents optional tags from loading");

  for (const fixture of [{ scheme: "light", expected: "option3-light" }, { scheme: "dark", expected: "option3-dark" }, { scheme: "dark", stored: "light", expected: "light" }]) {
    const context = await browser.newContext({ colorScheme: fixture.scheme });
    if (fixture.stored) await context.addInitScript((value) => localStorage.setItem("wideorder-theme", value), fixture.stored);
    const page = await context.newPage();
    await page.goto(base);
    await page.waitForFunction((value) => document.documentElement.dataset.theme === value, fixture.expected);
    await context.close();
  }
  const noJS = await browser.newContext({ javaScriptEnabled: false, colorScheme: "dark" });
  const fallback = await noJS.newPage();
  await fallback.goto(base);
  assert.equal(await fallback.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--color-background").trim()), "#17141F");
  await noJS.close();
  report.interactions.push("First-visit master palette follows system mode; saved Option 1 preference stays authoritative; no-JavaScript dark fallback uses the approved master dark palette");

  const metadata = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  metadata.on("pageerror", (error) => report.pageErrors.push(error.message));
  const routes = ["/", "/what-we-do", "/how-we-work", "/our-work", "/our-approach", "/contact", "/privacy", ...["retail-pricing", "technology-deployment", "remote-infrastructure-printing", "month-end-reporting"].map((id) => `/our-work/${id}`)];
  const titles = new Set();
  for (const route of routes) {
    const response = await metadata.goto(`${base}${route}`);
    assert.equal(response.status(), 200);
    const values = await metadata.evaluate(() => ({
      title: document.title, canonical: document.querySelector('link[rel="canonical"]')?.href,
      image: document.querySelector('meta[property="og:image"]')?.content,
      alt: document.querySelector('meta[property="og:image:alt"]')?.content,
      width: document.querySelector('meta[property="og:image:width"]')?.content,
      height: document.querySelector('meta[property="og:image:height"]')?.content,
      card: document.querySelector('meta[name="twitter:card"]')?.content,
      schemas: [...document.querySelectorAll('script[type="application/ld+json"]')].map((node) => JSON.parse(node.textContent)),
      overflow: document.documentElement.scrollWidth > innerWidth,
    }));
    assert.equal(values.canonical, `https://wideorder.net${route === "/" ? "/" : route}`);
    assert.equal(values.card, "summary_large_image"); assert.ok(values.alt); assert.equal(values.width, "1200"); assert.equal(values.height, "630");
    assert.equal(values.overflow, false);
    assert.equal(titles.has(values.title), false); titles.add(values.title);
    assert.ok(values.schemas.some((schema) => schema["@type"] === "Organization"));
    if (route.startsWith("/our-work/")) { assert.ok(values.image.endsWith(`${route.split("/").pop()}.png`)); assert.ok(values.schemas.some((schema) => schema["@type"] === "Article")); }
    const imageResponse = await metadata.request.get(`${base}${new URL(values.image).pathname}`);
    assert.equal(imageResponse.status(), 200);
    const dimensions = await sharp(await imageResponse.body()).metadata();
    assert.equal(dimensions.width, 1200); assert.equal(dimensions.height, 630);
    report.metadata.push({ route, title: values.title, image: values.image, canonical: values.canonical });
  }
  for (const theme of ["light", "dark", "option3-light", "option3-dark"]) {
    await metadata.evaluate((value) => localStorage.setItem("wideorder-theme", value), theme);
    for (const width of [390, 1440]) {
      await metadata.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      for (const route of routes.filter((path) => path === "/privacy" || path.startsWith("/our-work/"))) {
        await metadata.goto(`${base}${route}`);
        await metadata.evaluate(() => document.fonts.ready);
        assert.equal(await metadata.locator("html").getAttribute("data-theme"), theme);
        assert.equal(await metadata.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${theme} ${width} ${route}`);
        assert.equal(await metadata.locator("main h1").count(), 1);
        report.layouts.push({ theme, width, route, overflow: false });
      }
    }
  }
  await metadata.setViewportSize({ width: 390, height: 844 });
  await metadata.getByRole("button", { name: "Tracking preferences", exact: true }).click();
  await metadata.screenshot({ path: fileURLToPath(new URL("preferences-mobile.png", output)) });
  await metadata.keyboard.press("Escape");
  await metadata.goto(`${base}/our-work/month-end-reporting`);
  await metadata.screenshot({ path: fileURLToPath(new URL("case-study-mobile.png", output)), fullPage: true });
  await metadata.close();
  assert.deepEqual(report.pageErrors, []);
  await writeFile(new URL("marketing-audit.json", output), JSON.stringify(report, null, 2) + "\n");
  console.log(`Passed ${report.interactions.length} consent/tracking scenario groups, ${report.layouts.length} new-page theme/viewport checks, and social metadata/image checks for ${report.metadata.length} routes. All vendor requests and submissions were intercepted locally.`);
} finally { await browser.close(); }
