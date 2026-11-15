import type { Metadata } from "next";

import { ContactPage } from "@/components/site-pages";
import { buildPageMetadata } from "@/config/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Contact",
  description: "Tell WideOrder what is getting in the way. Start with a short inquiry; any subsequent paid Discovery is agreed separately.",
  path: "/contact",
});

export default function Contact() {
  return <ContactPage />;
}
