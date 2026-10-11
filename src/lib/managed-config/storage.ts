import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { createPool, type Pool, type PoolOptions, type RowDataPacket } from "mysql2/promise";

import type { ManagedSettingCategory, ManagedSettingKey } from "@/lib/managed-config/definitions";

export type PersistenceEngine = "mysql" | "sqlite";

export type StoredSettingRecord = {
  key: ManagedSettingKey;
  category: ManagedSettingCategory;
  storedValue: string;
  updatedAt: string;
  updatedBy: string;
};

export type StoredAuditRecord = {
  id: string;
  settingKey: ManagedSettingKey | "ADMIN_PASSWORD_HASH";
  category: ManagedSettingCategory | "auth";
  changedAt: string;
  adminIdentity: string;
};

export type StoredAdminCredentialRecord = {
  adminEmail: string;
  passwordHash: string;
  updatedAt: string;
  updatedBy: string;
};

export type StoredSessionRecord = {
  sessionIdHash: string;
  adminEmail: string;
  createdAt: string;
  expiresAt: string;
  lastSeenAt: string;
};

export type StoredLoginAttemptRecord = {
  scopeKey: string;
  failCount: number;
  firstFailedAt: string;
  updatedAt: string;
  blockedUntil: string | null;
};

export type PersistenceSummary = {
  engine: PersistenceEngine;
  detail: string;
};

export interface ManagedConfigStore {
  readonly summary: PersistenceSummary;
  listSettings(): Promise<StoredSettingRecord[]>;
  getSetting(key: ManagedSettingKey): Promise<StoredSettingRecord | null>;
  upsertSetting(record: StoredSettingRecord): Promise<void>;
  getAdminCredential(adminEmail: string): Promise<StoredAdminCredentialRecord | null>;
  upsertAdminCredential(record: StoredAdminCredentialRecord): Promise<void>;
  deleteAdminCredential(adminEmail: string): Promise<void>;
  appendAudit(record: StoredAuditRecord): Promise<void>;
  listAuditEntries(limit: number): Promise<StoredAuditRecord[]>;
  purgeExpiredSessions(nowIso: string): Promise<void>;
  getSession(sessionIdHash: string): Promise<StoredSessionRecord | null>;
  upsertSession(record: StoredSessionRecord): Promise<void>;
  touchSession(sessionIdHash: string, lastSeenAt: string): Promise<void>;
  deleteSession(sessionIdHash: string): Promise<void>;
  deleteSessionsForAdmin(adminEmail: string): Promise<void>;
  getLoginAttempt(scopeKey: string): Promise<StoredLoginAttemptRecord | null>;
  upsertLoginAttempt(record: StoredLoginAttemptRecord): Promise<void>;
  deleteLoginAttempt(scopeKey: string): Promise<void>;
}

type SettingRow = {
  setting_key: ManagedSettingKey;
  category: ManagedSettingCategory;
  stored_value: string;
  updated_at: string;
  updated_by: string;
};

type AuditRow = {
  id: string;
  setting_key: ManagedSettingKey | "ADMIN_PASSWORD_HASH";
  category: ManagedSettingCategory | "auth";
  changed_at: string;
  admin_identity: string;
};

type AdminCredentialRow = {
  admin_email: string;
  password_hash: string;
  updated_at: string;
  updated_by: string;
};

type SessionRow = {
  session_id_hash: string;
  admin_email: string;
  created_at: string;
  expires_at: string;
  last_seen_at: string;
};

type LoginAttemptRow = {
  scope_key: string;
  fail_count: number;
  first_failed_at: string;
  updated_at: string;
  blocked_until: string | null;
};

