import { NextResponse } from "next/server";

import {
  CONTACT_ERROR_MESSAGE,
  CONTACT_SECURITY_MESSAGE,
  validateContactSubmission,
} from "@/lib/contact";
import {
  createSmtpTransport,
  getSanitizedMailErrorMetadata,
  isAcceptedSmtpDelivery,
  sendContactMails,
  type SmtpConfig,
} from "@/lib/contact-mail";
import { getContactOperationalConfigStatus } from "@/lib/managed-config/service";

export const runtime = "nodejs";

type TurnstileVerificationResponse = {
  success: boolean;
  "error-codes"?: string[];
};

const TURNSTILE_ENDPOINT = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const json = (body: Record<string, unknown>, init?: ResponseInit) => NextResponse.json(body, init);

const getClientIp = (request: Request) => {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "";
  }

  return request.headers.get("x-real-ip")?.trim() ?? "";
};

async function verifyTurnstile({ token, secretKey, remoteIp }: { token: string; secretKey: string; remoteIp: string }) {
  const response = await fetch(TURNSTILE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      secret: secretKey,
      response: token,
      ...(remoteIp ? { remoteip: remoteIp } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`turnstile_http_${response.status}`);
  }

  return (await response.json()) as TurnstileVerificationResponse;
}

export function GET() {
  return json({ ok: false, error: "method_not_allowed" }, { status: 405, headers: { Allow: "POST" } });
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const { data, fieldErrors } = validateContactSubmission(body);

  if (!data) {
    return json({ ok: false, error: "validation_error", fieldErrors }, { status: 400 });
  }

  if (data.website) {
    console.warn("[contact] honeypot_blocked", { requestId, outcome: "discarded" });
    return json({ ok: true }, { status: 200 });
  }

  let configStatus;

  try {
    configStatus = await getContactOperationalConfigStatus();
  } catch (error) {
    console.error("[contact] configuration_error", {
      requestId,
      category: "service_unavailable",
      error: error instanceof Error ? error.message : "unknown",
    });

    return json({ ok: false, error: "service_unavailable" }, { status: 503 });
  }

  if (!configStatus.hasRequiredValues || configStatus.config.smtp.port === null || configStatus.config.smtp.secure === null) {
    console.error("[contact] missing_configuration", {
      requestId,
      category: "service_unavailable",
      hasTurnstileSecret: Boolean(configStatus.config.turnstileSecretKey),
      hasTurnstileSiteKey: Boolean(configStatus.config.turnstileSiteKey),
      hasSmtpHost: Boolean(configStatus.config.smtp.host),
      hasSmtpPort: configStatus.config.smtp.port !== null,
      hasSmtpSecure: configStatus.config.smtp.secure !== null,
      hasSmtpUser: Boolean(configStatus.config.smtp.user),
      hasSmtpPassword: Boolean(configStatus.config.smtp.password),
      hasRecipientEmail: Boolean(configStatus.config.smtp.recipient),
    });

    return json({ ok: false, error: "service_unavailable" }, { status: 503 });
  }

  if (!data.turnstileToken) {
    return json(
      {
        ok: false,
        error: "security_verification_failed",
        fieldErrors: { turnstileToken: CONTACT_SECURITY_MESSAGE },
      },
      { status: 400 },
    );
  }

  try {
    const verification = await verifyTurnstile({
      token: data.turnstileToken,
      secretKey: configStatus.config.turnstileSecretKey,
      remoteIp: getClientIp(request),
    });

    if (!verification.success) {
      console.warn("[contact] turnstile_rejected", {
        requestId,
        category: "security_verification_failed",
        errorCodes: verification["error-codes"] ?? [],
      });

      return json(
        {
          ok: false,
          error: "security_verification_failed",
          fieldErrors: { turnstileToken: CONTACT_SECURITY_MESSAGE },
        },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("[contact] turnstile_error", {
      requestId,
      category: "security_verification_failed",
      error: error instanceof Error ? error.message : "unknown",
    });

    return json(
      {
        ok: false,
        error: "security_verification_failed",
        fieldErrors: { turnstileToken: CONTACT_SECURITY_MESSAGE },
      },
      { status: 400 },
    );
  }

  try {
    const smtpConfig: SmtpConfig = {
      host: configStatus.config.smtp.host,
      port: configStatus.config.smtp.port,
      secure: configStatus.config.smtp.secure,
      user: configStatus.config.smtp.user,
      password: configStatus.config.smtp.password,
      recipient: configStatus.config.smtp.recipient,
    };
    const transporter = createSmtpTransport(smtpConfig);
    const mailResult = await sendContactMails({
      smtp: smtpConfig,
      submission: data,
      requestId,
      transporter,
    });

    if (!isAcceptedSmtpDelivery(mailResult.internalDelivery)) {
      console.error("[contact] smtp_delivery_unaccepted", {
        ...mailResult.internalDelivery,
        category: "delivery_failed",
      });

      return json({ ok: false, error: "delivery_failed", message: CONTACT_ERROR_MESSAGE }, { status: 502 });
    }

    return json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[contact] smtp_delivery_failed", {
      requestId,
      category: "delivery_failed",
      provider: "hostinger_smtp",
      ...getSanitizedMailErrorMetadata(error),
    });

    return json({ ok: false, error: "delivery_failed", message: CONTACT_ERROR_MESSAGE }, { status: 502 });
  }
}