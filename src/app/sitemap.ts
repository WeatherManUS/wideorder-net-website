import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/what-we-do", "/how-we-work", "/our-work", "/our-approach", "/contact"] as const;

  return pages.map((path) => ({
    url: `${siteConfig.domain}${path}`,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.8,
  }));
}
