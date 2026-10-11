import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const ENCRYPTION_PREFIX = "v1";
const AES_ALGORITHM = "aes-256-gcm";
const IV_BYTE_LENGTH = 12;
const AUTH_TAG_BYTE_LENGTH = 16;
const PASSWORD_HASH_ALGORITHM = "scrypt";
const PASSWORD_HASH_N = 32768;
const PASSWORD_HASH_R = 8;
const PASSWORD_HASH_P = 3;
const PASSWORD_HASH_KEY_LENGTH = 64;
const PASSWORD_SALT_BYTE_LENGTH = 16;
const PASSWORD_HASH_MAX_MEMORY = 64 * 1024 * 1024;

type ParsedPasswordHash = {
  n: number;
  r: number;
  p: number;
  maxmem?: number;
  salt: Buffer;
  derivedKey: Buffer;
};

function parseScryptHash(encodedHash: string): ParsedPasswordHash {
  const parts = encodedHash.split("$");

  if (parts.length !== 6 && parts.length !== 7) {
    throw new Error("invalid_admin_password_hash_format");
  }

  const [algorithm, nValue, rValue, pValue, maxmemOrSalt, saltOrDerivedKey, maybeDerivedKey] = parts;

  if (algorithm !== PASSWORD_HASH_ALGORITHM || !nValue || !rValue || !pValue || !maxmemOrSalt || !saltOrDerivedKey) {
    throw new Error("invalid_admin_password_hash_format");
  }

  const n = Number.parseInt(nValue, 10);
  const r = Number.parseInt(rValue, 10);
  const p = Number.parseInt(pValue, 10);

  if (!Number.isInteger(n) || n <= 1 || !Number.isInteger(r) || r <= 0 || !Number.isInteger(p) || p <= 0) {
    throw new Error("invalid_admin_password_hash_format");
  }

  if (maybeDerivedKey) {
    const maxmem = Number.parseInt(maxmemOrSalt, 10);

    if (!Number.isInteger(maxmem) || maxmem <= 0) {
      throw new Error("invalid_admin_password_hash_format");
    }

    return {
      n,
      r,
      p,
      maxmem,
      salt: Buffer.from(saltOrDerivedKey, "base64url"),
      derivedKey: Buffer.from(maybeDerivedKey, "base64url"),
    };
  }

  return {
    n,
    r,
    p,
    salt: Buffer.from(maxmemOrSalt, "base64url"),
    derivedKey: Buffer.from(saltOrDerivedKey, "base64url"),
  };
}

function deriveMasterKey(secret: string) {
  return createHash("sha256").update(secret).digest();
}

function getMasterKey() {
  const secret = process.env.WIDEORDER_CONFIG_ENCRYPTION_KEY?.trim() ?? "";

  if (!secret) {
    throw new Error("missing_config_encryption_key");
  }

  return deriveMasterKey(secret);
}

export function encryptSecretValue(value: string) {
  const iv = randomBytes(IV_BYTE_LENGTH);
  const cipher = createCipheriv(AES_ALGORITHM, getMasterKey(), iv, { authTagLength: AUTH_TAG_BYTE_LENGTH });
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    ENCRYPTION_PREFIX,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(":");
}

export function decryptSecretValue(payload: string) {
  const [prefix, ivPart, authTagPart, ciphertextPart] = payload.split(":");

  if (prefix !== ENCRYPTION_PREFIX || !ivPart || !authTagPart || !ciphertextPart) {
    throw new Error("invalid_encrypted_value");
  }

  const decipher = createDecipheriv(AES_ALGORITHM, getMasterKey(), Buffer.from(ivPart, "base64url"), {
    authTagLength: AUTH_TAG_BYTE_LENGTH,
  });

  decipher.setAuthTag(Buffer.from(authTagPart, "base64url"));

  return Buffer.concat([decipher.update(Buffer.from(ciphertextPart, "base64url")), decipher.final()]).toString("utf8");
}

export function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function hashAdminPassword(password: string) {
  const salt = randomBytes(PASSWORD_SALT_BYTE_LENGTH);
  const derivedKey = scryptSync(password, salt, PASSWORD_HASH_KEY_LENGTH, {
    N: PASSWORD_HASH_N,
    r: PASSWORD_HASH_R,
    p: PASSWORD_HASH_P,
    maxmem: PASSWORD_HASH_MAX_MEMORY,
  });

  return [
    PASSWORD_HASH_ALGORITHM,
    String(PASSWORD_HASH_N),
    String(PASSWORD_HASH_R),
    String(PASSWORD_HASH_P),
    String(PASSWORD_HASH_MAX_MEMORY),
    salt.toString("base64url"),
    derivedKey.toString("base64url"),
  ].join("$");
}

export function verifyAdminPassword(password: string, encodedHash: string) {
  const parsedHash = parseScryptHash(encodedHash);
  const derivedKey = scryptSync(password, parsedHash.salt, parsedHash.derivedKey.length, {
    N: parsedHash.n,
    r: parsedHash.r,
    p: parsedHash.p,
    ...(parsedHash.maxmem ? { maxmem: parsedHash.maxmem } : {}),
  });

  return derivedKey.length === parsedHash.derivedKey.length && timingSafeEqual(derivedKey, parsedHash.derivedKey);
}
