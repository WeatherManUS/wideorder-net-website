import type { Metadata } from "next";

import { WhatWeDoPage } from "@/components/site-pages";
import { buildPageMetadata } from "@/config/site";

export const metadata: Metadata = buildPageMetadata({
  title: "What We Do",
  description:
    "See the kinds of business problems WideOrder addresses, how delivery can happen, and where practical value is created.",
  path: "/what-we-do",
});

export default function WhatWeDo() {
  return <WhatWeDoPage />;
}
