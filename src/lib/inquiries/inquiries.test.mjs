import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
const dir = mkdtempSync(path.join(tmpdir(), "wideorder-inquiry-test-"));
process.env.NODE_ENV = "test";
process.env.WIDEORDER_LOCAL_CONFIG_DB_PATH = path.join(dir, "settings.sqlite");
process.env.WIDEORDER_CONFIG_ENCRYPTION_KEY = randomUUID();
const { getManagedConfigStore } = await import("../managed-config/storage.ts");
const { updateManagedSettings, getAdminSettingViews, getSmtpConfig } = await import("../managed-config/service.ts");
const { submitInquiry } = await import("./submit.ts");
const { deliverInquiry, retryInquiry, drainInquiryQueue } = await import("./queue.ts");
const { inquiryById, takeRequestSlot } = await import("./store.ts");
const { decryptSecretValue } = await import("../managed-config/crypto.ts");
const { validateSmtpConfig, publicIPv4 } = await import("../smtp/config.ts");
const { smtpFailure } = await import("../smtp/transport.ts");
const config = { host: "smtp.hostinger.com", port: 465, secure: true, auth: true, username: "fixture@example.test", password: "SENSITIVE_FIXTURE_PASSWORD", from: "site@example.test", fromName: "WideOrder", recipient: "inbox@example.test", acknowledgment: true };
const payload = () => ({ name: "Fixture <script>", email: "visitor@example.test", company: "", phone: "", message: "PRIVATE_INQUIRY_MARKER", website: "", turnstileToken: "fixture", requestKey: randomUUID(), sourcePage: "/contact", analyticsConsent: true, campaign: { utm_source: "review", utm_medium: "qa", utm_campaign: "release_check", email: "private@example.test" } });
const deps = { security: async () => ({ siteKey: "fixture", secretKey: "fixture" }), smtp: async () => config, verify: async () => true, deliver: async () => {} };
const store = await getManagedConfigStore();
// SQLite stays open for the process; Windows permits cleanup after process exit only.
after(() => { assert.ok(path.resolve(dir).startsWith(path.resolve(tmpdir()) + path.sep)); try { rmSync(dir, { recursive: true }); } catch {} });