const SQLITE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS wideorder_managed_settings (
    setting_key TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    stored_value TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    updated_by TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS wideorder_managed_settings_audit (
    id TEXT PRIMARY KEY,
    setting_key TEXT NOT NULL,
    category TEXT NOT NULL,
    changed_at TEXT NOT NULL,
    admin_identity TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS wideorder_settings_audit_changed_at_idx
    ON wideorder_managed_settings_audit (changed_at DESC);

  CREATE TABLE IF NOT EXISTS wideorder_admin_credentials (
    admin_email TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    updated_by TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS wideorder_admin_sessions (
    session_id_hash TEXT PRIMARY KEY,
    admin_email TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS wideorder_admin_login_attempts (
    scope_key TEXT PRIMARY KEY,
    fail_count INTEGER NOT NULL,
    first_failed_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    blocked_until TEXT NULL
  );
`;

const MYSQL_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS wideorder_managed_settings (
    setting_key VARCHAR(191) NOT NULL PRIMARY KEY,
    category VARCHAR(16) NOT NULL,
    stored_value LONGTEXT NOT NULL,
    updated_at VARCHAR(64) NOT NULL,
    updated_by VARCHAR(320) NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS wideorder_managed_settings_audit (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    setting_key VARCHAR(191) NOT NULL,
    category VARCHAR(16) NOT NULL,
    changed_at VARCHAR(64) NOT NULL,
    admin_identity VARCHAR(320) NOT NULL,
    INDEX wideorder_settings_audit_changed_at_idx (changed_at)
  )`,
  `CREATE TABLE IF NOT EXISTS wideorder_admin_credentials (
    admin_email VARCHAR(320) NOT NULL PRIMARY KEY,
    password_hash LONGTEXT NOT NULL,
    updated_at VARCHAR(64) NOT NULL,
    updated_by VARCHAR(320) NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS wideorder_admin_sessions (
    session_id_hash VARCHAR(191) NOT NULL PRIMARY KEY,
    admin_email VARCHAR(320) NOT NULL,
    created_at VARCHAR(64) NOT NULL,
    expires_at VARCHAR(64) NOT NULL,
    last_seen_at VARCHAR(64) NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS wideorder_admin_login_attempts (
    scope_key VARCHAR(191) NOT NULL PRIMARY KEY,
    fail_count INT NOT NULL,
    first_failed_at VARCHAR(64) NOT NULL,
    updated_at VARCHAR(64) NOT NULL,
    blocked_until VARCHAR(64) NULL
  )`,
];

function mapSettingRow(row: SettingRow): StoredSettingRecord {
  return {
    key: row.setting_key,
    category: row.category,
    storedValue: row.stored_value,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

function mapAuditRow(row: AuditRow): StoredAuditRecord {
  return {
    id: row.id,
    settingKey: row.setting_key,
    category: row.category,
    changedAt: row.changed_at,
    adminIdentity: row.admin_identity,
  };
}

function mapSessionRow(row: SessionRow): StoredSessionRecord {
  return {
    sessionIdHash: row.session_id_hash,
    adminEmail: row.admin_email,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    lastSeenAt: row.last_seen_at,
  };
}

function mapAdminCredentialRow(row: AdminCredentialRow): StoredAdminCredentialRecord {
  return {
    adminEmail: row.admin_email,
    passwordHash: row.password_hash,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

function mapLoginAttemptRow(row: LoginAttemptRow): StoredLoginAttemptRecord {
  return {
    scopeKey: row.scope_key,
    failCount: row.fail_count,
    firstFailedAt: row.first_failed_at,
    updatedAt: row.updated_at,
    blockedUntil: row.blocked_until,
  };
}

class SqliteManagedConfigStore implements ManagedConfigStore {
  readonly summary: PersistenceSummary;

  private readonly database: DatabaseSync;

  constructor(filePath: string) {
    mkdirSync(path.dirname(filePath), { recursive: true });
    this.database = new DatabaseSync(filePath);
    this.database.exec(SQLITE_SCHEMA);
    this.summary = {
      engine: "sqlite",
      detail: `SQLite file at ${filePath}`,
    };
  }

  async listSettings() {
    const rows = this.database
      .prepare("SELECT setting_key, category, stored_value, updated_at, updated_by FROM wideorder_managed_settings ORDER BY setting_key")
      .all() as SettingRow[];

    return rows.map(mapSettingRow);
  }

  async getSetting(key: ManagedSettingKey) {
    const row = this.database
      .prepare("SELECT setting_key, category, stored_value, updated_at, updated_by FROM wideorder_managed_settings WHERE setting_key = ?")
      .get(key) as SettingRow | undefined;

    return row ? mapSettingRow(row) : null;
  }

  async upsertSetting(record: StoredSettingRecord) {
    this.database
      .prepare(
        `INSERT INTO wideorder_managed_settings (setting_key, category, stored_value, updated_at, updated_by)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(setting_key) DO UPDATE SET
           category = excluded.category,
           stored_value = excluded.stored_value,
           updated_at = excluded.updated_at,
           updated_by = excluded.updated_by`,
      )
      .run(record.key, record.category, record.storedValue, record.updatedAt, record.updatedBy);
  }

  async getAdminCredential(adminEmail: string) {
    const row = this.database
      .prepare("SELECT admin_email, password_hash, updated_at, updated_by FROM wideorder_admin_credentials WHERE admin_email = ?")
      .get(adminEmail) as AdminCredentialRow | undefined;

    return row ? mapAdminCredentialRow(row) : null;
  }

  async upsertAdminCredential(record: StoredAdminCredentialRecord) {
    this.database
      .prepare(
        `INSERT INTO wideorder_admin_credentials (admin_email, password_hash, updated_at, updated_by)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(admin_email) DO UPDATE SET
           password_hash = excluded.password_hash,
           updated_at = excluded.updated_at,
           updated_by = excluded.updated_by`,
      )
      .run(record.adminEmail, record.passwordHash, record.updatedAt, record.updatedBy);
  }

  async deleteAdminCredential(adminEmail: string) {
    this.database.prepare("DELETE FROM wideorder_admin_credentials WHERE admin_email = ?").run(adminEmail);
  }

  async appendAudit(record: StoredAuditRecord) {
    this.database
      .prepare(
        "INSERT INTO wideorder_managed_settings_audit (id, setting_key, category, changed_at, admin_identity) VALUES (?, ?, ?, ?, ?)",
      )
      .run(record.id, record.settingKey, record.category, record.changedAt, record.adminIdentity);
  }

  async listAuditEntries(limit: number) {
    const rows = this.database
      .prepare(
        "SELECT id, setting_key, category, changed_at, admin_identity FROM wideorder_managed_settings_audit ORDER BY changed_at DESC LIMIT ?",
      )
      .all(limit) as AuditRow[];

    return rows.map(mapAuditRow);
  }

  async purgeExpiredSessions(nowIso: string) {
    this.database.prepare("DELETE FROM wideorder_admin_sessions WHERE expires_at <= ?").run(nowIso);
  }

  async getSession(sessionIdHash: string) {
    const row = this.database
      .prepare(
        "SELECT session_id_hash, admin_email, created_at, expires_at, last_seen_at FROM wideorder_admin_sessions WHERE session_id_hash = ?",
      )
      .get(sessionIdHash) as SessionRow | undefined;

    return row ? mapSessionRow(row) : null;
  }

  async upsertSession(record: StoredSessionRecord) {
    this.database
      .prepare(
        `INSERT INTO wideorder_admin_sessions (session_id_hash, admin_email, created_at, expires_at, last_seen_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(session_id_hash) DO UPDATE SET
           admin_email = excluded.admin_email,
           created_at = excluded.created_at,
           expires_at = excluded.expires_at,
           last_seen_at = excluded.last_seen_at`,
      )
      .run(record.sessionIdHash, record.adminEmail, record.createdAt, record.expiresAt, record.lastSeenAt);
  }

  async touchSession(sessionIdHash: string, lastSeenAt: string) {
    this.database.prepare("UPDATE wideorder_admin_sessions SET last_seen_at = ? WHERE session_id_hash = ?").run(lastSeenAt, sessionIdHash);
  }

  async deleteSession(sessionIdHash: string) {
    this.database.prepare("DELETE FROM wideorder_admin_sessions WHERE session_id_hash = ?").run(sessionIdHash);
  }

  async deleteSessionsForAdmin(adminEmail: string) {
    this.database.prepare("DELETE FROM wideorder_admin_sessions WHERE admin_email = ?").run(adminEmail);
  }

  async getLoginAttempt(scopeKey: string) {
    const row = this.database
      .prepare(
        "SELECT scope_key, fail_count, first_failed_at, updated_at, blocked_until FROM wideorder_admin_login_attempts WHERE scope_key = ?",
      )
      .get(scopeKey) as LoginAttemptRow | undefined;

    return row ? mapLoginAttemptRow(row) : null;
  }

  async upsertLoginAttempt(record: StoredLoginAttemptRecord) {
    this.database
      .prepare(
        `INSERT INTO wideorder_admin_login_attempts (scope_key, fail_count, first_failed_at, updated_at, blocked_until)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(scope_key) DO UPDATE SET
           fail_count = excluded.fail_count,
           first_failed_at = excluded.first_failed_at,
           updated_at = excluded.updated_at,
           blocked_until = excluded.blocked_until`,
      )
      .run(record.scopeKey, record.failCount, record.firstFailedAt, record.updatedAt, record.blockedUntil);
  }

  async deleteLoginAttempt(scopeKey: string) {
    this.database.prepare("DELETE FROM wideorder_admin_login_attempts WHERE scope_key = ?").run(scopeKey);
  }
}

class MysqlManagedConfigStore implements ManagedConfigStore {
  readonly summary: PersistenceSummary;

  constructor(private readonly pool: Pool, detail: string) {
    this.summary = {
      engine: "mysql",
      detail,
    };
  }

  async listSettings() {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      "SELECT setting_key, category, stored_value, updated_at, updated_by FROM wideorder_managed_settings ORDER BY setting_key",
    );

    return rows.map((row) => mapSettingRow(row as unknown as SettingRow));
  }

  async getSetting(key: ManagedSettingKey) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      "SELECT setting_key, category, stored_value, updated_at, updated_by FROM wideorder_managed_settings WHERE setting_key = ? LIMIT 1",
      [key],
    );

    return rows[0] ? mapSettingRow(rows[0] as unknown as SettingRow) : null;
  }

  async upsertSetting(record: StoredSettingRecord) {
    await this.pool.query(
      `INSERT INTO wideorder_managed_settings (setting_key, category, stored_value, updated_at, updated_by)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         category = VALUES(category),
         stored_value = VALUES(stored_value),
         updated_at = VALUES(updated_at),
         updated_by = VALUES(updated_by)`,
      [record.key, record.category, record.storedValue, record.updatedAt, record.updatedBy],
    );
  }

  async getAdminCredential(adminEmail: string) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      "SELECT admin_email, password_hash, updated_at, updated_by FROM wideorder_admin_credentials WHERE admin_email = ? LIMIT 1",
      [adminEmail],
    );

    return rows[0] ? mapAdminCredentialRow(rows[0] as unknown as AdminCredentialRow) : null;
  }

  async upsertAdminCredential(record: StoredAdminCredentialRecord) {
    await this.pool.query(
      `INSERT INTO wideorder_admin_credentials (admin_email, password_hash, updated_at, updated_by)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         password_hash = VALUES(password_hash),
         updated_at = VALUES(updated_at),
         updated_by = VALUES(updated_by)`,
      [record.adminEmail, record.passwordHash, record.updatedAt, record.updatedBy],
    );
  }

  async deleteAdminCredential(adminEmail: string) {
    await this.pool.query("DELETE FROM wideorder_admin_credentials WHERE admin_email = ?", [adminEmail]);
  }

  async appendAudit(record: StoredAuditRecord) {
    await this.pool.query(
      "INSERT INTO wideorder_managed_settings_audit (id, setting_key, category, changed_at, admin_identity) VALUES (?, ?, ?, ?, ?)",
      [record.id, record.settingKey, record.category, record.changedAt, record.adminIdentity],
    );
  }

  async listAuditEntries(limit: number) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      "SELECT id, setting_key, category, changed_at, admin_identity FROM wideorder_managed_settings_audit ORDER BY changed_at DESC LIMIT ?",
      [limit],
    );

    return rows.map((row) => mapAuditRow(row as unknown as AuditRow));
  }

  async purgeExpiredSessions(nowIso: string) {
    await this.pool.query("DELETE FROM wideorder_admin_sessions WHERE expires_at <= ?", [nowIso]);
  }

  async getSession(sessionIdHash: string) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT session_id_hash, admin_email, created_at, expires_at, last_seen_at
       FROM wideorder_admin_sessions
       WHERE session_id_hash = ?
       LIMIT 1`,
      [sessionIdHash],
    );

    return rows[0] ? mapSessionRow(rows[0] as unknown as SessionRow) : null;
  }

  async upsertSession(record: StoredSessionRecord) {
    await this.pool.query(
      `INSERT INTO wideorder_admin_sessions (session_id_hash, admin_email, created_at, expires_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         admin_email = VALUES(admin_email),
         created_at = VALUES(created_at),
         expires_at = VALUES(expires_at),
         last_seen_at = VALUES(last_seen_at)`,
      [record.sessionIdHash, record.adminEmail, record.createdAt, record.expiresAt, record.lastSeenAt],
    );
  }

  async touchSession(sessionIdHash: string, lastSeenAt: string) {
    await this.pool.query("UPDATE wideorder_admin_sessions SET last_seen_at = ? WHERE session_id_hash = ?", [lastSeenAt, sessionIdHash]);
  }

  async deleteSession(sessionIdHash: string) {
    await this.pool.query("DELETE FROM wideorder_admin_sessions WHERE session_id_hash = ?", [sessionIdHash]);
  }

  async deleteSessionsForAdmin(adminEmail: string) {
    await this.pool.query("DELETE FROM wideorder_admin_sessions WHERE admin_email = ?", [adminEmail]);
  }

  async getLoginAttempt(scopeKey: string) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT scope_key, fail_count, first_failed_at, updated_at, blocked_until
       FROM wideorder_admin_login_attempts
       WHERE scope_key = ?
       LIMIT 1`,
      [scopeKey],
    );

    return rows[0] ? mapLoginAttemptRow(rows[0] as unknown as LoginAttemptRow) : null;
  }

  async upsertLoginAttempt(record: StoredLoginAttemptRecord) {
    await this.pool.query(
      `INSERT INTO wideorder_admin_login_attempts (scope_key, fail_count, first_failed_at, updated_at, blocked_until)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         fail_count = VALUES(fail_count),
         first_failed_at = VALUES(first_failed_at),
         updated_at = VALUES(updated_at),
         blocked_until = VALUES(blocked_until)`,
      [record.scopeKey, record.failCount, record.firstFailedAt, record.updatedAt, record.blockedUntil],
    );
  }

  async deleteLoginAttempt(scopeKey: string) {
    await this.pool.query("DELETE FROM wideorder_admin_login_attempts WHERE scope_key = ?", [scopeKey]);
  }
}

