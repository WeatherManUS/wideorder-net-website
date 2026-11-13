import type { socialPlatforms } from "@/lib/managed-config/social";
type Platform = typeof socialPlatforms[number]["platform"];
export function SocialIcon({ platform }: { platform: Platform }) {
  const paths: Record<Platform, React.ReactNode> = {
    linkedin: <><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 10v8m0-11v.1M11 18v-8m0 3c0-4 6-4 6 0v5" stroke="var(--color-surface)" strokeWidth="2.2" fill="none"/></>,
    facebook: <path d="M14 22v-9h3l.5-4H14V7c0-1.2.4-2 2-2h2V1h-3c-4 0-6 2.4-6 6v2H6v4h3v9z"/>,
    x: <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 5.5 22H2.3l8.2-9.4L.8 2h6.5l5.9 7.8L18.9 2Zm-1.1 18h1.7L6.3 4H4.5L17.8 20Z"/>,
    instagram: <g fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="6"/><circle cx="12" cy="12" r="4.5"/><circle cx="18" cy="6" r="1" fill="currentColor"/></g>,
    youtube: <><rect x="1" y="4" width="22" height="16" rx="5"/><path d="m10 8 7 4-7 4z" fill="var(--color-surface)"/></>,
  };
  return <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true" focusable="false">{paths[platform]}</svg>;
}
