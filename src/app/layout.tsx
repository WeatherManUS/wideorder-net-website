import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";

import { isSiteIndexable, siteConfig } from "@/config/site";
import { themeStylesheet } from "@/theme/tokens";

import "./globals.css";
import "./editorial.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const themeInitializer = `(() => {
  try {
    const storageKey = 'wideorder-theme';
    const storedTheme = window.localStorage.getItem(storageKey);
    if (['light', 'dark', 'option3-light', 'option3-dark'].includes(storedTheme)) {
      document.documentElement.setAttribute('data-theme', storedTheme);
    }
  } catch {
    // Intentionally empty.
  }
})();`;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.domain),
  title: siteConfig.title,
  description: siteConfig.description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    title: siteConfig.openGraph.title,
    description: siteConfig.openGraph.description,
    url: siteConfig.openGraph.url,
    siteName: siteConfig.openGraph.siteName,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/wideorder-w-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/wideorder-w-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/icons/wideorder-w-180.png", sizes: "180x180", type: "image/png" }],
  },
  robots: {
    index: isSiteIndexable,
    follow: isSiteIndexable,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`} suppressHydrationWarning>
      <head>
        <script id="wideorder-theme-init" dangerouslySetInnerHTML={{ __html: themeInitializer }} />
        <style id="wideorder-theme" dangerouslySetInnerHTML={{ __html: themeStylesheet }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
