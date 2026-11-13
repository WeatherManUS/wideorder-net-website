export const socialPlatforms = [
  { key: "SOCIAL_LINKEDIN_URL", platform: "linkedin", label: "LinkedIn", hosts: ["linkedin.com", "www.linkedin.com"], path: /^\/(?:in|company|school|showcase)\/[A-Za-z0-9_%.-]+\/?$/ },
  { key: "SOCIAL_FACEBOOK_URL", platform: "facebook", label: "Facebook", hosts: ["facebook.com", "www.facebook.com"], path: /^\/(?:[A-Za-z0-9._-]+|people\/[A-Za-z0-9_%.-]+\/\d+)\/?$/ },
  { key: "SOCIAL_X_URL", platform: "x", label: "X", hosts: ["x.com", "www.x.com", "twitter.com", "www.twitter.com"], path: /^\/[A-Za-z0-9_]{1,15}\/?$/ },
  { key: "SOCIAL_INSTAGRAM_URL", platform: "instagram", label: "Instagram", hosts: ["instagram.com", "www.instagram.com"], path: /^\/[A-Za-z0-9._]+\/?$/ },
  { key: "SOCIAL_YOUTUBE_URL", platform: "youtube", label: "YouTube", hosts: ["youtube.com", "www.youtube.com"], path: /^\/(?:@[A-Za-z0-9_%.-]+|(?:channel|c|user)\/[A-Za-z0-9_%.-]+)\/?$/ },
] as const;
export type SocialSettingKey = typeof socialPlatforms[number]["key"];
export function normalizeSocialUrl(key: string, value: string) {
  const entry = socialPlatforms.find(item => item.key === key);
  if (!entry) throw new Error("invalid_social_platform");
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.length > 512 || /[\s\\\x00-\x1f\x7f]/.test(trimmed) || !/^https:\/\//i.test(trimmed)) throw new Error("invalid_social_url");
  const url = new URL(trimmed);
  const decodedPath = decodeURIComponent(url.pathname);
  if (/[\x00-\x1f\x7f\\]/.test(decodedPath)) throw new Error("invalid_social_url");
  const facebookId = entry.platform === "facebook" && url.pathname === "/profile.php" && /^\?id=\d+$/.test(url.search);
  if (url.protocol !== "https:" || !(entry.hosts as readonly string[]).includes(url.hostname) || url.port || url.username || url.password || url.hash || (!facebookId && url.search) || !entry.path.test(url.pathname) || /%(?:0[0-9a-f]|1[0-9a-f]|7f|2f|5c)/i.test(url.pathname)) throw new Error("invalid_social_url");
  return url.href;
}
