import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCorrelationHeaders,
  buildInternalMailOptions,
  buildVisitorCopyMailOptions,
  getTransactionalDeliveryMetadata,
  isAcceptedTransactionalDelivery,
  sendContactMails,
} from "./contact-mail.ts";

const transactional = {
  apiKey: "re_test_key",
  fromEmail: "website@example.test",
  recipient: "contact@example.test",
};

const submission = {
  name: "Taylor Example",
  company: "WideOrder",
  email: "visitor@example.test",
  phone: "555-0100",
  message: "Marker: integration check",
  website: "",
  turnstileToken: "token",
};

function createResult({ providerMessageId = "provider-message-id", providerStatus = "accepted" } = {}) {
  return {
    providerMessageId,
    providerStatus,
  };
}

function createLogger() {
  const entries = [];

  return {
    entries,
    logger: {
      info(message, metadata) {
        entries.push({ level: "info", message, metadata });
      },
      error(message, metadata) {
        entries.push({ level: "error", message, metadata });
      },
    },
  };
}

test("build helpers set correlation headers and safe mail identities", () => {
  assert.deepEqual(buildCorrelationHeaders("request-123", "internal"), {
    "X-WideOrder-Request-Id": "request-123",
    "X-WideOrder-Delivery-Role": "internal",
  });

  const internalMail = buildInternalMailOptions({ transactional, submission, requestId: "request-123" });
  assert.equal(internalMail.from, "WideOrder Website <website@example.test>");
  assert.equal(internalMail.to, "contact@example.test");
  assert.equal(internalMail.replyTo, "visitor@example.test");

  const visitorCopyMail = buildVisitorCopyMailOptions({ transactional, submission, requestId: "request-123" });
  assert.equal(visitorCopyMail.from, "WideOrder Website <website@example.test>");
  assert.equal(visitorCopyMail.to, "visitor@example.test");
  assert.equal(visitorCopyMail.replyTo, "contact@example.test");
});

test("metadata extraction captures provider-neutral acceptance safely", () => {
  const metadata = getTransactionalDeliveryMetadata({
    requestId: "request-123",
    deliveryRole: "internal",
    sendResult: createResult({ providerMessageId: "email_123", providerStatus: "accepted" }),
  });

  assert.equal(metadata.requestId, "request-123");
  assert.equal(metadata.deliveryRole, "internal");
  assert.equal(metadata.provider, "resend_api");
  assert.equal(metadata.providerMessageId, "email_123");
  assert.equal(metadata.providerStatus, "accepted");
  assert.equal(isAcceptedTransactionalDelivery(metadata), true);
});

test("case A: accepted internal and accepted visitor copy return success metadata", async () => {
  const sendMailCalls = [];
  const transporter = {
    async sendMail(options) {
      sendMailCalls.push(options);
      return createResult();
    },
  };
  const { entries, logger } = createLogger();

  const result = await sendContactMails({ transactional, submission, requestId: "request-123", transport: transporter, logger });

  assert.equal(result.internalDelivery.providerStatus, "accepted");
  assert.equal(result.visitorCopyDelivery?.providerStatus, "accepted");
  assert.equal(sendMailCalls.length, 2);
  assert.equal(entries.filter((entry) => entry.level === "info").length, 2);
});

test("case B: unaccepted internal delivery returns failure metadata and skips visitor copy", async () => {
  const sendMailCalls = [];
  const transporter = {
    async sendMail(options) {
      sendMailCalls.push(options);
      return createResult({ providerMessageId: null, providerStatus: "rejected" });
    },
  };
  const { entries, logger } = createLogger();

  const result = await sendContactMails({ transactional, submission, requestId: "request-123", transport: transporter, logger });

  assert.equal(result.internalDelivery.providerStatus, "rejected");
  assert.equal(result.visitorCopyDelivery, null);
  assert.equal(sendMailCalls.length, 1);
  assert.equal(entries.length, 0);
});

test("case C: internal SMTP throw bubbles and skips visitor copy", async () => {
  let sendMailCalls = 0;
  const transporter = {
    async sendMail() {
      sendMailCalls += 1;
      throw new Error("smtp unavailable");
    },
  };

  await assert.rejects(sendContactMails({ transactional, submission, requestId: "request-123", transport: transporter }), /smtp unavailable/);
  assert.equal(sendMailCalls, 1);
});

test("case D: visitor copy unaccepted still returns success and logs failure", async () => {
  const results = [createResult(), createResult({ providerMessageId: null, providerStatus: "rejected" })];
  const transporter = {
    async sendMail() {
      return results.shift() ?? createResult({ providerMessageId: null, providerStatus: "unaccepted" });
    },
  };
  const { entries, logger } = createLogger();

  const result = await sendContactMails({ transactional, submission, requestId: "request-123", transport: transporter, logger });

  assert.equal(result.internalDelivery.providerStatus, "accepted");
  assert.equal(result.visitorCopyDelivery?.providerStatus, "rejected");
  assert.equal(entries.some((entry) => entry.message === "[contact] visitor_copy_unaccepted"), true);
});

test("case E: visitor copy throw still returns success and logs failure", async () => {
  let callCount = 0;
  const transporter = {
    async sendMail() {
      callCount += 1;

      if (callCount === 1) {
        return createResult();
      }

      throw new Error("mailbox busy");
    },
  };
  const { entries, logger } = createLogger();

  const result = await sendContactMails({ transactional, submission, requestId: "request-123", transport: transporter, logger });

  assert.equal(result.internalDelivery.providerStatus, "accepted");
  assert.equal(result.visitorCopyDelivery, null);
  assert.equal(entries.some((entry) => entry.message === "[contact] visitor_copy_failed"), true);
});
