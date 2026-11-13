import { INQUIRY_HREF } from "@/components/inquiry-link";
import Link from "next/link";
import { connection } from "next/server";

import { getContactMailtoHref, siteConfig } from "@/config/site";
import { siteContent } from "@/content/home";

import { BrandMark } from "@/components/brand-mark";
import { SiteHeader } from "@/components/site-header";
import { SectionMotion } from "@/components/section-motion";
import { MarketingRuntime, TrackingPreferencesButton } from "@/components/marketing-runtime";
import { getRuntimeSocialProfiles } from "@/lib/managed-config/service";
import { SocialLinks } from "@/components/social-links";
import { releaseIdentity } from "@/lib/release/metadata";
import { currentRelease } from "@/lib/release/server";
import { copyrightYear, footerVersionEnabled, formatPublicationTime } from "@/lib/release/footer";

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="section-label">{children}</p>;
}

export async function SiteFooter({ utility = false }: { utility?: boolean } = {}) {
  await connection();
  const profiles = await getRuntimeSocialProfiles();
  const year = copyrightYear();
  const showVersion = footerVersionEnabled();
  let release: Awaited<ReturnType<typeof currentRelease>> | null = null;
  try { if (showVersion) release = await currentRelease(); } catch { /* Never substitute build time for missing publication. */ }
  const published = formatPublicationTime(release?.publishedAt ?? null);

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
        </div>
        <div className="site-footer__legal">
          <SocialLinks profiles={profiles} label="Footer social profiles" />
          {utility ? null : <TrackingPreferencesButton />}
          <p><Link href="/privacy">Privacy information</Link></p>
          <p className="site-footer__copyright" data-footer-version-enabled={showVersion ? "true" : "false"}>
            <Link href="/admin/login" aria-label="Administrator sign in">
              ©
            </Link>{" "}
            {year} WideOrder Resolve
            {showVersion ? <span className="site-footer__release" data-footer-release={release?.releaseId ?? releaseIdentity().releaseId} data-release-version={release?.version ?? releaseIdentity().version}>
              {" · "}{release?.version === "unallocated" ? "Release awaiting allocation" : `v${release?.version ?? releaseIdentity().version}`}{" · "}
              {published && release?.publishedAt ? <>Published <time dateTime={release.publishedAt}>{published}</time></> : "Publication not yet confirmed"}
            </span> : null}
            {" "}<span className="site-footer__rights">All rights reserved.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

export async function PageShell({ children }: { children: React.ReactNode }) {
  await connection();
  const profiles = await getRuntimeSocialProfiles();
  const headerCta = {
    ...siteContent.shared.primaryCta,
    href: INQUIRY_HREF,
  };

  return (
    <div id="top" className="site-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <SiteHeader navItems={siteContent.shared.navItems} cta={headerCta} profiles={profiles} />
      <main id="main-content" className="site-main" tabIndex={-1}>
        {children}
      </main>
      <SectionMotion />
      <SiteFooter />
      <MarketingRuntime />
    </div>
  );
}
