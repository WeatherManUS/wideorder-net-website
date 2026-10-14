import { NextResponse } from "next/server";

import { checkAndRecordContactAttempt } from "@/lib/contact-rate-limit";
import { processContactRequest, type TurnstileVerificationResponse } from "@/lib/contact-request";
import { getContactOperationalConfigStatus } from "@/lib/managed-config/service";

export const runtime = "nodejs";

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
  const clientIp = getClientIp(request);
  const rateLimit = checkAndRecordContactAttempt(clientIp);

  if (!rateLimit.allowed) {
    return json(
      {
        ok: false,
        error: "rate_limited",
        message: "Too many submissions were received from this connection. Please wait and try again.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_request" }, { status: 400 });
  }


  const result = await processContactRequest({
    body,
    contentType: request.headers.get("content-type"),
    requestId,
    clientIp,
    getConfigStatus: getContactOperationalConfigStatus,
    verifyTurnstile,
  });

  return json(result.body, { status: result.status });
}
