import { designTokens } from "./tokens.ts";

export const appearances = [
  { id: "light", name: "Ivory & Sage", description: "Warm light", tokens: designTokens.light },
  { id: "dark", name: "Navy & Sage", description: "Deep blue dark", tokens: designTokens.dark },
  { id: "option3-light", name: "Pearl & Indigo", description: "Soft light", tokens: designTokens.option3Light },
  { id: "option3-dark", name: "Ink & Indigo", description: "Violet dark", tokens: designTokens.option3Dark },
] as const;
export type Appearance = (typeof appearances)[number]["id"];
export const isAppearance = (value: string | null): value is Appearance => appearances.some((appearance) => appearance.id === value);
