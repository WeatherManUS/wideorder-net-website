"use client";

import type { TrackingConfig } from "@/config/marketing";
import { ATTRIBUTION_KEY, CAMPAIGN_KEYS, CONSENT_KEY, SESSION_TTL, googleCampaignFields, publicPageId, readCampaign, resolveConsent, sanitizeEvent, tagSafeLocation, type Campaign, type Consent, type EventParameters, type MarketingEvent } from "./model.ts";

type VendorFunction = (...args: unknown[]) => void;
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: VendorFunction;
    fbq?: VendorFunction & { queue?: unknown[][]; push?: VendorFunction; loaded?: boolean; version?: string; callMethod?: VendorFunction };
    _fbq?: Window["fbq"];
    lintrk?: VendorFunction & { q?: unknown[][] };
    _linkedin_partner_id?: string;
    _linkedin_data_partner_ids?: string[];
    twq?: VendorFunction & { queue?: unknown[][]; version?: string; exe?: VendorFunction };
  }
}
type Attribution = { first: Campaign; last: Campaign; updatedAt: number };
let config: TrackingConfig | null = null;
let lastPage = "";
let lastAdPage = "";
const loaded = new Set<string>();
const conversions = new Set<string>();
export const CONSENT_CHANGE = "wideorder-consent-change";
export const OPEN_PREFERENCES = "wideorder-open-preferences";

