import type { Metadata } from "next";

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
    },
  };
}

