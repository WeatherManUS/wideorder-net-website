import { PageShell, SectionLabel } from "@/components/site-shell";
import { TrackingPreferencesButton } from "@/components/marketing-runtime";
import { buildPageMetadata, getContactMailtoHref } from "@/config/site";

export const metadata = buildPageMetadata({ title: "Privacy and Tracking Choices", description: "How WideOrder handles contact information, optional analytics, advertising measurement, and your tracking choices.", path: "/privacy" });

export default function PrivacyPage() {
  return <PageShell>
    <section className="site-section"><div className="container container--wide privacy-copy">
      <SectionLabel>Privacy information</SectionLabel>
      <h1 className="section-title">Your information. Your choices.</h1>
      <p>WideOrder uses the information you send through its contact form or email to respond to your inquiry and handle the related business conversation. Contact details and message content are not included in general website analytics events.</p>
      <h2>Essential website services</h2>
      <p>Hosting, security, spam prevention, and message delivery support the website and contact process. The form uses Cloudflare Turnstile for abuse checks and Resend for transactional message delivery. Administrative sign-in uses essential session cookies. Your selected website theme is saved in your browser.</p>
      <h2>Optional measurement</h2>
      <p>Optional analytics and advertising are disabled unless configured by WideOrder and permitted by your choices. Supported providers include Google Analytics, Google Tag Manager, Google Ads, LinkedIn, Meta, and X. When enabled, these services may receive technical connection information such as an IP address and device information under their own privacy terms.</p>
      <p>Analytics measures visits, case-study engagement, and successfully submitted inquiries. Advertising measurement connects permitted campaign activity to conversions. Clicking an email link or another call to action is not treated as a successful inquiry or a qualified lead.</p>
      <p>With advertising permission, configured platforms may read their campaign click identifiers from an advertising link. WideOrder does not copy those identifiers into its general event payloads or contact emails.</p>
      <h2>Consent and browser signals</h2>
      <p>No optional tags load before permission. You can reject optional tracking and continue using the website. Global Privacy Control keeps advertising off; Do Not Track also keeps analytics off. Your choice is saved locally for up to 180 days. Changing or withdrawing permission takes effect immediately; withdrawal reloads the page to unload optional scripts.</p>
      <TrackingPreferencesButton />
      <h2>Campaign attribution</h2>
      <p>With analytics permission, approved campaign labels from the address bar can be saved in session storage. First touch is the first permitted source in the current session. Last touch is the most recent permitted tagged campaign in that session. The record expires after 30 minutes of inactivity or when the browser session ends. It is cleared when analytics permission is withdrawn. It does not identify you across devices.</p>
      <p>A successful form submission can be connected to those labels using a random reference. That reference is separate from your contact details. Attribution is not embedded in the emails we send. Unsubmitted form content is not sent to general analytics.</p>
      <h2>Retention and privacy requests</h2>
      <p>Inquiry correspondence is retained as needed to respond and maintain the related business records. Hosting and security providers may maintain operational records. Contact WideOrder to ask about retention, access, correction, or deletion relating to your inquiry. Provider-side records and essential business or security obligations may have different retention requirements.</p>
      <p><a href={getContactMailtoHref("WideOrder privacy request")}>Contact WideOrder about privacy</a>. You can also clear browser storage and cookies using your browser settings.</p>
    </div></section>
  </PageShell>;
}
