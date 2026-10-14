import type { Metadata } from "next";

import { OurApproachPage } from "@/components/site-pages";
import { buildPageMetadata } from "@/config/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Our Approach",
  description:
    "Explore the inSITU methodology, existing-environment assessment, and the principles behind WideOrder Resolve.",
  path: "/our-approach",
});

export default function OurApproach() {
  return <OurApproachPage />;
}
