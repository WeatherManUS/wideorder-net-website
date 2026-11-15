import type { Metadata } from "next";

import { WhatWeDoPage } from "@/components/site-pages";
import { buildPageMetadata } from "@/config/site";

export const metadata: Metadata = buildPageMetadata({
  title: "What We Do",
  description: "Resolve recurring work, disconnected systems, stalled implementations and operational tasks without clear ownership.",
  path: "/what-we-do",
});

export default function WhatWeDo() {
  return <WhatWeDoPage />;
}
