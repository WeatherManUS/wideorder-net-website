import type { Metadata } from "next";
import { getSocialProfiles } from "./marketing";

export const socialImage = (path: string) => {
  const name = path === "/" ? "home" : path.split("/").filter(Boolean).pop()!;
  const known = ["home", "what-we-do", "how-we-work", "our-work", "our-approach", "contact", "retail-pricing", "technology-deployment", "remote-infrastructure-printing", "month-end-reporting"];
  return `/social/${known.includes(name) ? name : "home"}.png`;
};

export const siteConfig = {
  name: "WideOrder",
  serviceName: "WideOrder Resolve",
  domain: "https://wideorder.net",
  repositoryPath: "C:/GitHub/wideorder-net-website",
  phase: "Phase 9 multi-page redesign",
  title: "WideOrder | WideOrder solves problems for businesses.",
  description:
    "WideOrder helps businesses investigate problems, determine practical solutions, and get the right work delivered.",
  openGraph: {
    title: "WideOrder | WideOrder solves problems for businesses.",
    description:
      "WideOrder helps businesses investigate problems, determine practical solutions, and get the right work delivered.",
    url: "https://wideorder.net",
    siteName: "WideOrder",
  },
  contact: {
    endpoint: "/api/contact",
    publicMailbox: "info@wideorder.net",
  },
} as const;

export const isSiteIndexable = process.env.SITE_INDEXABLE === "true";

export function getContactMailtoHref(subject = "WideOrder enquiry") {
  const params = new URLSearchParams({ subject });

  return `mailto:${siteConfig.contact.publicMailbox}?${params.toString()}`;
}

export function buildPageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: `/${string}` | "/";
}): Metadata {
  const absoluteUrl = path === "/" ? siteConfig.domain : `${siteConfig.domain}${path}`;

  return {
    title: `${title} | ${siteConfig.name}`,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "website",
      title: `${title} | ${siteConfig.name}`,
      description,
      url: absoluteUrl,
      siteName: siteConfig.openGraph.siteName,
      images: [{ url: socialImage(path), width: 1200, height: 630, alt: `${title} — WideOrder. There is a better way.` }],
    },
    twitter: { card: "summary_large_image", title: `${title} | ${siteConfig.name}`, description,
      images: [{ url: socialImage(path), alt: `${title} — WideOrder. There is a better way.` }] },
  };
}

export function organizationStructuredData() {
  const sameAs = getSocialProfiles().map((profile) => profile.url);
  return { "@context": "https://schema.org", "@type": "Organization", "@id": `${siteConfig.domain}/#organization`,
    name: siteConfig.name, url: siteConfig.domain, logo: `${siteConfig.domain}/brand/wideorder-logo-light.png`,
    description: siteConfig.description, email: siteConfig.contact.publicMailbox, ...(sameAs.length ? { sameAs } : {}) };
}

