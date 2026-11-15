import type { Metadata } from "next";

import { OurApproachPage } from "@/components/site-pages";
import { buildPageMetadata } from "@/config/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Our Approach",
  description: "inSITU is a founding principle of WideOrder: understand the real environment, exercise commercial judgment and keep client information under client control by default.",
  path: "/our-approach",
});

export default function OurApproach() {
  return <OurApproachPage />;
}
