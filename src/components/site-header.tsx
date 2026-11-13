"use client";

import { SocialLinks, type SocialProfile } from "@/components/social-links";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { NavItem } from "@/content/home";

import { BrandMark } from "@/components/brand-mark";
import { MobileNavigation } from "@/components/mobile-navigation";
import { ThemeToggle } from "@/components/theme-toggle";

type SiteHeaderProps = {
  navItems: readonly NavItem[];
  cta: NavItem;
  profiles: readonly SocialProfile[];
};

export function SiteHeader({ navItems, cta, profiles }: SiteHeaderProps) {
  const pathname = usePathname();

  return (
    <header className={`site-header${profiles.length ? " site-header--social" : ""}`}>
      <div className="container container--wide">
        <div className="site-header__bar">
          <BrandMark href="/" priority />
          <nav className="primary-nav" aria-label="Primary navigation">
            <ul>
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} aria-current={pathname === item.href ? "page" : undefined}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <SocialLinks profiles={profiles} className="site-header__social" label="Header social profiles" />
          <div className="site-header__actions">
            <a className="button button--primary site-header__cta" href={cta.href}>
              {cta.label}
            </a>
            <ThemeToggle />
            <MobileNavigation navItems={navItems} cta={cta} profiles={profiles} />
          </div>
        </div>
      </div>
    </header>
  );
}
