"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { appearances, isAppearance, type Appearance } from "@/theme/appearances";

const STORAGE_KEY = "wideorder-theme";
const MEDIA_QUERY = "(prefers-color-scheme: dark)";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Appearance>("option3-light");
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const opening = useRef<"hover" | "explicit">("hover");
  const hoverClose = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();
  const active = appearances.find((appearance) => appearance.id === theme)!;

  useEffect(() => {
    const mediaQuery = window.matchMedia(MEDIA_QUERY);
    const syncTheme = () => {
      let stored: string | null = null;
      try { stored = localStorage.getItem(STORAGE_KEY); } catch { /* Storage can be unavailable. */ }
      const selected = isAppearance(stored) ? stored : mediaQuery.matches ? "option3-dark" : "option3-light";
      document.documentElement.setAttribute("data-theme", selected);
      setTheme(selected);
    };
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    const dismiss = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      if (root.current?.contains(document.activeElement)) trigger.current?.focus();
    };
    syncTheme();
    mediaQuery.addEventListener("change", syncTheme);
    window.addEventListener("storage", syncTheme);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", dismiss);
    return () => {
      mediaQuery.removeEventListener("change", syncTheme);
      window.removeEventListener("storage", syncTheme);
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", dismiss);
      if (hoverClose.current) clearTimeout(hoverClose.current);
    };
  }, []);

  const close = (restoreFocus = false) => { setOpen(false); if (restoreFocus) trigger.current?.focus(); };
  const show = (index = appearances.findIndex((appearance) => appearance.id === theme)) => {
    opening.current = "explicit";
    setOpen(true);
    requestAnimationFrame(() => items.current[index]?.focus());
  };
  const choose = (value: Appearance) => {
    document.documentElement.setAttribute("data-theme", value);
    try { localStorage.setItem(STORAGE_KEY, value); } catch { /* Keep the current page usable. */ }
    setTheme(value);
    close(true);
  };
  const previewStyle = (tokens: (typeof appearances)[number]["tokens"]): CSSProperties => ({
    "--preview-background": tokens["color-background"],
    "--preview-surface": tokens["color-surface"],
    "--preview-accent": tokens["color-accent"],
    "--preview-text": tokens["color-text"],
  }) as CSSProperties;

  return (
    <div ref={root} className="appearance-selector"
      onPointerEnter={(event) => { if (hoverClose.current) clearTimeout(hoverClose.current); if (event.pointerType === "mouse" && !open) { opening.current = "hover"; setOpen(true); } }}
      onPointerLeave={() => { if (opening.current === "hover" && !root.current?.contains(document.activeElement)) hoverClose.current = setTimeout(() => close(), 120); }}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) close(); }}
      onKeyDown={(event) => {
        if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(true); }
        if (event.key === "Tab" && open) close(true);
      }}>
      <button ref={trigger} id={`${id}-trigger`} type="button" className="theme-toggle appearance-trigger"
        aria-label={`Appearance: ${active.name}`} title={`Appearance: ${active.name}`}
        aria-haspopup="menu" aria-expanded={open} aria-controls={`${id}-menu`}
        onClick={() => { if (open && opening.current === "explicit") close(); else show(); }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); show(event.key === "ArrowUp" ? appearances.length - 1 : undefined); }
        }}>
        <span className="appearance-preview appearance-preview--small" style={previewStyle(active.tokens)} aria-hidden="true"><i /><b /></span>
        <svg className="appearance-chevron" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="m3 4.5 3 3 3-3" stroke="currentColor" strokeWidth="1.5" /></svg>
      </button>
      {open ? <div id={`${id}-menu`} className="appearance-menu" role="menu" aria-label="Choose appearance"
        onKeyDown={(event) => {
          const index = items.current.findIndex((item) => item === document.activeElement);
          const next = event.key === "ArrowDown" ? (index + 1) % appearances.length : event.key === "ArrowUp" ? (index - 1 + appearances.length) % appearances.length : event.key === "Home" ? 0 : event.key === "End" ? appearances.length - 1 : null;
          if (next !== null) { event.preventDefault(); items.current[next]?.focus(); }
        }}>
        <p className="appearance-menu__heading" role="presentation">Appearance</p>
        {appearances.map((appearance, index) => <button key={appearance.id} ref={(element) => { items.current[index] = element; }} type="button"
          className="appearance-option" role="menuitemradio" aria-checked={theme === appearance.id} tabIndex={-1}
          onClick={() => choose(appearance.id)}>
          <span className="appearance-preview" style={previewStyle(appearance.tokens)} aria-hidden="true"><i /><b /></span>
          <span className="appearance-option__copy"><span>{appearance.name}</span><small>{appearance.description}</small></span>
          <span className="appearance-option__check" aria-hidden="true">{theme === appearance.id ? <svg viewBox="0 0 16 16" fill="none"><path d="m3 8 3 3 7-7" stroke="currentColor" strokeWidth="1.8" /></svg> : null}</span>
        </button>)}
      </div> : null}
    </div>
  );
}
