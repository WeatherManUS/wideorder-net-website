import { utcTimestamp } from "./metadata.ts";

export const FOOTER_TIME_ZONE = "America/Chicago";
export function footerVersionEnabled(env: NodeJS.ProcessEnv = process.env) { return env.SHOW_FOOTER_VERSION !== "false"; }
export function copyrightYear(now = new Date()) {
  return new Intl.DateTimeFormat("en-US", { timeZone: FOOTER_TIME_ZONE, year: "numeric" }).format(now);
}
export function formatPublicationTime(value: string | null) {
  if (!utcTimestamp(value)) return null;
  const date = new Date(value);
  const day = new Intl.DateTimeFormat("en-US", { timeZone: FOOTER_TIME_ZONE, month: "short", day: "numeric", year: "numeric" }).format(date);
  const time = new Intl.DateTimeFormat("en-US", { timeZone: FOOTER_TIME_ZONE, hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(date);
  return `${day} at ${time}`;
}
