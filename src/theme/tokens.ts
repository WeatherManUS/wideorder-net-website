type TokenGroup = Record<string, string>;

export const designTokens = {
  shared: {
    "font-sans": "var(--font-inter), Arial, Helvetica, sans-serif",
    "font-serif": "var(--font-fraunces), Georgia, serif",
    "space-1": "0.25rem",
    "space-2": "0.5rem",
    "space-3": "0.75rem",
    "space-4": "1rem",
    "space-5": "1.25rem",
    "space-6": "1.5rem",
    "space-8": "2rem",
    "space-10": "2.5rem",
    "space-12": "3rem",
    "space-14": "3.5rem",
    "space-16": "4rem",
    "space-20": "5rem",
    "space-24": "6rem",
    "radius-sm": "0.75rem",
    "radius-md": "1rem",
    "radius-lg": "1.5rem",
    "radius-xl": "2rem",
    "radius-pill": "999px",
    "border-width": "1px",
    "shadow-soft": "0 24px 60px rgba(23, 36, 45, 0.08)",
    "shadow-card": "0 18px 40px rgba(23, 36, 45, 0.06)",
    "max-width": "72rem",
    "content-max": "77.5rem",
    "wide-max": "85rem",
    "narrow-max": "47.5rem",
    "text-max": "68ch",
    "header-height": "5rem",
    "transition-fast": "160ms ease",
    "transition-base": "220ms ease"
  },
  light: {
    "color-background": "#F3F0E9",
    "color-background-secondary": "#F3F0E9",
    "color-surface": "#FFFFFF",
    "color-surface-muted": "#E8E5DE",
    "color-text": "#17242D",
    "color-text-muted": "#4C5B64",
    "color-accent": "#78956F",
    "color-accent-text": "#5B7154",
    "color-accent-secondary": "#A9BCA3",
    "color-border": "#D8D5CE",
    "color-accent-contrast": "#FFFFFF",
    "color-contrast-surface": "#17242D",
    "color-contrast-text": "#F4F2ED",
    "color-field-background": "#FFFFFF"
  },
  dark: {
    "color-background": "#17242D",
    "color-background-secondary": "#202F39",
    "color-surface": "#253640",
    "color-surface-muted": "#202F39",
    "color-text": "#F4F2ED",
    "color-text-muted": "#B8C2C7",
    "color-accent": "#8FA886",
    "color-accent-text": "#8FA886",
    "color-accent-secondary": "#6F8877",
    "color-border": "#344853",
    "color-accent-contrast": "#17242D",
    "color-contrast-surface": "#202F39",
    "color-contrast-text": "#F4F2ED",
    "color-field-background": "#202F39"
  }
} as const satisfies Record<string, TokenGroup>;

const serialize = (group: TokenGroup) =>
  Object.entries(group)
    .map(([key, value]) => `  --${key}: ${value};`)
    .join("\n");

export const themeStylesheet = [
  ":root {",
  "  color-scheme: light;",
  serialize(designTokens.shared),
  serialize(designTokens.light),
  "}",
  ":root[data-theme='light'] {",
  "  color-scheme: light;",
  serialize(designTokens.light),
  "}",
  ":root[data-theme='dark'] {",
  "  color-scheme: dark;",
  serialize(designTokens.dark),
  "}",
  "@media (prefers-color-scheme: dark) {",
  "  :root:not([data-theme]) {",
  "    color-scheme: dark;",
  serialize(designTokens.dark),
  "  }",
  "}"
].join("\n");
