export type TrackingConfig = {
  enabled: boolean;
  ga4: string; gtm: string; linkedin: string; meta: string; googleAds: string; googleAdsLabel: string; x: string; xLeadEvent: string;
  linkedinLeadConversion: string;
};

/** IDs are browser-public, but only explicitly enabled, validated IDs are returned. Never expose env wholesale. */
export function getTrackingConfig(env: NodeJS.ProcessEnv = process.env): TrackingConfig {
  const id = (key: string, pattern: RegExp) => env[`MARKETING_${key}_ENABLED`] === "true" && pattern.test(env[`MARKETING_${key}_ID`] ?? "") ? env[`MARKETING_${key}_ID`]! : "";
  const enabled = env.MARKETING_TRACKING_ENABLED === "true";
  const config = {
    enabled, ga4: id("GA4", /^G-[A-Z0-9]{4,20}$/), gtm: id("GTM", /^GTM-[A-Z0-9]{4,20}$/),
    linkedin: id("LINKEDIN", /^\d{3,20}$/), meta: id("META", /^\d{5,25}$/),
    googleAds: id("GOOGLE_ADS", /^AW-\d{5,20}$/), x: id("X", /^[a-z0-9]{3,20}$/),
    googleAdsLabel: /^[A-Za-z0-9_-]{3,80}$/.test(env.MARKETING_GOOGLE_ADS_LABEL ?? "") ? env.MARKETING_GOOGLE_ADS_LABEL! : "",
    linkedinLeadConversion: /^\d{3,20}$/.test(env.MARKETING_LINKEDIN_LEAD_CONVERSION ?? "") ? env.MARKETING_LINKEDIN_LEAD_CONVERSION! : "",
    xLeadEvent: /^tw-[a-z0-9]+-[a-z0-9]+$/.test(env.MARKETING_X_LEAD_EVENT ?? "") ? env.MARKETING_X_LEAD_EVENT! : "",
  };
  return enabled ? config : { enabled: false, ga4: "", gtm: "", linkedin: "", meta: "", googleAds: "", googleAdsLabel: "", x: "", xLeadEvent: "", linkedinLeadConversion: "" };
}

const SOCIAL_HOSTS = {
  linkedin: ["www.linkedin.com", "linkedin.com"], youtube: ["www.youtube.com", "youtube.com"],
  facebook: ["www.facebook.com", "facebook.com"], instagram: ["www.instagram.com", "instagram.com"], x: ["x.com", "www.x.com"],
} as const;
export type SocialPlatform = keyof typeof SOCIAL_HOSTS;
export function getSocialProfiles(env: NodeJS.ProcessEnv = process.env) {
  return Object.entries(SOCIAL_HOSTS).flatMap(([platform, hosts]) => {
    if (env[`SOCIAL_${platform.toUpperCase()}_VERIFIED`] !== "true") return [];
    try {
      const url = new URL(env[`SOCIAL_${platform.toUpperCase()}_URL`] ?? "");
      if (url.protocol !== "https:" || !(hosts as readonly string[]).includes(url.hostname) || url.username || url.password || url.port || url.pathname.length < 2 || url.search || url.hash) return [];
      return [{ platform: platform as SocialPlatform, url: url.toString() }];
    } catch { return []; }
  });
}
