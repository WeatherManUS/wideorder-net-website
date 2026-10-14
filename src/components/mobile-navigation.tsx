"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import type { NavItem } from "@/content/home";

type MobileNavigationProps = {
  navItems: readonly NavItem[];
  cta: NavItem;
};

export function MobileNavigation({ navItems, cta }: MobileNavigationProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        window.requestAnimationFrame(() => buttonRef.current?.focus());
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);

  return (
    <div className="mobile-navigation">
      <button
        ref={buttonRef}
        type="button"
        className="mobile-navigation__toggle"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="mobile-navigation__toggle-lines" aria-hidden="true">
          <span />
          <span />
        </span>
      </button>
      <div id={panelId} className="mobile-navigation__panel" data-state={isOpen ? "open" : "closed"} aria-hidden={!isOpen}>
        <nav aria-label="Mobile navigation" className="mobile-navigation__nav">
          <ul className="mobile-navigation__list">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} aria-current={pathname === item.href ? "page" : undefined} onClick={closeMenu}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <a className="button button--primary mobile-navigation__cta" href={cta.href} onClick={closeMenu}>
          {cta.label}
        </a>
      </div>
    </div>
  );
}
