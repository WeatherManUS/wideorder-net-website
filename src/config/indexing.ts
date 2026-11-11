import type { MetadataRoute } from "next";

// An explicit launch flag is required; staging/development never inherit production approval.
export function indexingEnabled(env: Record<string, string | undefined>) {
  const environment = env.RELEASE_ENVIRONMENT || (env.NODE_ENV === "production" ? "production" : "development");
  return environment === "production" && env.NODE_ENV === "production" && env.SITE_INDEXABLE === "true";
}

export function indexingRobots(enabled: boolean, origin: string): MetadataRoute.Robots {
  return enabled
    ? { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/version.json"] }, sitemap: `${origin}/sitemap.xml` }
    : { rules: { userAgent: "*", disallow: "/" } };
}

export function indexingMetadata(enabled: boolean) {
  return { index: enabled, follow: enabled };
}
