"use client";
import { useSyncExternalStore } from "react";
const subscribe = () => () => {};

export function LocalTime({ value }: { value: unknown }) {
  const browser = useSyncExternalStore(subscribe, () => true, () => false);
  if (typeof value !== "string" || !value || Number.isNaN(Date.parse(value))) return <>Not recorded</>;
  const date = new Date(value);
  const formatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "long", ...(browser ? {} : { timeZone: "America/Chicago" }) });
  return <time dateTime={date.toISOString()} title={`UTC: ${date.toISOString()} | Display zone: ${formatter.resolvedOptions().timeZone}`}>{formatter.format(date)}</time>;
}
