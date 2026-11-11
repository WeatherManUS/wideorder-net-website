import { isIP } from "node:net";
export type SmtpConfig = { host: string; port: number; secure: boolean; auth: boolean; username: string; password: string; from: string; fromName: string; recipient: string; acknowledgment: boolean };
export const mailbox = (value: string) => value.length <= 254 && /^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/.test(value);
export function allowedSmtpHosts() { return (process.env.WIDEORDER_SMTP_ALLOWED_HOSTS || "smtp.hostinger.com").split(",").map(host => host.trim().toLowerCase()).filter(Boolean); }
export function validateSmtpConfig(c: SmtpConfig, requireReady = true) {
  if (!/^[a-z0-9.-]+$/i.test(c.host) || isIP(c.host) || !allowedSmtpHosts().includes(c.host.toLowerCase())) throw new Error("smtp_host_not_allowed");
  if (!((c.port === 465 && c.secure) || (c.port === 587 && !c.secure))) throw new Error("smtp_tls_port_invalid");
  if ((c.from && !mailbox(c.from)) || (c.recipient && !mailbox(c.recipient)) || /[\r\n\x00]/.test(c.fromName + c.username) || c.fromName.length > 120 || c.username.length > 254 || c.password.length > 4096) throw new Error("smtp_setting_invalid");
  const ready = Boolean(c.from && c.recipient && (!c.auth || (c.username && c.password)));
  if (requireReady && !ready) throw new Error("smtp_not_configured");
  return ready;
}
// Only ordinary public IPv4 addresses are used. Reject every private/special answer;
// pin the chosen address on the connection so a second DNS lookup cannot rebind it.
export function publicIPv4(ip: string) {
  if (isIP(ip) !== 4) return false;
  const [a, b] = ip.split(".").map(Number);
  return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && [0, 2, 168].includes(b)) || (a === 198 && [18, 19, 51].includes(b)) || (a === 203 && b === 0));
}
