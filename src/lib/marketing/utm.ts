import { CAMPAIGN_KEYS, campaignToken } from "./model.ts";

export type CampaignInput = { destination: string; source: string; medium: string; campaign: string; content?: string; term?: string };
export function buildCampaignUrl(input: CampaignInput) {
  const url = new URL(input.destination, "https://wideorder.net");
  if (url.protocol !== "https:" || url.username || url.password || url.hostname !== "wideorder.net" || url.port) throw new Error("Use an HTTPS WideOrder destination.");
  for (const key of url.searchParams.keys()) if (key.toLowerCase().startsWith("utm_") && !(CAMPAIGN_KEYS as readonly string[]).includes(key)) throw new Error(`Unsupported or incorrectly cased campaign key: ${key}`);
  const values = { utm_source: input.source, utm_medium: input.medium, utm_campaign: input.campaign, utm_content: input.content, utm_term: input.term };
  for (const key of CAMPAIGN_KEYS) {
    const value = values[key];
    const existing = url.searchParams.getAll(key);
    if (existing.length > 1 || (existing.length && value !== existing[0])) throw new Error(`Conflicting ${key}; remove the existing value or supply the same value.`);
    if (value) {
      if (!campaignToken(value)) throw new Error(`${key} must be a lowercase slug beginning with a letter (maximum 64 characters).`);
      url.searchParams.set(key, value);
    } else if (existing.length) throw new Error(`Unexpected existing ${key}; specify it explicitly.`);
  }
  return url.toString();
}
