import { Resend } from "resend";

import { type ContactSubmission } from "./contact.ts";

export type TransactionalMailConfig = {
  apiKey: string;
  fromEmail: string;
  recipient: string;
};

export type MailDeliveryRole = "internal" | "visitor_copy";

type CorrelationRole = "internal" | "visitor-copy";

export type TransactionalMailOptions = {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  headers: Record<string, string>;
  text: string;
};

type TransactionalSendResult = {
  providerMessageId: string | null;
  providerStatus: string;
};

export type TransactionalDeliveryMetadata = {
  requestId: string;
  deliveryRole: MailDeliveryRole;
  provider: "resend_api";
  providerMessageId: string | null;
  providerStatus: string;
};

export type ContactMailLogger = {
  info: (message: string, metadata: Record<string, unknown>) => void;
  error: (message: string, metadata: Record<string, unknown>) => void;
};

export type ContactMailResult = {
  internalDelivery: TransactionalDeliveryMetadata;
  visitorCopyDelivery: TransactionalDeliveryMetadata | null;
};

export const CONTACT_SUBJECT = "WideOrder website inquiry";
export const VISITOR_COPY_SUBJECT = "Your WideOrder enquiry";

const DEFAULT_LOGGER: ContactMailLogger = {
  info: (message, metadata) => console.info(message, metadata),
  error: (message, metadata) => console.error(message, metadata),
};

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

export type TransactionalMailTransport = {
  sendMail: (options: TransactionalMailOptions) => Promise<TransactionalSendResult>;
};

function getConfiguredSenderIdentity(transactional: TransactionalMailConfig) {
  return `WideOrder Website <${transactional.fromEmail}>`;
}

function sanitizeMailText(value: unknown) {
  return typeof value === "string" ? value.replace(EMAIL_PATTERN, "[redacted-email]") : null;
}

export function getSanitizedMailErrorMetadata(error: unknown) {
  const candidate = typeof error === "object" && error ? (error as Record<string, unknown>) : {};

  return {
    errorName: typeof candidate.name === "string" ? candidate.name : "unknown",
    errorCode:
      typeof candidate.code === "string" || typeof candidate.code === "number"
        ? String(candidate.code)
        : typeof candidate.name === "string"
          ? candidate.name
          : null,
    responseCode:
      typeof candidate.statusCode === "number"
        ? candidate.statusCode
        : typeof candidate.responseCode === "number"
          ? candidate.responseCode
          : null,
    providerStatus: typeof candidate.name === "string" ? candidate.name : "error",
    errorMessage: sanitizeMailText(candidate.message),
  };
}

export function createResendTransport(transactional: TransactionalMailConfig): TransactionalMailTransport {
  const resend = new Resend(transactional.apiKey);

  return {
    async sendMail(options) {
      const result = await resend.emails.send({
        from: options.from,
        to: options.to,
        replyTo: options.replyTo,
        subject: options.subject,
        text: options.text,
        headers: options.headers,
      });

      if (result.error) {
        throw Object.assign(new Error(result.error.message), {
          name: result.error.name,
          statusCode: result.error.statusCode,
          provider: "resend_api",
        });
      }

      return {
        providerMessageId: result.data?.id ?? null,
        providerStatus: result.data?.id ? "accepted" : "unaccepted",
      } satisfies TransactionalSendResult;
    },
  } satisfies TransactionalMailTransport;
}

export function buildCorrelationHeaders(requestId: string, role: CorrelationRole) {
  return {
    "X-WideOrder-Request-Id": requestId,
    "X-WideOrder-Delivery-Role": role,
  } satisfies Record<string, string>;
}

export function buildInternalMailOptions({
  transactional,
  submission,
  requestId,
}: {
  transactional: TransactionalMailConfig;
  submission: ContactSubmission;
  requestId: string;
}) {
  return {
    from: getConfiguredSenderIdentity(transactional),
    to: transactional.recipient,
    replyTo: submission.email,
    subject: CONTACT_SUBJECT,
    headers: buildCorrelationHeaders(requestId, "internal"),
    text: [
      CONTACT_SUBJECT,
      "",
      `Name: ${submission.name}`,
      `Company: ${submission.company || "Not provided"}`,
      `Email: ${submission.email}`,
      `Phone: ${submission.phone || "Not provided"}`,
      "",
      "Message:",
      submission.message,
    ].join("\n"),
  } satisfies TransactionalMailOptions;
}

