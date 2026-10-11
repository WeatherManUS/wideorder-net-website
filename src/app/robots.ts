import type { MetadataRoute } from "next";

import { isSiteIndexable, siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  if (!isSiteIndexable) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteConfig.domain}/sitemap.xml`,
  };
}
