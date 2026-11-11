import { resolve4 } from "node:dns/promises";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { publicIPv4, validateSmtpConfig, type SmtpConfig } from "./config.ts";

export async function createSmtpTransport(config: SmtpConfig) {
  validateSmtpConfig(config);
  const addresses = await Promise.race([resolve4(config.host), new Promise<never>((_, reject) => { const timer = setTimeout(() => reject(new Error("smtp_dns_timeout")), 5000); timer.unref(); })]);
  if (!addresses.length || addresses.some(ip => !publicIPv4(ip))) throw new Error("smtp_address_not_allowed");
  return nodemailer.createTransport(smtpTransportOptions(config, addresses[0]));
}
export function smtpTransportOptions(config: SmtpConfig, address: string): SMTPTransport.Options {
  return { host: address, port: config.port, secure: config.secure,
    requireTLS: !config.secure, tls: { servername: config.host, minVersion: "TLSv1.2", rejectUnauthorized: true },
    auth: config.auth ? { user: config.username, pass: config.password } : undefined,
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
    disableFileAccess: true, disableUrlAccess: true, logger: false, debug: false };
}

export function smtpFailure(error: unknown): { code: string; retry: boolean } {
  const e = error as { code?: string; command?: string; responseCode?: number };
  if (typeof e?.responseCode === "number") return { code: e.responseCode < 500 ? "temporary_rejection" : "permanent_rejection", retry: e.responseCode >= 400 && e.responseCode < 500 };
  if (["CONN", "EHLO", "STARTTLS", "AUTH", "MAIL FROM", "RCPT TO"].includes(e?.command || "")) return { code: "connection_failed", retry: e.code !== "EAUTH" };
  // With no definitive SMTP reply, DATA may have been accepted: never blindly resend.
  return { code: "delivery_uncertain", retry: false };
}
