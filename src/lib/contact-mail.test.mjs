import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCorrelationHeaders,
  buildInternalMailOptions,
  buildVisitorCopyMailOptions,
  getSmtpDeliveryMetadata,
  isAcceptedSmtpDelivery,
  sendContactMails,
} from "./contact-mail.ts";

const smtp = {
  host: "smtp.example.test",
  port: 465,
  secure: true,
  user: "info@example.test",
  password: "not-used-in-tests",
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

function createResult({ accepted = [], rejected = [], pending = [], messageId = "provider-message-id", response = "250 2.0.0 Ok" } = {}) {
  return {
    accepted,
    rejected,
    pending,
    envelope: {
      from: "info@example.test",
      to: [],
    },
    messageId,
    response,
    envelopeTime: 10,
    messageTime: 20,
    messageSize: 30,
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

  const internalMail = buildInternalMailOptions({ smtp, submission, requestId: "request-123" });
  assert.equal(internalMail.from, "WideOrder Website <info@example.test>");
  assert.equal(internalMail.to, "contact@example.test");
  assert.equal(internalMail.replyTo, "visitor@example.test");

  const visitorCopyMail = buildVisitorCopyMailOptions({ smtp, submission, requestId: "request-123" });
  assert.equal(visitorCopyMail.from, "WideOrder Website <info@example.test>");
  assert.equal(visitorCopyMail.to, "visitor@example.test");
  assert.equal(visitorCopyMail.replyTo, "contact@example.test");
});

test("metadata extraction captures accepted, rejected, and pending counts safely", () => {
  const metadata = getSmtpDeliveryMetadata({
    requestId: "request-123",
    deliveryRole: "internal",
    smtpResult: createResult({ accepted: ["ok"], rejected: ["nope"], pending: ["later"] }),
  });

  assert.equal(metadata.requestId, "request-123");
  assert.equal(metadata.deliveryRole, "internal");
  assert.equal(metadata.provider, "hostinger_smtp");
  assert.equal(metadata.acceptedCount, 1);
  assert.equal(metadata.rejectedCount, 1);
  assert.equal(metadata.pendingCount, 1);
  assert.equal(isAcceptedSmtpDelivery(metadata), true);
});

test("case A: accepted internal and accepted visitor copy return success metadata", async () => {
  const sendMailCalls = [];
  const transporter = {
    async sendMail(options) {
      sendMailCalls.push(options);
      return createResult({ accepted: ["ok"] });
    },
  };
  const { entries, logger } = createLogger();

  const result = await sendContactMails({ smtp, submission, requestId: "request-123", transporter, logger });

  assert.equal(result.internalDelivery.acceptedCount, 1);
  assert.equal(result.visitorCopyDelivery?.acceptedCount, 1);
  assert.equal(sendMailCalls.length, 2);
  assert.equal(entries.filter((entry) => entry.level === "info").length, 2);
});

test("case B: unaccepted internal delivery returns failure metadata and skips visitor copy", async () => {
  const sendMailCalls = [];
  const transporter = {
    async sendMail(options) {
      sendMailCalls.push(options);
      return createResult({ accepted: [], rejected: ["rejected"] });
    },
  };
  const { entries, logger } = createLogger();

  const result = await sendContactMails({ smtp, submission, requestId: "request-123", transporter, logger });

  assert.equal(result.internalDelivery.acceptedCount, 0);
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

  await assert.rejects(sendContactMails({ smtp, submission, requestId: "request-123", transporter }), /smtp unavailable/);
  assert.equal(sendMailCalls, 1);
});

test("case D: visitor copy unaccepted still returns success and logs failure", async () => {
  const results = [createResult({ accepted: ["ok"] }), createResult({ accepted: [], rejected: ["rejected"] })];
  const transporter = {
    async sendMail() {
      return results.shift() ?? createResult({ accepted: [] });
    },
  };
  const { entries, logger } = createLogger();

  const result = await sendContactMails({ smtp, submission, requestId: "request-123", transporter, logger });

  assert.equal(result.internalDelivery.acceptedCount, 1);
  assert.equal(result.visitorCopyDelivery?.acceptedCount, 0);
  assert.equal(entries.some((entry) => entry.message === "[contact] visitor_copy_unaccepted"), true);
});

test("case E: visitor copy throw still returns success and logs failure", async () => {
  let callCount = 0;
  const transporter = {
    async sendMail() {
      callCount += 1;

      if (callCount === 1) {
        return createResult({ accepted: ["ok"] });
      }

      throw new Error("mailbox busy");
    },
  };
  const { entries, logger } = createLogger();

  const result = await sendContactMails({ smtp, submission, requestId: "request-123", transporter, logger });

  assert.equal(result.internalDelivery.acceptedCount, 1);
  assert.equal(result.visitorCopyDelivery, null);
  assert.equal(entries.some((entry) => entry.message === "[contact] visitor_copy_failed"), true);
});