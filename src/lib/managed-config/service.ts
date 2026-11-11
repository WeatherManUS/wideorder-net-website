import { validateSmtpConfig, type SmtpConfig } from "../smtp/config.ts";
import type { ManagedSettingDefinition, ManagedSettingKey } from "@/lib/managed-config/definitions";
import {
  MANAGED_SETTING_DEFINITIONS,
  PUBLIC_MANAGED_SETTING_KEYS,
  getManagedSettingDefinition,
} from "@/lib/managed-config/definitions";
import { decryptSecretValue, encryptSecretValue } from "@/lib/managed-config/crypto";
import { getManagedConfigStore, type PersistenceSummary, type StoredAuditRecord, type StoredSettingRecord } from "@/lib/managed-config/storage";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SettingValueSource = "managed" | "bootstrap" | "unset";

export type AdminSettingView = {
  key: ManagedSettingKey;
  label: string;
  description: string;
  category: ManagedSettingDefinition["category"];
  inputKind: ManagedSettingDefinition["inputKind"];
  required: boolean;
  configured: boolean;
  source: SettingValueSource;
  value: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
};

export type AuditView = {
  id: string;
  settingKey: ManagedSettingKey | "ADMIN_PASSWORD_HASH";
  category: "public" | "secret" | "auth";
  changedAt: string;
  adminIdentity: string;
};

export type ContactOperationalConfig = {
  transactional: {
    apiKey: string;
    fromEmail: string;
    recipient: string;
  };
  turnstileSiteKey: string;
  turnstileSecretKey: string;
};

export type ContactOperationalConfigStatus = {
  config: ContactOperationalConfig;
  hasRequiredValues: boolean;
};

type ResolvedSettingValue = {
  definition: ManagedSettingDefinition;
  value: string;
  source: SettingValueSource;
  storedRecord: StoredSettingRecord | null;
};

type SettingsUpdateInput = Partial<Record<ManagedSettingKey, string>>;

const defaults: Partial<Record<ManagedSettingKey, string>> = { SMTP_HOST: "smtp.hostinger.com", SMTP_PORT: "465", SMTP_SECURE: "true", SMTP_AUTH: "true", SMTP_FROM_NAME: "WideOrder", SMTP_ACKNOWLEDGMENT: "false" };
function getBootstrapSettingValue(key: ManagedSettingKey) {
  return process.env[getManagedSettingDefinition(key).envName] ?? defaults[key] ?? "";
}

async function getStoredSettingsMap() {
  const store = await getManagedConfigStore();
  const storedSettings = await store.listSettings();
  for (const record of storedSettings) {
    if (record.key === "SMTP_USER" && record.category === "public") {
      record.category = "secret";
      record.storedValue = encryptSecretValue(record.storedValue);
      await store.upsertSetting(record);
    }
  }
  return new Map(storedSettings.map((record) => [record.key, record]));
}

async function resolveSettingValue(key: ManagedSettingKey, storedSettingsMap?: Map<ManagedSettingKey, StoredSettingRecord>) {
  const definition = getManagedSettingDefinition(key);
  const storedSettings = storedSettingsMap ?? (await getStoredSettingsMap());
  const storedRecord = storedSettings.get(key) ?? null;

  if (storedRecord) {
    return {
      definition,
      value: definition.category === "secret" ? decryptSecretValue(storedRecord.storedValue) : storedRecord.storedValue,
      source: "managed",
      storedRecord,
    } satisfies ResolvedSettingValue;
  }

  const bootstrapValue = getBootstrapSettingValue(key);

  if (bootstrapValue) {
    return {
      definition,
      value: bootstrapValue,
      source: "bootstrap",
      storedRecord: null,
    } satisfies ResolvedSettingValue;
  }

  return {
    definition,
    value: "",
    source: "unset",
    storedRecord: null,
  } satisfies ResolvedSettingValue;
}

function normalizeManagedSettingInput(definition: ManagedSettingDefinition, value: string) {
  const normalizedValue = definition.category === "secret" ? value : value.trim();
  if (!normalizedValue && ["SMTP_FROM_EMAIL", "SMTP_RECIPIENT", "SMTP_USER", "SMTP_FROM_NAME"].includes(definition.key)) return "";

  switch (definition.inputKind) {
    case "email": {
      if (!normalizedValue || normalizedValue.length > 254 || !EMAIL_PATTERN.test(normalizedValue)) {
        throw new Error(`${definition.key.toLowerCase()}_invalid`);
      }

      return normalizedValue;
    }
    case "number": {
      const parsed = Number.parseInt(normalizedValue, 10);

      if (!/^\d+$/.test(normalizedValue) || !Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
        throw new Error(`${definition.key.toLowerCase()}_invalid`);
      }

      return String(parsed);
    }
    case "boolean": {
      const loweredValue = normalizedValue.toLowerCase();

      if (["true", "1", "yes", "on"].includes(loweredValue)) {
        return "true";
      }

      if (["false", "0", "no", "off"].includes(loweredValue)) {
        return "false";
      }

      throw new Error(`${definition.key.toLowerCase()}_invalid`);
    }
    case "password": {
      if (!normalizedValue) {
        throw new Error(`${definition.key.toLowerCase()}_invalid`);
      }

      return normalizedValue;
    }
    case "text":
    default: {
      if (!normalizedValue || normalizedValue.length > 512 || /[\r\n\x00]/.test(normalizedValue)) {
        throw new Error(`${definition.key.toLowerCase()}_invalid`);
      }

      return normalizedValue;
    }
  }
}

export async function getPersistenceSummary(): Promise<PersistenceSummary> {
  const store = await getManagedConfigStore();
  return store.summary;
}

