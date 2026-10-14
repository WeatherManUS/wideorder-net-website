import type { Metadata } from "next";

import { OurWorkPage } from "@/components/site-pages";
import { buildPageMetadata } from "@/config/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Our Work",
  description:
    "Review WideOrder case studies covering retail pricing, technology deployment, remote infrastructure, and month-end reporting.",
  path: "/our-work",
});

export default function OurWork() {
  return <OurWorkPage />;
}
