import Link from "next/link";

import { getContactMailtoHref, siteConfig } from "@/config/site";
import { siteContent } from "@/content/home";

import { BrandMark } from "@/components/brand-mark";
import { SiteHeader } from "@/components/site-header";

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="section-label">{children}</p>;
}

function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container container--wide site-footer__grid">
        <div className="site-footer__identity">
          <BrandMark href="/" className="site-footer__brand" />
          <p>{siteContent.shared.footer.identity[1]}</p>
          <p>{siteContent.shared.footer.identity[2]}</p>
          <p className="site-footer__philosophy">{siteContent.shared.footer.philosophy}</p>
          <p className="site-footer__philosophy">
            <a href={getContactMailtoHref("WideOrder enquiry")}>{siteConfig.contact.publicMailbox}</a>
          </p>
          <p className="site-footer__copyright">
            <Link href="/admin/login" aria-label="Administrator sign in">
              ©
            </Link>{" "}
            {year} WideOrder Resolve. All rights reserved.
          </p>
        </div>
        <nav className="site-footer__nav" aria-label="Footer navigation">
          <ul>
            {siteContent.shared.footer.navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  const headerCta = {
    ...siteContent.shared.primaryCta,
    href: getContactMailtoHref("WideOrder enquiry"),
  };

  return (
    <div id="top" className="site-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <SiteHeader navItems={siteContent.shared.navItems} cta={headerCta} />
      <main id="main-content" className="site-main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