test("settings defaults, atomic validation, encrypted credentials and blank retention", async () => {
  const defaults = await getSmtpConfig();
  assert.equal(defaults.host, "smtp.hostinger.com"); assert.equal(defaults.port, 465); assert.equal(defaults.auth, true); assert.equal(defaults.from, ""); assert.equal(validateSmtpConfig(defaults, false), false);
  await updateManagedSettings({ SMTP_USER: config.username, SMTP_PASSWORD: config.password, SMTP_FROM_EMAIL: config.from, SMTP_RECIPIENT: config.recipient }, "fixture-admin");
  const views = await getAdminSettingViews();
  for (const key of ["SMTP_USER", "SMTP_PASSWORD"]) { const v = views.find(v => v.key === key); assert.equal(v.value, null); assert.equal(v.configured, true); }
  const stored = await store.listSettings(); assert.ok(!JSON.stringify(stored).includes(config.password)); assert.ok(!JSON.stringify(stored).includes(config.username));
  await updateManagedSettings({ SMTP_PASSWORD: "" }, "fixture-admin"); assert.equal((await getSmtpConfig()).password, config.password);
  await assert.rejects(updateManagedSettings({ SMTP_FROM_NAME: "MUST_NOT_SAVE", SMTP_HOST: "127.0.0.1" }, "fixture-admin"));
  assert.equal((await getSmtpConfig()).fromName, "WideOrder");
});
test("validation, honeypot and rejected challenge never persist an inquiry", async () => {
  const before = (await store.execute("SELECT id FROM wideorder_inquiries")).rows.length;
  assert.equal((await submitInquiry({}, "validation", deps)).status, 400);
  assert.deepEqual((await submitInquiry({ ...payload(), website: "spam" }, "honeypot", deps)).body, { ok: true });
  assert.equal((await submitInquiry(payload(), "challenge", { ...deps, verify: async () => false })).status, 400);
  assert.equal((await store.execute("SELECT id FROM wideorder_inquiries")).rows.length, before);
});
test("durable unconfigured receipt, encrypted content, consent filtering and idempotency", async () => {
  const body = payload();
  const result = await submitInquiry(body, "capture", { ...deps, smtp: async () => ({ ...config, username: "", password: "" }) });
  assert.equal(result.status, 202); assert.equal(result.body.delivery, "queued");
  const row = await inquiryById(result.body.reference); assert.ok(!row.payload.includes(body.message));
  const loader = new URL("../../../scripts/test-register.mjs", import.meta.url).href;
  const storeUrl = new URL("./store.ts", import.meta.url).href;
  const child = execFileSync(process.execPath, ["--experimental-transform-types", "--import", loader, "--input-type=module", "-e", `import { inquiryById } from ${JSON.stringify(storeUrl)}; const row = await inquiryById(${JSON.stringify(row.id)}); if (row?.status !== 'pending') process.exit(1); console.log('durable');`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  assert.match(child, /durable/);
  const inquiry = JSON.parse(decryptSecretValue(row.payload)); assert.equal(inquiry.contact.message, body.message); assert.equal(inquiry.campaign.utm_campaign, "release_check"); assert.equal(inquiry.campaign.email, undefined);
  assert.equal((await submitInquiry(body, "capture", { ...deps, verify: async () => false })).status, 400);
  const again = await submitInquiry(body, "capture", deps);
  assert.equal(again.body.reference, result.body.reference);
  assert.equal((await submitInquiry({ ...body, message: "different" }, "capture", deps)).status, 409);
  const rejectedConsent = await submitInquiry({ ...payload(), analyticsConsent: false }, "no-consent", deps);
  assert.deepEqual(JSON.parse(decryptSecretValue((await inquiryById(rejectedConsent.body.reference)).payload)).campaign, {});
});
test("queue lease prevents concurrent sends; acceptance precedes acknowledgment", async () => {
  const result = await submitInquiry(payload(), "queue", deps); const id = result.body.reference; const sent = [];
  const transport = { sendMail: async options => { sent.push(options); await new Promise(r => setTimeout(r, 25)); return { accepted: options.envelope.to }; }, close() {} };
  const dependencies = { getConfig: async () => config, createTransport: async () => transport };
  await Promise.all([deliverInquiry(id, dependencies), deliverInquiry(id, dependencies)]);
  assert.equal(sent.length, 1); assert.equal(sent[0].replyTo.address, "visitor@example.test"); assert.ok(sent[0].html.includes("&lt;script&gt;"));
  const row = await inquiryById(id); assert.ok(row.accepted_at); assert.equal(row.stage, "ack");
  await deliverInquiry(id, { ...dependencies, createTransport: async () => ({ sendMail: async () => { throw { responseCode: 451 }; }, close() {} }) });
  assert.equal((await inquiryById(id)).stage, "ack"); assert.ok((await inquiryById(id)).accepted_at);
  await store.execute("UPDATE wideorder_inquiries SET next_attempt_at = ? WHERE id = ?", [new Date(0).toISOString(), id]);
  await deliverInquiry(id, dependencies); assert.equal(sent.length, 2); assert.equal(sent[1].envelope.to[0], "visitor@example.test"); assert.equal((await inquiryById(id)).status, "done");
  await deliverInquiry(id, dependencies); assert.equal(sent.length, 2);
});
test("temporary rejection retries, ambiguous DATA is quarantined, acknowledgments can be disabled", async () => {
  const result = await submitInquiry(payload(), "retry", deps); const id = result.body.reference;
  await deliverInquiry(id, { getConfig: async () => config, createTransport: async () => ({ sendMail: async () => { throw { responseCode: 451 }; }, close() {} }) });
  let row = await inquiryById(id); assert.equal(row.status, "pending"); assert.ok(row.next_attempt_at > row.created_at);
  await store.execute("UPDATE wideorder_inquiries SET next_attempt_at = ? WHERE id = ?", [new Date(0).toISOString(), id]);
  await deliverInquiry(id, { getConfig: async () => config, createTransport: async () => ({ sendMail: async () => { throw { code: "ETIMEDOUT", command: "DATA" }; }, close() {} }) });
  row = await inquiryById(id); assert.equal(row.status, "review"); assert.equal(row.last_error, "delivery_uncertain"); assert.equal(await retryInquiry(id), 0);
  const fresh = await submitInquiry(payload(), "no-ack", deps);
  await deliverInquiry(fresh.body.reference, { getConfig: async () => ({ ...config, acknowledgment: false }), createTransport: async () => ({ sendMail: async o => ({ accepted: o.envelope.to }), close() {} }) });
  assert.equal((await inquiryById(fresh.body.reference)).status, "done");
});
test("storage failure never claims receipt and rate limiting persists", async () => {
  const secret = process.env.WIDEORDER_CONFIG_ENCRYPTION_KEY; delete process.env.WIDEORDER_CONFIG_ENCRYPTION_KEY;
  assert.equal((await submitInquiry(payload(), "failure", deps)).status, 503); process.env.WIDEORDER_CONFIG_ENCRYPTION_KEY = secret;
  for (let i = 0; i < 5; i++) assert.equal(await takeRequestSlot("persistent-limit"), true);
  assert.equal(await takeRequestSlot("persistent-limit"), false);
});
test("SMTP blocks SSRF targets, insecure ports and header injection", () => {
  for (const host of ["localhost", "127.0.0.1", "169.254.169.254", "smtp.hostinger.com.evil.test", "https://smtp.hostinger.com"]) assert.throws(() => validateSmtpConfig({ ...config, host }));
  for (const ip of ["127.0.0.1", "10.0.0.1", "169.254.169.254", "172.16.1.1", "192.168.1.1", "100.64.0.1", "::1", "224.0.0.1"]) assert.equal(publicIPv4(ip), false);
  assert.equal(publicIPv4("8.8.8.8"), true);
  assert.throws(() => validateSmtpConfig({ ...config, port: 25, secure: false }));
  assert.throws(() => validateSmtpConfig({ ...config, from: "safe@example.test,evil@example.test" }));
  assert.throws(() => validateSmtpConfig({ ...config, fromName: "WideOrder\r\nBcc: evil@example.test" }));
  assert.equal(validateSmtpConfig({ ...config, port: 587, secure: false }), true);
  assert.deepEqual(smtpFailure({ command: "CONN", code: "ECONNECTION" }), { code: "connection_failed", retry: true });
});

test("a crashed worker lease is quarantined rather than causing duplicate delivery", async () => {
  const result = await submitInquiry(payload(), "crash", deps);
  await store.execute("UPDATE wideorder_inquiries SET status = 'processing', lease_token = 'old-worker', lease_until = ? WHERE id = ?", [new Date(0).toISOString(), result.body.reference]);
  await drainInquiryQueue(async () => {});
  const row = await inquiryById(result.body.reference);
  assert.equal(row.status, "review"); assert.equal(row.last_error, "delivery_uncertain");
});
