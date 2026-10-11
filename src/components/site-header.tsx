import type { NavItem } from "@/content/home";

import { BrandMark } from "@/components/brand-mark";
import { MobileNavigation } from "@/components/mobile-navigation";
import { ThemeToggle } from "@/components/theme-toggle";

type SiteHeaderProps = {
  navItems: readonly NavItem[];
  cta: NavItem;
};

export function SiteHeader({ navItems, cta }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <div className="container container--wide">
        <div className="site-header__bar">
          <BrandMark priority />
          <nav className="primary-nav" aria-label="Primary navigation">
            <ul>
              {navItems.map((item) => (
                <li key={item.href}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="site-header__actions">
            <a className="button button--primary site-header__cta" href={cta.href}>
              {cta.label}
            </a>
            <ThemeToggle />
            <MobileNavigation navItems={navItems} cta={cta} />
          </div>
        </div>
      </div>
    </header>
  );
}
