export const siteConfig = {
  name: "WideOrder",
  serviceName: "WideOrder Resolve",
  domain: "https://wideorder.net",
  repositoryPath: "C:/GitHub/wideorder-net-website",
  phase: "Phase 6 production hardening",
  title: "WideOrder Resolve | Stop losing time to busy work.",
  description:
    "WideOrder Resolve looks at the work consuming your team's time, understands why it happens, and finds a practical way to make it better.",
  openGraph: {
    title: "WideOrder Resolve | Stop losing time to busy work.",
    description:
      "WideOrder Resolve looks at the work consuming your team's time, understands why it happens, and finds a practical way to make it better.",
    url: "https://wideorder.net",
    siteName: "WideOrder",
  },
  contact: {
    endpoint: "/api/contact",
    publicMailbox: "hello@wideorder.net",
  },
} as const;

export const isSiteIndexable = process.env.SITE_INDEXABLE === "true";
