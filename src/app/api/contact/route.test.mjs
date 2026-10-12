import assert from "node:assert/strict";
import test from "node:test";

import { processContactRequest } from "../../../lib/contact-request.ts";

function createConfigStatus({
  turnstileSiteKey = "site-key",
  turnstileSecretKey = "secret-key",
  resendApiKey = "re_test_key",
  transactionalFromEmail = "website@wideorder.net",
  recipientEmail = "info@wideorder.net",
} = {}) {
  return {
    config: {
      transactional: {
        apiKey: resendApiKey,
        fromEmail: transactionalFromEmail,
        recipient: recipientEmail,
      },
      turnstileSiteKey,
      turnstileSecretKey,
    },
    hasRequiredValues: Boolean(turnstileSiteKey && turnstileSecretKey && resendApiKey && transactionalFromEmail && recipientEmail),
  };
}

function createLogger() {
  return {
    info() {},
    warn() {},
    error() {},
  };
}

test("case F: honeypot returns success and performs no provider or turnstile calls", async () => {
  let verifyCalls = 0;
  const result = await processContactRequest({
    body: {
      name: "Taylor Example",
      email: "visitor@example.test",
      message: "Hello",
      company: "",
      phone: "",
      website: "spam-bot",
      turnstileToken: "token",
    },
    contentType: "application/json",
    requestId: "request-123",
    clientIp: "127.0.0.1",
    getConfigStatus: async () => createConfigStatus(),
    verifyTurnstile: async () => {
      verifyCalls += 1;
      return { success: true };
    },
    logger: createLogger(),
  });

  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { ok: true });
  assert.equal(verifyCalls, 0);
});

test("case G: turnstile failure returns validation-style error and performs no delivery", async () => {
  let verifyCalls = 0;
  const result = await processContactRequest({
    body: {
      name: "Taylor Example",
      email: "visitor@example.test",
      message: "Hello",
      company: "",
      phone: "",
      website: "",
      turnstileToken: "bad-token",
    },
    contentType: "application/json",
    requestId: "request-123",
    clientIp: "127.0.0.1",
    getConfigStatus: async () => createConfigStatus(),
    verifyTurnstile: async () => {
      verifyCalls += 1;
      return { success: false, "error-codes": ["invalid-input-response"] };
    },
    logger: createLogger(),
  });

  assert.equal(result.status, 400);
  assert.equal(result.body.ok, false);
  assert.equal(result.body.error, "security_verification_failed");
  assert.equal(verifyCalls, 1);
});

test("case H: validation failure returns without turnstile or provider calls", async () => {
  let verifyCalls = 0;
  const result = await processContactRequest({
    body: {
      name: "",
      email: "not-an-email",
      message: "",
      company: "",
      phone: "",
      website: "",
      turnstileToken: "token",
    },
    contentType: "application/json",
    requestId: "request-123",
    clientIp: "127.0.0.1",
    getConfigStatus: async () => createConfigStatus(),
    verifyTurnstile: async () => {
      verifyCalls += 1;
      return { success: true };
    },
    logger: createLogger(),
  });

  assert.equal(result.status, 400);
  assert.equal(result.body.ok, false);
  assert.equal(result.body.error, "validation_error");
  assert.equal(verifyCalls, 0);
});

test("case I: missing Resend configuration returns service_unavailable", async () => {
  let verifyCalls = 0;
  const result = await processContactRequest({
    body: {
      name: "Taylor Example",
      email: "visitor@example.test",
      message: "Hello",
      company: "",
      phone: "",
      website: "",
      turnstileToken: "token",
    },
    contentType: "application/json",
    requestId: "request-123",
    clientIp: "127.0.0.1",
    getConfigStatus: async () => createConfigStatus({ resendApiKey: "" }),
    verifyTurnstile: async () => {
      verifyCalls += 1;
      return { success: true };
    },
    logger: createLogger(),
  });

  assert.equal(result.status, 503);
  assert.deepEqual(result.body, { ok: false, error: "service_unavailable" });
  assert.equal(verifyCalls, 0);
});
