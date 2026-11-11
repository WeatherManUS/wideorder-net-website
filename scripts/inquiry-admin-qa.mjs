import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || "playwright");
const base = "http://localhost:3105";
const { password } = JSON.parse(readFileSync(new URL("../.release/inquiry-qa-credentials.json", import.meta.url)));
const browser = await chromium.launch();
const context = await browser.newContext();
await context.route('https://challenges.cloudflare.com/turnstile/v0/api.js*', route => route.fulfill({ contentType: 'application/javascript', body: `let cb;window.turnstile={render:(el,o)=>{cb=o.callback;queueMicrotask(()=>{window.__qaToken='fixture-'+crypto.randomUUID();cb(window.__qaToken)});return 'fixture-widget'},reset:()=>queueMicrotask(()=>{window.__qaToken='fixture-'+crypto.randomUUID();cb(window.__qaToken)}),remove:()=>{}};` }));
const page = await context.newPage();
const errors = []; page.on("pageerror", e => errors.push(e.message));
const post = (path, form, headers = {}) => context.request.post(base + path, { form, headers: { Origin: base, ...headers }, maxRedirects: 0 });
try {
  const denied = await post("/api/admin/smtp", { action: "test_connection" }); assert.equal(denied.status(), 401);
  await page.goto(base + "/admin/settings"); assert.ok(page.url().includes("/admin/login"));
  const csrf = await post("/api/admin/smtp", { action: "test_connection" }, { Origin: "https://evil.example" }); assert.equal(csrf.status(), 403);
  const login = await post("/api/admin/login", { password }); assert.equal(login.status(), 303); assert.ok(login.headers()["location"].endsWith("/admin/settings"));
  const cookie = login.headers()["set-cookie"]; assert.match(cookie, /HttpOnly/i); assert.match(cookie, /SameSite=strict/i);
  await page.goto(base + "/admin/settings"); await page.getByRole("heading", { name: "Email / SMTP", exact: true }).waitFor();
  assert.equal(await page.locator('[name="SMTP_HOST"]').inputValue(), "smtp.hostinger.com");
  assert.equal(await page.locator('[name="SMTP_PORT"]').inputValue(), "465");
  for (const key of ["SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM_EMAIL", "SMTP_RECIPIENT"]) assert.equal(await page.locator(`[name="${key}"]`).inputValue(), "");
  await page.locator('[name="SMTP_USER"]').fill("TEST_USERNAME_MARKER");
  await page.locator('[name="SMTP_PASSWORD"]').fill("TEST_PASSWORD_MARKER");
  await page.getByRole("button", { name: /^Save settings/ }).click();
  await page.waitForURL(/status=saved/);
  assert.equal(await page.locator('[name="SMTP_USER"]').inputValue(), ""); assert.equal(await page.locator('[name="SMTP_PASSWORD"]').inputValue(), "");
  const html = await page.content(); assert.ok(!html.includes("TEST_PASSWORD_MARKER")); assert.ok(!html.includes("TEST_USERNAME_MARKER"));
  for (const action of ["test_connection", "send_test"]) { const r = await post("/api/admin/smtp", { action }); assert.ok(r.headers()["location"].includes("smtp_not_configured")); }
  const blocked = await post("/api/admin/settings", { SMTP_HOST: "127.0.0.1" }); assert.ok(blocked.headers()["location"].includes("invalid_setting"));
  const invalid = await context.request.post(base + "/api/contact", { data: {}, headers: { Origin: base } }); assert.equal(invalid.status(), 400);
  await page.goto(base + "/contact");
  await page.getByLabel("Name", { exact: true }).fill("Browser QA inquiry");
  await page.getByLabel("Email", { exact: true }).fill("qa@example.test");
  await page.getByLabel("Business challenge", { exact: true }).fill("Isolated local durability test; no email delivery configured.");
  await page.waitForFunction(() => !!window.__qaToken);
  const requestPromise = page.waitForRequest(request => request.url().endsWith('/api/contact') && request.method() === 'POST');
  await page.getByRole("button", { name: /^Send enquiry/ }).click();
  const submitted = (await requestPromise).postDataJSON();
  await page.getByText(/Inquiry received. Reference:/).waitFor();
  assert.match(await page.locator('.form-status').innerText(), /notification is pending/);
  const replay = await context.request.post(base + '/api/contact', { data: submitted, headers: { Origin: base } });
  assert.equal(replay.status(), 400);
  assert.equal((await replay.json()).error, 'security_verification_failed');
  await page.goto(base + "/admin/settings");
  await page.getByRole('heading', { name: 'Mail delivery diagnostics' }).waitFor();
  assert.match(await page.locator('.admin-summary').allTextContents().then(v => v.join(' ')), /Customer acknowledgments\s*Disabled/);
  assert.match(await page.locator('.admin-summary').allTextContents().then(v => v.join(' ')), /smtp_not_configured/);
  const inquiry = page.locator('a[href^="/admin/inquiries/"]').first(); await inquiry.click();
  await page.getByText("Isolated local durability test; no email delivery configured.", { exact: true }).waitFor();
  const ref = page.url();
  await post("/api/admin/logout", {});
  await page.goto(ref); assert.ok(page.url().includes("/admin/login"));
  // Simulated transport outage must retain visitor-entered information.
  await page.route('**/api/contact', route => route.fulfill({ status: 503, json: { ok: false, error: "service_unavailable" } }));
  await page.goto(base + "/contact"); await page.getByLabel("Name", { exact: true }).fill("Keep this name"); await page.getByLabel("Email", { exact: true }).fill("keep@example.test"); await page.getByLabel("Business challenge", { exact: true }).fill("Keep this message");
  await page.waitForFunction(() => !!window.__qaToken);
  await page.getByRole("button", { name: /^Send enquiry/ }).click(); await page.locator('.form-status[data-state="error"]').waitFor();
  assert.equal(await page.getByLabel("Business challenge", { exact: true }).inputValue(), "Keep this message");
  for (const theme of ["light", "dark", "option3-light", "option3-dark"]) {
    await page.evaluate(t => localStorage.setItem("wideorder-theme", t), theme);
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 1000 }); await page.goto(base + "/contact");
      assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }
  }
  await page.goto(base); const primary = page.getByRole("link", { name: /^Discuss a Challenge/ }).first(); assert.equal(await primary.getAttribute('href'), '/contact#inquiry-form');
  for (let i = 0; i < 6; i++) {
    const r = await post("/api/admin/login", { password: "incorrect-fixture-password" }, { "X-Forwarded-For": "198.51.100.200" });
    if (i === 5) assert.ok(r.headers()["location"].includes("throttled"));
  }
  assert.deepEqual(errors, []);
  console.log('PASS: administrator login/logout, unauthorized access, CSRF, SMTP settings save/masking, unconfigured tests, SSRF validation, local durable form capture with isolated verifier fixture, replay rejection and persisted diagnostics, protected inquiry detail, retained fields on failure, eight theme/viewport checks, native CTA. No email sent.');
} finally { await browser.close(); }
