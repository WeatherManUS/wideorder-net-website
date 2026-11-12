"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { settingsCategories, type SettingsCategory } from "@/lib/settings-navigation";

export function SettingsNavigation({ active }: { active: SettingsCategory }) {
  const router = useRouter();
  useEffect(() => {
    function legacyLink() {
      const url = new URL(window.location.href);
      if (url.searchParams.has("category")) return;
      const category = ({ "#security-access": "security", "#communications": "communications", "#general-settings": "general" } as Record<string, string>)[url.hash];
      if (category) { url.searchParams.set("category", category); router.replace(url.pathname + url.search + url.hash); }
    }
    legacyLink(); window.addEventListener("hashchange", legacyLink);
    return () => window.removeEventListener("hashchange", legacyLink);
  }, [active, router]);
  return <nav className="settings-navigation" aria-label="Settings categories">
    {settingsCategories.map(category => <Link key={category.id} href={`/admin/settings?category=${category.id}`} aria-current={active === category.id ? "page" : undefined}>{category.label}</Link>)}
  </nav>;
}
