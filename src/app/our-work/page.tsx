import type { Metadata } from "next";

import { OurWorkPage } from "@/components/site-pages";
import { buildPageMetadata } from "@/config/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Our Work",
  description: "Real engagements and case-specific outcomes, with client identities protected. Explore four operational case studies.",
  path: "/our-work",
});

export default function OurWork() {
  return <OurWorkPage />;
}
