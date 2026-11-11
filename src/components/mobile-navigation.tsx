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
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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

    const frame = window.requestAnimationFrame(() => panelRef.current?.querySelector<HTMLAnchorElement>("a")?.focus());
    const outside = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false); };
    const media = window.matchMedia("(min-width: 1200px)");
    const resize = () => { if (media.matches) { setIsOpen(false); document.querySelector<HTMLAnchorElement>(".primary-nav a")?.focus(); } };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", outside);
    media.addEventListener("change", resize);
    return () => { window.cancelAnimationFrame(frame); document.removeEventListener("keydown", handleKeyDown); document.removeEventListener("pointerdown", outside); media.removeEventListener("change", resize); };
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);

  return (
    <div className="mobile-navigation" ref={rootRef} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false); }}>
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
      <div ref={panelRef} id={panelId} inert={!isOpen} className="mobile-navigation__panel" data-state={isOpen ? "open" : "closed"} aria-hidden={!isOpen}>
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