export function buildVisitorCopyMailOptions({
  transactional,
  submission,
  requestId,
}: {
  transactional: TransactionalMailConfig;
  submission: ContactSubmission;
  requestId: string;
}) {
  return {
    from: getConfiguredSenderIdentity(transactional),
    to: submission.email,
    replyTo: transactional.recipient,
    subject: VISITOR_COPY_SUBJECT,
    headers: buildCorrelationHeaders(requestId, "visitor-copy"),
    text: [
      "Thank you for contacting WideOrder.",
      "",
      "We've received your message. A copy of your submission is below.",
      "",
      `Name: ${submission.name}`,
      `Company: ${submission.company || "Not provided"}`,
      `Email: ${submission.email}`,
      `Phone: ${submission.phone || "Not provided"}`,
      "",
      "Message:",
      submission.message,
      "",
      "WideOrder",
      "There is a better way.",
    ].join("\n"),
  } satisfies TransactionalMailOptions;
}

export function getTransactionalDeliveryMetadata({
  requestId,
  deliveryRole,
  sendResult,
}: {
  requestId: string;
  deliveryRole: MailDeliveryRole;
  sendResult: TransactionalSendResult;
}) {
  return {
    requestId,
    deliveryRole,
    provider: "resend_api",
    providerMessageId: sendResult.providerMessageId,
    providerStatus: sendResult.providerStatus,
  } satisfies TransactionalDeliveryMetadata;
}

export function isAcceptedTransactionalDelivery(delivery: TransactionalDeliveryMetadata) {
  return delivery.providerStatus === "accepted" && Boolean(delivery.providerMessageId);
}

export async function sendContactMails({
  transactional,
  submission,
  requestId,
  transport = createResendTransport(transactional),
  logger = DEFAULT_LOGGER,
}: {
  transactional: TransactionalMailConfig;
  submission: ContactSubmission;
  requestId: string;
  transport?: TransactionalMailTransport;
  logger?: ContactMailLogger;
}) {
  const internalResult = await transport.sendMail(buildInternalMailOptions({ transactional, submission, requestId }));
  const internalDelivery = getTransactionalDeliveryMetadata({
    requestId,
    deliveryRole: "internal",
    sendResult: internalResult,
  });

  if (!isAcceptedTransactionalDelivery(internalDelivery)) {
    return {
      internalDelivery,
      visitorCopyDelivery: null,
    } satisfies ContactMailResult;
  }

  logger.info("[contact] internal_submission_sent", {
    ...internalDelivery,
    category: "success",
  });

  try {
    const visitorCopyResult = await transport.sendMail(buildVisitorCopyMailOptions({ transactional, submission, requestId }));
    const visitorCopyDelivery = getTransactionalDeliveryMetadata({
      requestId,
      deliveryRole: "visitor_copy",
      sendResult: visitorCopyResult,
    });

    if (!isAcceptedTransactionalDelivery(visitorCopyDelivery)) {
      logger.error("[contact] visitor_copy_unaccepted", {
        ...visitorCopyDelivery,
        category: "visitor_copy_failed",
      });
    } else {
      logger.info("[contact] visitor_copy_sent", {
        ...visitorCopyDelivery,
        category: "success",
      });
    }

    return {
      internalDelivery,
      visitorCopyDelivery,
    } satisfies ContactMailResult;
  } catch (error) {
    logger.error("[contact] visitor_copy_failed", {
      requestId,
      deliveryRole: "visitor_copy",
      category: "visitor_copy_failed",
      provider: "resend_api",
      ...getSanitizedMailErrorMetadata(error),
    });

    return {
      internalDelivery,
      visitorCopyDelivery: null,
    } satisfies ContactMailResult;
  }
}
