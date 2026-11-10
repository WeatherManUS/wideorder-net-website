"use client";

import { useEffect, useState } from "react";

const themes = ["light", "dark", "option3-light", "option3-dark"] as const;
type Theme = (typeof themes)[number];
const labels = ["Option 1 Light", "Option 1 Dark", "Option 3 Light", "Option 3 Dark"];
const STORAGE_KEY = "wideorder-theme";
const MEDIA_QUERY = "(prefers-color-scheme: dark)";
const isTheme = (value: string | null): value is Theme => themes.some((theme) => theme === value);
const getResolvedTheme = (): Theme => {
  const explicit = document.documentElement.getAttribute("data-theme");
  return isTheme(explicit) ? explicit : window.matchMedia(MEDIA_QUERY).matches ? "dark" : "light";
};

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const mediaQuery = window.matchMedia(MEDIA_QUERY);
    const syncTheme = () => {
      let stored: string | null = null;
      try { stored = window.localStorage.getItem(STORAGE_KEY); } catch { /* Storage may be unavailable. */ }
      if (isTheme(stored)) {
        document.documentElement.setAttribute("data-theme", stored);
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
      setTheme(getResolvedTheme());
    };
    syncTheme();
    mediaQuery.addEventListener("change", syncTheme);
    window.addEventListener("storage", syncTheme);
    return () => {
      mediaQuery.removeEventListener("change", syncTheme);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  const handleToggle = () => {
    const nextTheme = themes[(themes.indexOf(getResolvedTheme()) + 1) % themes.length];
    document.documentElement.setAttribute("data-theme", nextTheme);
    try { window.localStorage.setItem(STORAGE_KEY, nextTheme); } catch { /* Keep the selection for this page. */ }
    setTheme(nextTheme);
  };
  const index = themes.indexOf(theme);
  const accessibleLabel = `Current theme: ${labels[index]}; activate for ${labels[(index + 1) % themes.length]}.`;

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={accessibleLabel}
      title={accessibleLabel}
      onClick={handleToggle}
    >
      <span className="theme-toggle__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M12 3.75a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V4.5a.75.75 0 0 1 .75-.75Zm0 12.75a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm7.5-5.25a.75.75 0 0 1 .75.75.75.75 0 0 1-.75.75H18a.75.75 0 0 1 0-1.5h1.5ZM6 12a.75.75 0 0 1-.75.75h-1.5A.75.75 0 0 1 3 12a.75.75 0 0 1 .75-.75h1.5A.75.75 0 0 1 6 12Zm11.303-5.303a.75.75 0 0 1 1.06 0l1.061 1.06a.75.75 0 1 1-1.06 1.061l-1.061-1.06a.75.75 0 0 1 0-1.061Zm-11.666 0a.75.75 0 0 1 1.06 1.061L5.637 8.818a.75.75 0 1 1-1.06-1.06l1.06-1.061Zm12.727 10.606 1.06 1.06a.75.75 0 0 1-1.06 1.061l-1.061-1.06a.75.75 0 1 1 1.06-1.061ZM6.697 17.303a.75.75 0 0 1 0 1.06l-1.06 1.061a.75.75 0 1 1-1.061-1.06l1.06-1.061a.75.75 0 0 1 1.061 0ZM12 18a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 12 18Z" />
        </svg>
      </span>
      <span className="sr-only">{accessibleLabel}</span>
    </button>
  );
}
