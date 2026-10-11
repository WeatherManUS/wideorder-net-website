import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";

import { siteConfig } from "@/config/site";
import { themeStylesheet } from "@/theme/tokens";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600"],
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  weight: ["600", "700"],
});

const themeInitializer = `(() => {
  try {
    const storageKey = 'wideorder-theme';
    const storedTheme = window.localStorage.getItem(storageKey);
    if (storedTheme === 'light' || storedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', storedTheme);
    }
  } catch {
    // Intentionally empty.
  }
})();`;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.domain),
  title: siteConfig.name,
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script id="wideorder-theme-init" dangerouslySetInnerHTML={{ __html: themeInitializer }} />
        <style id="wideorder-theme" dangerouslySetInnerHTML={{ __html: themeStylesheet }} />
      </head>
      <body className={`${inter.variable} ${fraunces.variable}`}>{children}</body>
    </html>
  );
}
