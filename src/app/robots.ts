import type { MetadataRoute } from "next";

import { isSiteIndexable, siteConfig } from "@/config/site";
import { indexingRobots } from "@/config/indexing";

export default function robots(): MetadataRoute.Robots {
  return indexingRobots(isSiteIndexable, siteConfig.domain);
}
