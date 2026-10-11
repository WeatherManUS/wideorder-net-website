import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";

import { type ContactSubmission } from "./contact.ts";

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  recipient: string;
};

export type MailDeliveryRole = "internal" | "visitor_copy";

type CorrelationRole = "internal" | "visitor-copy";

type SmtpSendResult = {
  accepted?: unknown[];
  rejected?: unknown[];
  pending?: unknown[];
  messageId?: string;
  response?: string;
  envelopeTime?: number;
  messageTime?: number;
  messageSize?: number;
};

export type SmtpDeliveryMetadata = {
  requestId: string;
  deliveryRole: MailDeliveryRole;
  provider: "hostinger_smtp";
  providerMessageId: string | null;
  acceptedCount: number;
  rejectedCount: number;
  pendingCount: number;
  smtpResponse: string | null;
  envelopeTime: number | null;
  messageTime: number | null;
  messageSize: number | null;
};

export type ContactMailLogger = {
  info: (message: string, metadata: Record<string, unknown>) => void;
  error: (message: string, metadata: Record<string, unknown>) => void;
};

export type ContactMailResult = {
  internalDelivery: SmtpDeliveryMetadata;
  visitorCopyDelivery: SmtpDeliveryMetadata | null;
};

export const CONTACT_SUBJECT = "WideOrder website inquiry";
export const VISITOR_COPY_SUBJECT = "Your WideOrder enquiry";

const DEFAULT_LOGGER: ContactMailLogger = {
  info: (message, metadata) => console.info(message, metadata),
  error: (message, metadata) => console.error(message, metadata),
};

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

function getCollectionCount(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

function getConfiguredSenderIdentity(smtp: SmtpConfig) {
  return `WideOrder Website <${smtp.user}>`;
}

function sanitizeMailText(value: unknown) {
  return typeof value === "string" ? value.replace(EMAIL_PATTERN, "[redacted-email]") : null;
}

export function getSanitizedMailErrorMetadata(error: unknown) {
  const candidate = typeof error === "object" && error ? (error as Record<string, unknown>) : {};

  return {
    errorName: typeof candidate.name === "string" ? candidate.name : "unknown",
    errorCode:
      typeof candidate.code === "string" || typeof candidate.code === "number" ? String(candidate.code) : null,
    responseCode: typeof candidate.responseCode === "number" ? candidate.responseCode : null,
    smtpResponse: sanitizeMailText(candidate.response),
  };
}

export function createSmtpTransport(smtp: SmtpConfig) {
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.password,
    },
  });
}

export function buildCorrelationHeaders(requestId: string, role: CorrelationRole) {
  return {
    "X-WideOrder-Request-Id": requestId,
    "X-WideOrder-Delivery-Role": role,
  } satisfies NonNullable<Mail.Options["headers"]>;
}

export function buildInternalMailOptions({
  smtp,
  submission,
  requestId,
}: {
  smtp: SmtpConfig;
  submission: ContactSubmission;
  requestId: string;
}) {
  return {
    from: getConfiguredSenderIdentity(smtp),
    to: smtp.recipient,
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
  } satisfies Mail.Options;
}

export function buildVisitorCopyMailOptions({
  smtp,
  submission,
  requestId,
}: {
  smtp: SmtpConfig;
  submission: ContactSubmission;
  requestId: string;
}) {
  return {
    from: getConfiguredSenderIdentity(smtp),
    to: submission.email,
    replyTo: smtp.recipient,
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
  } satisfies Mail.Options;
}

export function getSmtpDeliveryMetadata({
  requestId,
  deliveryRole,
  smtpResult,
}: {
  requestId: string;
  deliveryRole: MailDeliveryRole;
  smtpResult: SmtpSendResult;
}) {
  return {
    requestId,
    deliveryRole,
    provider: "hostinger_smtp",
    providerMessageId: smtpResult.messageId ?? null,
    acceptedCount: getCollectionCount(smtpResult.accepted),
    rejectedCount: getCollectionCount(smtpResult.rejected),
    pendingCount: getCollectionCount(smtpResult.pending),
    smtpResponse: sanitizeMailText(smtpResult.response),
    envelopeTime: typeof smtpResult.envelopeTime === "number" ? smtpResult.envelopeTime : null,
    messageTime: typeof smtpResult.messageTime === "number" ? smtpResult.messageTime : null,
    messageSize: typeof smtpResult.messageSize === "number" ? smtpResult.messageSize : null,
  } satisfies SmtpDeliveryMetadata;
}

export function isAcceptedSmtpDelivery(delivery: SmtpDeliveryMetadata) {
  return delivery.acceptedCount > 0;
}

export async function sendContactMails({
  smtp,
  submission,
  requestId,
  transporter = createSmtpTransport(smtp),
  logger = DEFAULT_LOGGER,
}: {
  smtp: SmtpConfig;
  submission: ContactSubmission;
  requestId: string;
  transporter?: Pick<ReturnType<typeof createSmtpTransport>, "sendMail">;
  logger?: ContactMailLogger;
}) {
  const internalResult = await transporter.sendMail(buildInternalMailOptions({ smtp, submission, requestId }));
  const internalDelivery = getSmtpDeliveryMetadata({
    requestId,
    deliveryRole: "internal",
    smtpResult: internalResult,
  });

  if (!isAcceptedSmtpDelivery(internalDelivery)) {
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
    const visitorCopyResult = await transporter.sendMail(buildVisitorCopyMailOptions({ smtp, submission, requestId }));
    const visitorCopyDelivery = getSmtpDeliveryMetadata({
      requestId,
      deliveryRole: "visitor_copy",
      smtpResult: visitorCopyResult,
    });

    if (!isAcceptedSmtpDelivery(visitorCopyDelivery)) {
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
      provider: "hostinger_smtp",
      ...getSanitizedMailErrorMetadata(error),
    });

    return {
      internalDelivery,
      visitorCopyDelivery: null,
    } satisfies ContactMailResult;
  }
}