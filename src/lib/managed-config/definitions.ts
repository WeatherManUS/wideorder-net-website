export type ManagedSettingCategory = "public" | "secret";

export type ManagedSettingInputKind = "text" | "email" | "number" | "boolean" | "password";

export type ManagedSettingKey =
  | "CONTACT_RECIPIENT_EMAIL"
  | "TRANSACTIONAL_FROM_EMAIL"
  | "RESEND_API_KEY"
  | "SMTP_HOST"
  | "SMTP_PORT"
  | "SMTP_SECURE"
  | "SMTP_USER"
  | "NEXT_PUBLIC_TURNSTILE_SITE_KEY"
  | "SMTP_PASSWORD"
  | "TURNSTILE_SECRET_KEY";

export type ManagedSettingDefinition = {
  key: ManagedSettingKey;
  envName: ManagedSettingKey;
  category: ManagedSettingCategory;
  inputKind: ManagedSettingInputKind;
  label: string;
  description: string;
  required: boolean;
};

export const ADMIN_EMAIL = "info@wideorder.net";
export const SESSION_COOKIE_NAME = "wideorder_admin_session";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
export const LOGIN_FAILURE_WINDOW_MS = 1000 * 60 * 15;
export const LOGIN_FAILURE_LIMIT = 5;
export const LOGIN_BLOCK_MS = 1000 * 60 * 30;

export const MANAGED_SETTING_DEFINITIONS: readonly ManagedSettingDefinition[] = [
  {
    key: "CONTACT_RECIPIENT_EMAIL",
    envName: "CONTACT_RECIPIENT_EMAIL",
    category: "public",
    inputKind: "email",
    label: "Contact recipient email",
    description: "Internal mailbox that receives website contact submissions.",
    required: true,
  },
  {
    key: "TRANSACTIONAL_FROM_EMAIL",
    envName: "TRANSACTIONAL_FROM_EMAIL",
    category: "public",
    inputKind: "email",
    label: "Transactional sender email",
    description: "Approved From mailbox used for website-generated transactional delivery.",
    required: true,
  },
  {
    key: "SMTP_HOST",
    envName: "SMTP_HOST",
    category: "public",
    inputKind: "text",
    label: "SMTP host",
    description: "SMTP server hostname used for authenticated delivery.",
    required: true,
  },
  {
    key: "SMTP_PORT",
    envName: "SMTP_PORT",
    category: "public",
    inputKind: "number",
    label: "SMTP port",
    description: "SMTP server port used for authenticated delivery.",
    required: true,
  },
  {
    key: "SMTP_SECURE",
    envName: "SMTP_SECURE",
    category: "public",
    inputKind: "boolean",
    label: "SMTP secure mode",
    description: "Whether the SMTP transport uses an implicit TLS connection.",
    required: true,
  },
  {
    key: "SMTP_USER",
    envName: "SMTP_USER",
    category: "public",
    inputKind: "email",
    label: "SMTP username",
    description: "Authenticated SMTP identity and From mailbox for website mail.",
    required: true,
  },
  {
    key: "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
    envName: "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
    category: "public",
    inputKind: "text",
    label: "Turnstile site key",
    description: "Browser-safe Cloudflare Turnstile public site key delivered at runtime.",
    required: true,
  },
  {
    key: "RESEND_API_KEY",
    envName: "RESEND_API_KEY",
    category: "secret",
    inputKind: "password",
    label: "Resend API key",
    description: "Transactional email API key encrypted before database storage.",
    required: true,
  },
  {
    key: "SMTP_PASSWORD",
    envName: "SMTP_PASSWORD",
    category: "secret",
    inputKind: "password",
    label: "SMTP password",
    description: "SMTP authentication secret encrypted before database storage.",
    required: true,
  },
  {
    key: "TURNSTILE_SECRET_KEY",
    envName: "TURNSTILE_SECRET_KEY",
    category: "secret",
    inputKind: "password",
    label: "Turnstile secret key",
    description: "Server-side Cloudflare Turnstile verification secret encrypted at rest.",
    required: true,
  },
] as const;

export const MANAGED_SETTING_KEYS = MANAGED_SETTING_DEFINITIONS.map((definition) => definition.key);

export const PUBLIC_MANAGED_SETTING_KEYS = MANAGED_SETTING_DEFINITIONS.filter(
  (definition) => definition.category === "public",
).map((definition) => definition.key);

export const SECRET_MANAGED_SETTING_KEYS = MANAGED_SETTING_DEFINITIONS.filter(
  (definition) => definition.category === "secret",
).map((definition) => definition.key);

const managedSettingDefinitionsByKey = new Map(MANAGED_SETTING_DEFINITIONS.map((definition) => [definition.key, definition]));

export function getManagedSettingDefinition(key: ManagedSettingKey) {
  return managedSettingDefinitionsByKey.get(key)!;
}

export function isManagedSettingKey(value: string): value is ManagedSettingKey {
  return managedSettingDefinitionsByKey.has(value as ManagedSettingKey);
}