export function privacySignals() {
  return { gpc: (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true, dnt: navigator.doNotTrack === "1" };
}
export function getConsent(): Consent {
  try { return resolveConsent(JSON.parse(localStorage.getItem(CONSENT_KEY) ?? "null"), privacySignals()); }
  catch { return resolveConsent(null); }
}
function clearAttribution() {
  try { sessionStorage.removeItem(ATTRIBUTION_KEY); } catch { /* Optional storage. */ }
}
function clearLeadHistory() {
  try { sessionStorage.removeItem("wideorder-lead-events"); } catch { /* Optional storage. */ }
  conversions.clear();
}
function clearVendorCookies() {
  const names = document.cookie.split(";").map((cookie) => cookie.split("=")[0].trim()).filter((name) => /^(?:_ga|_gid|_gat|_gcl_|_fbp|_fbc|_li_|li_|_uet)/.test(name));
  for (const name of names) for (const domain of ["", location.hostname, `.${location.hostname}`]) {
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax${domain ? `; domain=${domain}` : ""}`;
  }
}
export function setConsent(analytics: boolean, marketing: boolean) {
  const previous = getConsent();
  const consent = resolveConsent({ version: 1, analytics, marketing, updatedAt: Date.now() }, privacySignals());
  try { localStorage.setItem(CONSENT_KEY, JSON.stringify(consent)); } catch { /* No storage means no persistent optional tracking. */ }
  if (!consent.analytics) clearAttribution();
  window.dispatchEvent(new Event(CONSENT_CHANGE));
  const revoked = (previous.analytics && !consent.analytics) || (previous.marketing && !consent.marketing);
  if (revoked) {
    clearLeadHistory();
    window.gtag?.("consent", "update", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    window.fbq?.("consent", "revoke");
    clearVendorCookies();
    // Reload unloads third-party code; merely removing script elements cannot stop it.
    location.reload();
  }
}

function captureAttribution(): Attribution | null {
  if (!getConsent().analytics) { clearAttribution(); return null; }
  try {
    const now = Date.now();
    const stored = JSON.parse(sessionStorage.getItem(ATTRIBUTION_KEY) ?? "null") as Attribution | null;
    const valid = stored && Number.isFinite(stored.updatedAt) && stored.updatedAt <= now && now - stored.updatedAt < SESSION_TTL;
    const campaign = readCampaign(location.search);
    const hasCampaign = Boolean(campaign.utm_source && campaign.utm_medium && campaign.utm_campaign);
    // Re-validate storage instead of trusting client-editable values.
    const clean = (value: Campaign) => readCampaign(new URLSearchParams(value).toString());
    const next: Attribution = {
      first: valid ? clean(stored.first) : hasCampaign ? campaign : { utm_source: "direct", utm_medium: "none" },
      last: hasCampaign ? campaign : valid ? clean(stored.last) : { utm_source: "direct", utm_medium: "none" }, updatedAt: now,
    };
    sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(next));
    return next;
  } catch { return null; }
}
function script(id: string, source: string) {
  if (loaded.has(id)) return;
  loaded.add(id);
  const node = document.createElement("script");
  node.id = `wideorder-${id}`;
  node.src = source;
  node.async = true;
  node.referrerPolicy = "no-referrer";
  node.onerror = () => { loaded.delete(id); node.remove(); };
  document.head.appendChild(node);
}
function canUseTags() {
  return Boolean(config?.enabled && tagSafeLocation(location.pathname, location.search, location.hash, getConsent().marketing));
}
function containerActive(consent: Consent) { return Boolean(config?.gtm && consent.analytics && consent.marketing); }
function safeReferrer() {
  try { const url = new URL(document.referrer); return ["https:", "http:"].includes(url.protocol) && url.origin !== location.origin ? url.origin : ""; }
  catch { return ""; }
}

function loadProviders() {
  if (!config || !canUseTags()) return;
  const consent = getConsent();
  if (!consent.analytics && !consent.marketing) return;
  if (config.gtm && !containerActive(consent)) return;
  const google = (consent.analytics && config.ga4) || (consent.marketing && config.googleAds);
  if (containerActive(consent) || google) {
    window.dataLayer ??= [];
    // gtag's documented queue contract uses an Arguments object, not an ordinary dataLayer event.
    // eslint-disable-next-line prefer-rest-params
    window.gtag ??= function () { window.dataLayer!.push(arguments); };
    window.gtag("consent", loaded.has("google") || loaded.has("gtm") ? "update" : "default", { analytics_storage: consent.analytics ? "granted" : "denied", ad_storage: consent.marketing ? "granted" : "denied", ad_user_data: consent.marketing ? "granted" : "denied", ad_personalization: "denied" });
    if (containerActive(consent)) {
      if (!loaded.has("gtm")) window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
      script("gtm", `https://www.googletagmanager.com/gtm.js?id=${config.gtm}`);
      return; // The reviewed container owns all providers; never double-install direct tags.
    }
    if (!loaded.has("google")) {
      window.gtag("js", new Date());
    }
    if (consent.analytics && config.ga4 && !loaded.has("ga4-config")) { window.gtag("config", config.ga4, { ...googleCampaignFields(captureAttribution()?.last ?? null), send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, page_location: `${location.origin}${location.pathname}`, page_referrer: safeReferrer() }); loaded.add("ga4-config"); }
    if (consent.marketing && config.googleAds && !loaded.has("ads-config")) { window.gtag("config", config.googleAds, { allow_ad_personalization_signals: false, page_location: `${location.origin}${location.pathname}`, page_referrer: "" }); loaded.add("ads-config"); }
    script("google", `https://www.googletagmanager.com/gtag/js?id=${google}`);
  }
  if (!consent.marketing) return;
  if (config.linkedin) {
    window._linkedin_partner_id = config.linkedin;
    window._linkedin_data_partner_ids = [config.linkedin];
    window.lintrk ??= Object.assign(function (...args: unknown[]) { window.lintrk!.q!.push(args); }, { q: [] as unknown[][] });
    script("linkedin", "https://snap.licdn.com/li.lms-analytics/insight.min.js");
  }
  if (config.meta) {
    if (!window.fbq) {
      const fbq = Object.assign(function (...args: unknown[]) {
        if (fbq.callMethod) fbq.callMethod(...args); else fbq.queue!.push(args);
      }, { queue: [] as unknown[][], loaded: true, version: "2.0", callMethod: undefined as VendorFunction | undefined, push: undefined as VendorFunction | undefined });
      fbq.push = fbq;
      window.fbq = window._fbq = fbq;
      fbq("set", "autoConfig", false, config.meta);
      fbq("init", config.meta);
    }
    script("meta", "https://connect.facebook.net/en_US/fbevents.js");
    if (lastAdPage !== location.pathname) { window.fbq?.("trackSingle", config.meta, "PageView"); lastAdPage = location.pathname; }
  }
  if (config.x) {
    if (!window.twq) {
      const twq = Object.assign(function (...args: unknown[]) {
        if (twq.exe) twq.exe(...args); else twq.queue.push(args);
      }, { queue: [] as unknown[][], version: "1.1", exe: undefined as VendorFunction | undefined });
      window.twq = twq;
      twq("config", config.x);
    }
    script("x", "https://static.ads-twitter.com/uwt.js");
  }
}

