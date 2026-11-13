import { SocialIcon } from "@/components/social-icon";
import type { socialPlatforms } from "@/lib/managed-config/social";
export type SocialProfile = { platform: typeof socialPlatforms[number]["platform"]; label: string; url: string };
export function SocialLinks({ profiles, className = "", label = "WideOrder social profiles", onNavigate }: { profiles: readonly SocialProfile[]; className?: string; label?: string; onNavigate?: () => void }) {
  if (!profiles.length) return null;
  return <nav aria-label={label} className={`social-links ${className}`}>
    {profiles.map(profile => <a key={profile.platform} href={profile.url} aria-label={`WideOrder on ${profile.label} (opens in a new tab)`} title={profile.label} data-social-platform={profile.platform} target="_blank" rel="noopener noreferrer" onClick={onNavigate}><SocialIcon platform={profile.platform} /></a>)}
  </nav>;
}
