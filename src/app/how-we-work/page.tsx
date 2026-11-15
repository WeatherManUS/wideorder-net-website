import type { Metadata } from "next";

import { HowWeWorkPage } from "@/components/site-pages";
import { buildPageMetadata } from "@/config/site";

export const metadata: Metadata = buildPageMetadata({
  title: "How We Work",
  description: "Start with a conversation, then paid Discovery where appropriate. Agree practical options and the right engagement without a predetermined solution.",
  path: "/how-we-work",
});

export default function HowWeWork() {
  return <HowWeWorkPage />;
}
