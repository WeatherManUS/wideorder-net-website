import {
  CONTACT_ERROR_MESSAGE,
  CONTACT_SECURITY_MESSAGE,
  validateContactSubmission,
} from "./contact.ts";
import {
  getSanitizedMailErrorMetadata,
  isAcceptedTransactionalDelivery,
  sendContactMails,
  type ContactMailLogger,
  type TransactionalMailConfig,
} from "./contact-mail.ts";
import type { ContactOperationalConfigStatus } from "./managed-config/service.ts";

export type TurnstileVerificationResponse = {
  success: boolean;
  "error-codes"?: string[];
};

type ContactResponsePayload = Record<string, unknown>;

type ContactWorkflowLogger = Pick<ContactMailLogger, "info" | "error"> & {
  warn: (message: string, metadata: Record<string, unknown>) => void;
};

type ProcessContactRequestResult = {
  status: number;
  body: ContactResponsePayload;
};

const DEFAULT_LOGGER: ContactWorkflowLogger = {
  info: (message, metadata) => console.info(message, metadata),
  warn: (message, metadata) => console.warn(message, metadata),
  error: (message, metadata) => console.error(message, metadata),
};

export async function processContactRequest({
  body,
  contentType,
  requestId,
  clientIp,
  getConfigStatus,
  verifyTurnstile,
  deliverMails = sendContactMails,
  logger = DEFAULT_LOGGER,
}: {
  body: unknown;
  contentType: string | null;
  requestId: string;
  clientIp: string;
  getConfigStatus: () => Promise<ContactOperationalConfigStatus>;
  verifyTurnstile: (input: { token: string; secretKey: string; remoteIp: string }) => Promise<TurnstileVerificationResponse>;
  deliverMails?: typeof sendContactMails;
  logger?: ContactWorkflowLogger;
}): Promise<ProcessContactRequestResult> {
  if (!contentType?.includes("application/json")) {
    return {
      status: 400,
      body: { ok: false, error: "invalid_request" },
    };
  }

  const { data, fieldErrors } = validateContactSubmission(body);

  if (!data) {
    return {
      status: 400,
      body: { ok: false, error: "validation_error", fieldErrors },
    };
  }

  if (data.website) {
    logger.warn("[contact] honeypot_blocked", { requestId, outcome: "discarded" });
    return {
      status: 200,
      body: { ok: true },
    };
  }

  let configStatus: ContactOperationalConfigStatus;

  try {
    configStatus = await getConfigStatus();
  } catch (error) {
    logger.error("[contact] configuration_error", {
      requestId,
      category: "service_unavailable",
      error: error instanceof Error ? error.message : "unknown",
    });

    return {
      status: 503,
      body: { ok: false, error: "service_unavailable" },
    };
  }

  if (!configStatus.hasRequiredValues) {
    logger.error("[contact] missing_configuration", {
      requestId,
      category: "service_unavailable",
      hasTurnstileSecret: Boolean(configStatus.config.turnstileSecretKey),
      hasTurnstileSiteKey: Boolean(configStatus.config.turnstileSiteKey),
      hasResendApiKey: Boolean(configStatus.config.transactional.apiKey),
      hasTransactionalFromEmail: Boolean(configStatus.config.transactional.fromEmail),
      hasRecipientEmail: Boolean(configStatus.config.transactional.recipient),
    });

    return {
      status: 503,
      body: { ok: false, error: "service_unavailable" },
    };
  }

  if (!data.turnstileToken) {
    return {
      status: 400,
      body: {
        ok: false,
        error: "security_verification_failed",
        fieldErrors: { turnstileToken: CONTACT_SECURITY_MESSAGE },
      },
    };
  }

  try {
    const verification = await verifyTurnstile({
      token: data.turnstileToken,
      secretKey: configStatus.config.turnstileSecretKey,
      remoteIp: clientIp,
    });

    if (!verification.success) {
      logger.warn("[contact] turnstile_rejected", {
        requestId,
        category: "security_verification_failed",
        errorCodes: verification["error-codes"] ?? [],
      });

      return {
        status: 400,
        body: {
          ok: false,
          error: "security_verification_failed",
          fieldErrors: { turnstileToken: CONTACT_SECURITY_MESSAGE },
        },
      };
    }
  } catch (error) {
    logger.error("[contact] turnstile_error", {
      requestId,
      category: "security_verification_failed",
      error: error instanceof Error ? error.message : "unknown",
    });

    return {
      status: 400,
      body: {
        ok: false,
        error: "security_verification_failed",
        fieldErrors: { turnstileToken: CONTACT_SECURITY_MESSAGE },
      },
    };
  }

  try {
    const transactionalConfig: TransactionalMailConfig = {
      apiKey: configStatus.config.transactional.apiKey,
      fromEmail: configStatus.config.transactional.fromEmail,
      recipient: configStatus.config.transactional.recipient,
    };

    const mailResult = await deliverMails({
      transactional: transactionalConfig,
      submission: data,
      requestId,
      logger,
    });

    if (!isAcceptedTransactionalDelivery(mailResult.internalDelivery)) {
      logger.error("[contact] transactional_delivery_unaccepted", {
        ...mailResult.internalDelivery,
        category: "delivery_failed",
      });

      return {
        status: 502,
        body: { ok: false, error: "delivery_failed", message: CONTACT_ERROR_MESSAGE },
      };
    }

    return {
      status: 200,
      body: { ok: true, conversionId: requestId },
    };
  } catch (error) {
    logger.error("[contact] transactional_delivery_failed", {
      requestId,
      category: "delivery_failed",
      provider: "resend_api",
      ...getSanitizedMailErrorMetadata(error),
    });

    return {
      status: 502,
      body: { ok: false, error: "delivery_failed", message: CONTACT_ERROR_MESSAGE },
    };
  }
}
