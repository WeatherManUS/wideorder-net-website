const CANONICAL_PRODUCTION_ORIGIN = "https://wideorder.net";
const PRODUCTION_ALLOWED_HOSTS = new Set(["wideorder.net", "www.wideorder.net"]);
const LOCAL_ALLOWED_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

type ParsedOrigin = {
  origin: string;
  protocol: string;
  hostname: string;
};

function normalizeHostname(hostname: string) {
  return hostname.trim().toLowerCase().replace(/\.$/, "");
}

function parseOrigin(value: string) {
  try {
    const url = new URL(value);

    return {
      origin: url.origin,
      protocol: url.protocol,
      hostname: normalizeHostname(url.hostname),
    } satisfies ParsedOrigin;
  } catch {
    return null;
  }
}

function getOriginFromHostHeader(hostHeader: string | null, protocol: string) {
  const hostValue = hostHeader?.split(",")[0]?.trim();

  if (!hostValue) {
    return null;
  }

  return parseOrigin(`${protocol}://${hostValue}`);
}

function getForwardedOrigin(headers: Headers) {
  const forwardedProto = headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();

  if (forwardedProto !== "http" && forwardedProto !== "https") {
    return null;
  }

  return getOriginFromHostHeader(headers.get("x-forwarded-host"), forwardedProto);
}

function getRequestOrigin(request: Request) {
  return parseOrigin(request.url);
}

function getHeaderOrigin(value: string | null) {
  if (!value) {
    return null;
  }

  return parseOrigin(value);
}

function isProductionOriginAllowed(origin: ParsedOrigin) {
  return origin.protocol === "https:" && PRODUCTION_ALLOWED_HOSTS.has(origin.hostname);
}

function isLocalDevelopmentOriginAllowed(origin: ParsedOrigin) {
  return ["http:", "https:"].includes(origin.protocol) && LOCAL_ALLOWED_HOSTS.has(origin.hostname);
}

function isDevelopmentRuntime() {
  return process.env.NODE_ENV !== "production";
}

export function resolveTrustedPublicOrigin(input: Request | Headers) {
  const headers = input instanceof Request ? input.headers : input;

  if (!isDevelopmentRuntime()) {
    const forwardedOrigin = getForwardedOrigin(headers);

    if (forwardedOrigin && isProductionOriginAllowed(forwardedOrigin)) {
      return CANONICAL_PRODUCTION_ORIGIN;
    }

    if (input instanceof Request) {
      const requestOrigin = getRequestOrigin(input);

      if (requestOrigin && isProductionOriginAllowed(requestOrigin)) {
        return CANONICAL_PRODUCTION_ORIGIN;
      }
    }

    return CANONICAL_PRODUCTION_ORIGIN;
  }

  const forwardedOrigin = getForwardedOrigin(headers);

  if (forwardedOrigin && (isLocalDevelopmentOriginAllowed(forwardedOrigin) || isProductionOriginAllowed(forwardedOrigin))) {
    return forwardedOrigin.origin;
  }

  const hostOrigin = getOriginFromHostHeader(headers.get("host"), headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase() || "http");

  if (hostOrigin && (isLocalDevelopmentOriginAllowed(hostOrigin) || isProductionOriginAllowed(hostOrigin))) {
    return hostOrigin.origin;
  }

  if (input instanceof Request) {
    const requestOrigin = getRequestOrigin(input);

    if (requestOrigin && (isLocalDevelopmentOriginAllowed(requestOrigin) || isProductionOriginAllowed(requestOrigin))) {
      return requestOrigin.origin;
    }
  }

  return "http://localhost:3000";
}

export function isTrustedBrowserOrigin(value: string) {
  const parsedOrigin = getHeaderOrigin(value);

  if (!parsedOrigin) {
    return false;
  }

  if (!isDevelopmentRuntime()) {
    return isProductionOriginAllowed(parsedOrigin);
  }

  return isLocalDevelopmentOriginAllowed(parsedOrigin) || isProductionOriginAllowed(parsedOrigin);
}

export function isTrustedBrowserReferer(value: string) {
  const parsedOrigin = getHeaderOrigin(value);

  return parsedOrigin ? isTrustedBrowserOrigin(parsedOrigin.origin) : false;
}

export function buildTrustedPublicUrl(input: Request | Headers, path: string) {
  return new URL(path, resolveTrustedPublicOrigin(input));
}
