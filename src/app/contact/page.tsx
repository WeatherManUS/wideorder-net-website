import type { Metadata } from "next";

import { ContactPage } from "@/components/site-pages";
import { buildPageMetadata } from "@/config/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Contact",
  description:
    "Contact WideOrder by email and start with a short description of the problem, stalled work, or recurring operational burden.",
  path: "/contact",
});

export default function Contact() {
  return <ContactPage />;
}
