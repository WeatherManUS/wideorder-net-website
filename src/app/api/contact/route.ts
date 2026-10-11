import { NextResponse } from "next/server";

import {
  CONTACT_ERROR_MESSAGE,
  CONTACT_SECURITY_MESSAGE,
  validateContactSubmission,
} from "@/lib/contact";

export const runtime = "nodejs";

type TurnstileVerificationResponse = {
  success: boolean;
  "error-codes"?: string[];
};

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const TURNSTILE_ENDPOINT = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const CONTACT_SUBJECT = "WideOrder website inquiry";

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

async function sendNotification({
  apiKey,
  recipient,
  from,
  name,
  company,
  email,
  phone,
  message,
}: {
  apiKey: string;
  recipient: string;
  from: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  message: string;
}) {
  return fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      subject: CONTACT_SUBJECT,
      reply_to: email,
      text: [
        CONTACT_SUBJECT,
        "",
        `Name: ${name}`,
        `Company: ${company || "Not provided"}`,
        `Email: ${email}`,
        `Phone: ${phone || "Not provided"}`,
        "",
        "Message:",
        message,
      ].join("\n"),
    }),
  });
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

  const resendApiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  const recipientEmail = process.env.CONTACT_RECIPIENT_EMAIL?.trim() ?? "";
  const fromEmail = process.env.CONTACT_FROM_EMAIL?.trim() ?? "";
  const turnstileSecretKey = process.env.TURNSTILE_SECRET_KEY?.trim() ?? "";

  if (!turnstileSecretKey || !resendApiKey || !recipientEmail || !fromEmail) {
    console.error("[contact] missing_configuration", {
      requestId,
      category: "service_unavailable",
      hasTurnstileSecret: Boolean(turnstileSecretKey),
      hasResendApiKey: Boolean(resendApiKey),
      hasRecipientEmail: Boolean(recipientEmail),
      hasFromEmail: Boolean(fromEmail),
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
      secretKey: turnstileSecretKey,
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
    const resendResponse = await sendNotification({
      apiKey: resendApiKey,
      recipient: recipientEmail,
      from: fromEmail,
      name: data.name,
      company: data.company,
      email: data.email,
      phone: data.phone,
      message: data.message,
    });

    if (!resendResponse.ok) {
      console.error("[contact] resend_delivery_failed", {
        requestId,
        category: "delivery_failed",
        status: resendResponse.status,
      });

      return json({ ok: false, error: "delivery_failed" }, { status: 502 });
    }

    const providerResult = (await resendResponse.json().catch(() => null)) as { id?: string } | null;

    console.info("[contact] submission_sent", {
      requestId,
      category: "success",
      providerMessageId: providerResult?.id ?? null,
    });

    return json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[contact] unexpected_error", {
      requestId,
      category: "delivery_failed",
      error: error instanceof Error ? error.message : CONTACT_ERROR_MESSAGE,
    });

    return json({ ok: false, error: "delivery_failed" }, { status: 500 });
  }
}
