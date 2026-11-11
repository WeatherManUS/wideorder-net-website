import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { hashAdminPassword } from "../src/lib/managed-config/crypto.ts";
mkdirSync(new URL("../.release/", import.meta.url), { recursive: true });
const password = `Qa-${randomUUID()}!`;
writeFileSync(new URL("../.release/inquiry-qa-credentials.json", import.meta.url), JSON.stringify({ password }));
const env = { ...process.env, NODE_ENV: "development", RELEASE_ENVIRONMENT: "development", WIDEORDER_DATABASE_URL: "", MYSQL_HOST: "", DB_HOST: "",
 WIDEORDER_LOCAL_CONFIG_DB_PATH: new URL(`../.release/inquiry-qa-${randomUUID()}.sqlite`, import.meta.url).pathname.replace(/^\/(?=[A-Za-z]:)/, ""), WIDEORDER_CONFIG_ENCRYPTION_KEY: randomUUID(), WIDEORDER_ADMIN_PASSWORD_HASH: hashAdminPassword(password),
 SMTP_HOST: "smtp.hostinger.com", SMTP_PORT: "465", SMTP_SECURE: "true", SMTP_AUTH: "true", SMTP_USER: "", SMTP_PASSWORD: "", SMTP_FROM_EMAIL: "", SMTP_RECIPIENT: "", SMTP_FROM_NAME: "WideOrder", SMTP_ACKNOWLEDGMENT: "false",
 NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA", TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA" };
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--port", "3105"], { env, stdio: "inherit" });
process.on("SIGINT", () => child.kill());