function getMysqlPoolOptions(): { options: PoolOptions; detail: string } | null {
  const databaseUrl = process.env.WIDEORDER_DATABASE_URL?.trim() ?? "";

  if (databaseUrl) {
    return {
      options: {
        uri: databaseUrl,
        connectionLimit: 4,
        enableKeepAlive: true,
      },
      detail: "MySQL via WIDEORDER_DATABASE_URL",
    };
  }

  const host = process.env.MYSQL_HOST?.trim() ?? process.env.DB_HOST?.trim() ?? "";
  const database = process.env.MYSQL_DATABASE?.trim() ?? process.env.DB_NAME?.trim() ?? "";
  const user = process.env.MYSQL_USER?.trim() ?? process.env.DB_USER?.trim() ?? "";

  if (!host || !database || !user) {
    return null;
  }

  const password = process.env.MYSQL_PASSWORD ?? process.env.DB_PASSWORD ?? "";
  const portText = process.env.MYSQL_PORT?.trim() ?? process.env.DB_PORT?.trim() ?? "3306";
  const port = Number.parseInt(portText, 10);

  return {
    options: {
      host,
      database,
      user,
      password,
      port: Number.isInteger(port) && port > 0 ? port : 3306,
      connectionLimit: 4,
      enableKeepAlive: true,
    },
    detail: "MySQL via MYSQL_* / DB_* bootstrap environment variables",
  };
}

async function createMysqlStore() {
  const mysqlConfig = getMysqlPoolOptions();

  if (!mysqlConfig) {
    return null;
  }

  const pool = createPool(mysqlConfig.options);

  for (const statement of MYSQL_SCHEMA) {
    await pool.query(statement);
  }

  return new MysqlManagedConfigStore(pool, mysqlConfig.detail);
}

function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}

let storePromise: Promise<ManagedConfigStore> | null = null;

export async function getManagedConfigStore() {
  if (!storePromise) {
    storePromise = (async () => {
      const mysqlStore = await createMysqlStore();

      if (mysqlStore) {
        return mysqlStore;
      }

      if (isProductionRuntime()) {
        throw new Error("production_managed_config_requires_mysql");
      }

      const sqlitePath =
        process.env.WIDEORDER_LOCAL_CONFIG_DB_PATH?.trim() || path.join(process.cwd(), ".data", "wideorder-managed-config.sqlite");

      return new SqliteManagedConfigStore(sqlitePath);
    })();
  }

  return storePromise;
}
