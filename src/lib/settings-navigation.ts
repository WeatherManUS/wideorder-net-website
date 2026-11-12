export const settingsCategories = [
  { id: "general", label: "General" },
  { id: "communications", label: "Communications" },
  { id: "branding", label: "Branding & Appearance" },
  { id: "security", label: "Security & Access" },
  { id: "marketing", label: "Marketing & Social" },
  { id: "integrations", label: "Integrations" },
  { id: "advanced", label: "Advanced" },
] as const;
export type SettingsCategory = typeof settingsCategories[number]["id"];
export function settingsCategory(value: unknown): SettingsCategory {
  return settingsCategories.find(category => category.id === value)?.id ?? "general";
}
// Only preserve the category on existing internal Settings redirects.
export function settingsReturnPath(requestUrl: string, destination: string) {
  const result = new URL(destination, "https://wideorder.net");
  if (result.pathname !== "/admin/settings") return destination;
  const category = new URL(requestUrl).searchParams.get("category");
  if (settingsCategories.some(item => item.id === category)) result.searchParams.set("category", category!);
  return result.pathname + result.search + result.hash;
}
