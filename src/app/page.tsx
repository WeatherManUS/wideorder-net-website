import type { Metadata } from "next";

import { HomePage } from "@/components/homepage";
import { buildPageMetadata, siteConfig } from "@/config/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Cross-functional operational problem-solving",
  description: siteConfig.description,
  path: "/",
});

export default function Home() {
  return <HomePage />;
}