export async function getAdminSettingViews() {
  const storedSettings = await getStoredSettingsMap();

  return Promise.all(
    MANAGED_SETTING_DEFINITIONS.map(async (definition) => {
      const resolved = await resolveSettingValue(definition.key, storedSettings);

      return {
        key: definition.key,
        label: definition.label,
        description: definition.description,
        category: definition.category,
        inputKind: definition.inputKind,
        required: definition.required,
        configured: Boolean(resolved.value),
        source: resolved.source,
        value: definition.category === "public" ? resolved.value : null,
        updatedAt: resolved.storedRecord?.updatedAt ?? null,
        updatedBy: resolved.storedRecord?.updatedBy ?? null,
      } satisfies AdminSettingView;
    }),
  );
}

export async function getRecentAuditViews(limit = 10) {
  const store = await getManagedConfigStore();
  const entries = await store.listAuditEntries(limit);

  return entries.map((entry) => ({
    id: entry.id,
    settingKey: entry.settingKey,
    category: entry.category,
    changedAt: entry.changedAt,
    adminIdentity: entry.adminIdentity,
  })) satisfies AuditView[];
}

export async function updateManagedSettings(inputs: SettingsUpdateInput, adminIdentity: string) {
  const store = await getManagedConfigStore();
  const nowIso = new Date().toISOString();
  const touchedKeys: ManagedSettingKey[] = [];

  const records: StoredSettingRecord[] = [];
  const audits: StoredAuditRecord[] = [];
  const stored = await getStoredSettingsMap();
  for (const definition of MANAGED_SETTING_DEFINITIONS) {
    if (!(definition.key in inputs)) continue;
    const rawValue = inputs[definition.key] ?? "";
    if (definition.category === "secret" && !rawValue) continue;
    if (rawValue.length > 4096) throw new Error("invalid_setting");
    const normalizedValue = normalizeManagedSettingInput(definition, rawValue);
    const record = { key: definition.key, category: definition.category,
      storedValue: definition.category === "secret" ? encryptSecretValue(normalizedValue) : normalizedValue,
      updatedAt: nowIso, updatedBy: adminIdentity };
    records.push(record);
    stored.set(definition.key, record);
    audits.push({ id: crypto.randomUUID(), settingKey: definition.key, category: definition.category, changedAt: nowIso, adminIdentity });
    touchedKeys.push(definition.key);
  }
  if (touchedKeys.some(key => key.startsWith("SMTP_"))) validateSmtpConfig(await resolveSmtpConfig(stored), false);
  await store.saveSettings(records, audits);

  return touchedKeys;
}

export async function getRuntimeContactConfig() {
  const resolved = await resolveSettingValue("NEXT_PUBLIC_TURNSTILE_SITE_KEY");

  return {
    turnstileSiteKey: resolved.value,
  };
}

export async function getContactOperationalConfigStatus(): Promise<ContactOperationalConfigStatus> {
  const storedSettings = await getStoredSettingsMap();
  const resendApiKey = await resolveSettingValue("RESEND_API_KEY", storedSettings);
  const transactionalFromEmail = await resolveSettingValue("TRANSACTIONAL_FROM_EMAIL", storedSettings);
  const recipientEmail = await resolveSettingValue("CONTACT_RECIPIENT_EMAIL", storedSettings);
  const turnstileSiteKey = await resolveSettingValue("NEXT_PUBLIC_TURNSTILE_SITE_KEY", storedSettings);
  const turnstileSecretKey = await resolveSettingValue("TURNSTILE_SECRET_KEY", storedSettings);

  const config = {
    transactional: {
      apiKey: resendApiKey.value,
      fromEmail: transactionalFromEmail.value,
      recipient: recipientEmail.value,
    },
    turnstileSiteKey: turnstileSiteKey.value,
    turnstileSecretKey: turnstileSecretKey.value,
  } satisfies ContactOperationalConfig;

  const hasRequiredValues =
    Boolean(config.turnstileSecretKey) &&
    Boolean(config.turnstileSiteKey) &&
    Boolean(config.transactional.apiKey) &&
    Boolean(config.transactional.fromEmail) &&
    Boolean(config.transactional.recipient);

  return {
    config,
    hasRequiredValues,
  };
}

export async function getPublicSettingViews() {
  const allViews = await getAdminSettingViews();
  return allViews.filter((view) => PUBLIC_MANAGED_SETTING_KEYS.includes(view.key));
}

async function resolveSmtpConfig(stored = new Map<ManagedSettingKey, StoredSettingRecord>()): Promise<SmtpConfig> {
  const value = async (key: ManagedSettingKey) => (await resolveSettingValue(key, stored)).value;
  return { host: await value("SMTP_HOST"), port: Number(await value("SMTP_PORT")), secure: (await value("SMTP_SECURE")) === "true",
    auth: (await value("SMTP_AUTH")) !== "false", username: await value("SMTP_USER"), password: await value("SMTP_PASSWORD"),
    from: await value("SMTP_FROM_EMAIL"), fromName: await value("SMTP_FROM_NAME"), recipient: await value("SMTP_RECIPIENT"),
    acknowledgment: (await value("SMTP_ACKNOWLEDGMENT")) === "true" };
}
export async function getSmtpConfig() { return resolveSmtpConfig(await getStoredSettingsMap()); }
export async function getInquirySecurityConfig() {
  const stored = await getStoredSettingsMap();
  return { siteKey: (await resolveSettingValue("NEXT_PUBLIC_TURNSTILE_SITE_KEY", stored)).value,
    secretKey: (await resolveSettingValue("TURNSTILE_SECRET_KEY", stored)).value };
}
