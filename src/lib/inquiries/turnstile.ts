const productionHosts = new Set(["wideorder.net", "www.wideorder.net"]);

export async function verifyContactTurnstile(token: string, secret: string, request = fetch) {
  if (!token || token.length > 2048 || !secret) return false;
  try {
    const response = await request("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    if (!response.ok) return false;
    const result: unknown = await response.json();
    if (!result || typeof result !== "object") return false;
    const value = result as Record<string, unknown>;
    const local = process.env.NODE_ENV !== "production" &&
      (value.hostname === "localhost" || value.hostname === "127.0.0.1");
    return value.success === true && value.action === "contact" &&
      typeof value.hostname === "string" && (productionHosts.has(value.hostname) || local);
  } catch {
    return false;
  }
}