export function initializeMarketing(value: TrackingConfig) { config = value; loadProviders(); }
export function trackMarketingEvent(name: MarketingEvent, parameters: Record<string, unknown> = {}) {
  if (!canUseTags()) return false;
  const consent = getConsent();
  if (!consent.analytics && !(consent.marketing && name === "generate_lead")) return false;
  if (config?.gtm && !containerActive(consent)) return false;
  const attribution = captureAttribution();
  const data: EventParameters | null = sanitizeEvent(name, { page_id: location.pathname, ...parameters,
    ...(name === "generate_lead" && attribution ? {
      first_source: attribution.first.utm_source, first_medium: attribution.first.utm_medium, first_campaign: attribution.first.utm_campaign,
      last_source: attribution.last.utm_source, last_medium: attribution.last.utm_medium, last_campaign: attribution.last.utm_campaign, campaign_content: attribution.last.utm_content,
    } : {}),
    ...(name === "page_view" && attribution ? { campaign_source: attribution.last.utm_source, campaign_medium: attribution.last.utm_medium, campaign_id: attribution.last.utm_campaign, campaign_content: attribution.last.utm_content } : {}),
  });
  if (!data) return false;
  if (name === "generate_lead") {
    try { for (const id of JSON.parse(sessionStorage.getItem("wideorder-lead-events") ?? "[]")) if (typeof id === "string") conversions.add(id); } catch { /* Memory dedup still works. */ }
    if (conversions.has(data.lead_id)) return false;
    conversions.add(data.lead_id);
    try { sessionStorage.setItem("wideorder-lead-events", JSON.stringify([...conversions].slice(-100))); } catch { /* Memory fallback. */ }
  }
  loadProviders();
  if (containerActive(consent)) {
    window.dataLayer!.push({ event: name, ...data });
  } else {
    if (consent.analytics && config?.ga4) {
      const wireData = { ...data };
      delete wireData.campaign_id;
      window.gtag?.("event", name, { ...wireData, ...googleCampaignFields(attribution?.last ?? null), send_to: config.ga4, page_location: `${location.origin}${location.pathname}`, page_referrer: safeReferrer() });
    }
    if (consent.marketing && name === "generate_lead") {
      if (config?.meta) window.fbq?.("trackSingle", config.meta, "Lead", {}, { eventID: data.lead_id });
      if (config?.linkedin && config.linkedinLeadConversion) window.lintrk?.("track", { conversion_id: Number(config.linkedinLeadConversion), event_id: data.lead_id });
      if (config?.googleAds && config.googleAdsLabel) window.gtag?.("event", "conversion", { send_to: `${config.googleAds}/${config.googleAdsLabel}`, transaction_id: data.lead_id });
      if (config?.x && config.xLeadEvent) window.twq?.("event", config.xLeadEvent, { conversion_id: data.lead_id });
    }
  }
  return true;
}

export function trackPage() {
  if (!canUseTags() || !getConsent().analytics || lastPage === location.pathname) return;
  if (trackMarketingEvent("page_view")) lastPage = location.pathname;
}
export function forgetPage() { lastPage = ""; }
export function clearOnConsentLoss() {
  const consent = getConsent();
  if (!consent.analytics) { clearAttribution(); lastPage = ""; }
  if (!consent.analytics && !consent.marketing) clearLeadHistory();
}
export { CAMPAIGN_KEYS, publicPageId };
