import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { siteContent } from "@/content/home";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/what-we-do", "/how-we-work", "/our-work", "/our-approach", "/contact", "/privacy", ...siteContent.ourWork.stories.map((story) => `/our-work/${story.id}`)];

  return pages.map((path) => ({
    url: `${siteConfig.domain}${path}`,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.8,
  }));
}
