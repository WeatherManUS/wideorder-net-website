import type { Metadata } from "next";

import { HowWeWorkPage } from "@/components/site-pages";
import { buildPageMetadata } from "@/config/site";

export const metadata: Metadata = buildPageMetadata({
  title: "How We Work",
  description:
    "Understand WideOrder's Discovery-led process, commercial decision-making, and engagement models from diagnosis through delivery.",
  path: "/how-we-work",
});

export default function HowWeWork() {
  return <HowWeWorkPage />;
}
