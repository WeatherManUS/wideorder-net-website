export const siteConfig = {
  name: "WideOrder",
  serviceName: "WideOrder",
  domain: "https://wideorder.net",
  repositoryPath: "C:/GitHub/wideorder-net-website",
  phase: "Phase 8 homepage simplification",
  title: "WideOrder | WideOrder fixes problems for businesses.",
  description:
    "WideOrder helps businesses define operational problems, find practical solutions, and get the right work delivered.",
  openGraph: {
    title: "WideOrder | WideOrder fixes problems for businesses.",
    description:
      "WideOrder helps businesses define operational problems, find practical solutions, and get the right work delivered.",
    url: "https://wideorder.net",
    siteName: "WideOrder",
  },
  contact: {
    endpoint: "/api/contact",
    publicMailbox: "info@wideorder.net",
  },
} as const;

export const isSiteIndexable = process.env.SITE_INDEXABLE === "true";

