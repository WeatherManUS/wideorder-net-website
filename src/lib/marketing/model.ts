export const EVENT_PARAMETERS = {
  page_view: ["page_id", "campaign_source", "campaign_medium", "campaign_id", "campaign_content"],
  case_study_view: ["page_id", "case_study_id", "interaction_type"],
  case_study_interaction: ["page_id", "case_study_id", "interaction_type"],
  cta_click: ["page_id", "cta_position", "interaction_type"],
  contact_start: ["page_id", "cta_position", "interaction_type"],
  generate_lead: ["page_id", "lead_id", "first_source", "first_medium", "first_campaign", "last_source", "last_medium", "last_campaign", "campaign_content"],
  social_outbound_click: ["page_id", "platform", "cta_position"],
  video_engagement: ["page_id", "content_id", "interaction_type"],
  resource_download: ["page_id", "content_id", "content_category"],
} as const;

export type MarketingEvent = keyof typeof EVENT_PARAMETERS;
export type EventParameters = Record<string, string>;
export const CAMPAIGN_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
export const CLICK_ID_KEYS = ["gclid", "dclid", "gbraid", "wbraid", "fbclid", "li_fat_id", "twclid", "msclkid"] as const;
export type Campaign = Partial<Record<(typeof CAMPAIGN_KEYS)[number], string>>;
export type Consent = { version: 1; analytics: boolean; marketing: boolean; updatedAt: number };
export const CONSENT_KEY = "wideorder-consent-v1";
export const CONSENT_TTL = 180 * 24 * 60 * 60 * 1000;
export const ATTRIBUTION_KEY = "wideorder-attribution-v1";
export const SESSION_TTL = 30 * 60 * 1000;
export const campaignToken = (value: unknown): value is string =>
  typeof value === "string" && /^[a-z][a-z0-9_-]{0,63}$/.test(value);

export function publicPageId(path: string) {
  if (["/", "/what-we-do", "/how-we-work", "/our-work", "/our-approach", "/contact", "/privacy"].includes(path)) return path;
  return /^\/our-work\/(retail-pricing|technology-deployment|remote-infrastructure-printing|month-end-reporting)$/.test(path) ? path : "other";
}

export function sanitizeEvent(name: string, parameters: Record<string, unknown>): EventParameters | null {
  if (!Object.prototype.hasOwnProperty.call(EVENT_PARAMETERS, name)) return null;
  const allowed = EVENT_PARAMETERS[name as MarketingEvent] as readonly string[];
  const result: EventParameters = {};
  for (const key of allowed) {
    const value = parameters[key];
    if (typeof value !== "string") continue;
    if (key === "page_id") { result[key] = publicPageId(value); continue; }
    if (key === "lead_id") {
      if (/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(value)) result[key] = value;
    } else if (campaignToken(value)) result[key] = value;
  }
  if (name === "generate_lead" && !result.lead_id) return null;
  return result;
}

export function resolveConsent(value: unknown, signals: { gpc?: boolean; dnt?: boolean } = {}, now = Date.now()): Consent {
  const denied: Consent = { version: 1, analytics: false, marketing: false, updatedAt: 0 };
  if (!value || typeof value !== "object") return denied;
  const record = value as Partial<Consent>;
  if (record.version !== 1 || typeof record.updatedAt !== "number" || !Number.isFinite(record.updatedAt) || record.updatedAt > now || now - record.updatedAt > CONSENT_TTL) return denied;
  return { version: 1, updatedAt: record.updatedAt, analytics: record.analytics === true && !signals.dnt,
    marketing: record.marketing === true && !signals.gpc && !signals.dnt };
}

export function readCampaign(search: string): Campaign {
  const params = new URLSearchParams(search);
  const campaign: Campaign = {};
  for (const key of CAMPAIGN_KEYS) {
    const values = params.getAll(key);
    if (values.length === 1 && campaignToken(values[0])) campaign[key] = values[0];
  }
  return campaign;
}

/** GA4 calls the utm_campaign initiative a campaign_name; campaign_id is reserved for utm_id. */
export function googleCampaignFields(campaign: Campaign | null): Record<string, string> {
  if (!campaign?.utm_campaign) return {};
  const mapping = { utm_source: "campaign_source", utm_medium: "campaign_medium", utm_campaign: "campaign_name", utm_content: "campaign_content", utm_term: "campaign_term" } as const;
  return Object.fromEntries(CAMPAIGN_KEYS.flatMap((key) => campaignToken(campaign[key]) ? [[mapping[key], campaign[key]!]] : []));
}

export function tagSafeLocation(path: string, search: string, hash: string, allowClickIds = false) {
  if (publicPageId(path) === "other") return false;
  const params = new URLSearchParams(search);
  for (const [key, value] of params) {
    if (allowClickIds && (CLICK_ID_KEYS as readonly string[]).includes(key) && /^[A-Za-z0-9_-]{8,300}$/.test(value) && params.getAll(key).length === 1) continue;
    if (!(CAMPAIGN_KEYS as readonly string[]).includes(key) || !campaignToken(value) || params.getAll(key).length !== 1) return false;
  }
  return !hash || /^#(retail-pricing|technology-deployment|remote-infrastructure-printing|month-end-reporting|main-content|top)$/.test(hash);
}
