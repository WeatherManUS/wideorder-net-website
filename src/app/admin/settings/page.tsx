import Link from "next/link";
import { currentRelease } from "@/lib/release/server";
import { getSmtpConfig, type AdminSettingView } from "@/lib/managed-config/service";
import { validateSmtpConfig, allowedSmtpHosts } from "@/lib/smtp/config";
import { recentInquiries } from "@/lib/inquiries/store";
import { SiteFooter } from "@/components/site-shell";
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";

import { getAuthenticatedAdminFromCookies, getAdminCredentialSummary } from "@/lib/managed-config/admin";
import { getAdminSettingViews, getPersistenceSummary, getRecentAuditViews } from "@/lib/managed-config/service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "WideOrder Admin Settings",
  robots: {
    index: false,
    follow: false,
  },
};

type SettingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const statusMessages: Record<string, string> = {
  saved: "Settings were saved.",
  connection_verified: "SMTP connection, TLS and configured authentication succeeded. This does not prove email delivery.",
  test_accepted: "The SMTP server accepted the test email for the saved notification recipient. Check that mailbox to confirm arrival.",
  queue_processed: "Due notifications were processed. Review the queue status below.",
  retry_scheduled: "A retry was scheduled for this inquiry.",
};

const errorMessages: Record<string, string> = {
  smtp_not_configured: "SMTP not configured. Save the sender, recipient and required credentials first.",
  smtp_test_failed: "SMTP test failed. Check the saved host, TLS mode, account credentials and provider settings. No successful delivery is asserted.",
  rate_limited: "Too many SMTP operations. Wait a minute and try again.",
  retry_blocked: "This inquiry cannot be automatically retried. For uncertain delivery, check the recipient mailbox before taking further action.",
  invalid_setting: "One or more submitted settings were invalid.",
  unauthenticated: "Please sign in to continue.",
  csrf: "This settings request was rejected. Reload and try again.",
  current_password_required: "Enter the current administrator password.",
  new_password_required: "Enter a new administrator password.",
  current_password_invalid: "The current administrator password was not accepted.",
  password_strength: "Use 12-128 characters and include at least three of: lowercase, uppercase, number, symbol.",
  password_confirmation_mismatch: "The new password confirmation does not match.",
  password_reuse: "Choose a password different from the current password.",
  bootstrap_missing: "Bootstrap recovery credentials are not configured yet.",
};

export default async function AdminSettingsPage({ searchParams }: SettingsPageProps) {
  noStore();

  let admin;

  try {
    admin = await getAuthenticatedAdminFromCookies();
  } catch {
    redirect("/admin/login?error=service_unavailable");
  }

  if (!admin) {
    redirect("/admin/login?error=unauthenticated");
  }

  let views;
  let auditEntries;
  let persistence;
  let credentialSummary;

  try {
    [views, auditEntries, persistence, credentialSummary] = await Promise.all([
      getAdminSettingViews(),
      getRecentAuditViews(),
      getPersistenceSummary(),
      getAdminCredentialSummary(),
    ]);
  } catch {
    redirect("/admin/login?error=service_unavailable");
  }

  const smtpViews = views.filter(view => view.key.startsWith("SMTP_"));
  const websiteViews = views.filter(view => ["NEXT_PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"].includes(view.key));
  const config = await getSmtpConfig();
  let smtpReady = false;
  try { smtpReady = validateSmtpConfig(config, false); } catch { /* Invalid saved host remains unavailable. */ }
  const release = await currentRelease();
  const inquiries = await recentInquiries();
  const params = (await searchParams) ?? {};
  const statusKey = typeof params.status === "string" ? params.status : "";
  const errorKey = typeof params.error === "string" ? params.error : "";
  const statusMessage = statusMessages[statusKey] ?? "";
  const errorMessage = errorMessages[errorKey] ?? "";
  const passwordHeading = credentialSummary.hasManagedPassword ? "Change administrator password" : "Initialize managed administrator password";
  const passwordCopy = credentialSummary.hasManagedPassword
    ? "Changing the managed password invalidates every active administrator session and requires a fresh sign-in."
    : "Set the persistent administrator password now so routine admin access no longer depends on the bootstrap environment hash.";

  return (
    <>
    <main className="admin-shell">
      <div className="admin-card">
        <div className="admin-header-row">
          <div>
            <p className="admin-eyebrow">WideOrder internal administration</p>
            <h1>Operational settings</h1>
            <p className="admin-copy">Public settings can be reviewed directly. Secret fields only accept replacements and never re-display stored values.</p>
          </div>
          <form method="post" action="/api/admin/logout">
            <button className="button button--secondary admin-button" type="submit">
              Sign out
            </button>
          </form>
        </div>

        <dl className="admin-summary admin-summary--grid">
          <div>
            <dt>Signed in as</dt>
            <dd>{admin.email}</dd>
          </div>
          <div>
            <dt>Session expires</dt>
            <dd>{new Date(admin.expiresAt).toLocaleString()}</dd>
          </div>
          <div>
            <dt>Persistence</dt>
            <dd>{persistence.engine}</dd>
          </div>
          <div>
            <dt>Storage detail</dt>
            <dd>{persistence.detail}</dd>
          </div>
          <div>
            <dt>Admin auth source</dt>
            <dd>{credentialSummary.effectiveSource}</dd>
          </div>
          <div>
            <dt>Bootstrap recovery hash</dt>
            <dd>{credentialSummary.bootstrapConfigured ? "Configured" : "Missing"}</dd>
          </div>
        </dl>

        {statusMessage ? <p className="admin-alert admin-alert--success">{statusMessage}</p> : null}
        {errorMessage ? <p className="admin-alert admin-alert--error">{errorMessage}</p> : null}

        <form className="admin-form admin-form--stacked" method="post" action="/api/admin/settings">
          <input type="hidden" name="action" value="save_settings" />
          <section className="admin-section">
            <h2>Email / SMTP</h2>
            <p className="admin-copy">{smtpReady ? "SMTP configured ? use the tests below to verify connection and acceptance." : "SMTP not configured"}</p>
            <p className="admin-copy">Hostinger defaults: smtp.hostinger.com, port 465, SSL/TLS, authentication enabled. Credentials and destination mailboxes are supplied by the administrator.</p>
            <p className="admin-copy">Allowed hosts: {allowedSmtpHosts().join(", ")}. Additional hosts require the server-managed WIDEORDER_SMTP_ALLOWED_HOSTS allowlist. Only SSL/TLS on 465 or STARTTLS on 587 is supported.</p>
            {smtpViews.map(view => <SettingField key={view.key} view={view} />)}
          </section>
          <section className="admin-section">
            <h2>Website configuration</h2>
            <p className="admin-copy">Abuse protection for the inquiry form. Test Turnstile keys remain in use until production credentials are supplied.</p>
            {websiteViews.map(view => <SettingField key={view.key} view={view} />)}
          </section>

          <div className="admin-actions">
            <button className="button button--primary admin-button" type="submit">
              Save settings
            </button>
          </div>
        </form>

        <section className="admin-section">
          <h2>SMTP tests</h2>
          <p className="admin-copy">Tests use saved settings. Test emails go only to the saved notification recipient.</p>
          <form method="post" action="/api/admin/smtp" className="admin-actions">
            <button className="button button--secondary" name="action" value="test_connection">Test connection</button>
            <button className="button button--secondary" name="action" value="send_test">Send test email</button>
          </form>
        </section>
        <section className="admin-section">
          <h2>Inquiry delivery queue</h2>
          <p className="admin-copy">Inquiries are encrypted in durable storage. Pending notifications retry every minute when due and configured. Accepted means SMTP acceptance, not confirmed inbox delivery. Uncertain delivery requires mailbox review and is not automatically resent.</p>
          <form method="post" action="/api/admin/smtp"><button className="button button--secondary" name="action" value="retry_queue">Process due notifications</button></form>
          <ul className="admin-audit-list">{inquiries.map(row => <li key={String(row.id)}>
            <Link href={`/admin/inquiries/${row.id}`}>{String(row.id)}</Link>
            <span>{String(row.created_at)}</span><span>{String(row.stage)}: {String(row.status)}</span>
            <span>{row.accepted_at ? "Internal notification accepted" : "Notification pending"}</span>
            {row.last_error ? <span>{String(row.last_error)}</span> : null}
            {row.status === "review" && ["temporary_rejection", "permanent_rejection", "connection_failed"].includes(String(row.last_error)) ?
              <form method="post" action="/api/admin/smtp"><input type="hidden" name="reference" value={String(row.id)} /><button className="button button--secondary" name="action" value="retry_inquiry">Retry notification</button></form> : null}
          </li>)}</ul>
          {!inquiries.length ? <p className="admin-copy">No inquiries received yet.</p> : null}
        </section>
        <section className="admin-section">
          <h2>Version and deployment information</h2>
          <p className="admin-copy">Version: {release.version}. Status: {"deploymentStatus" in release ? release.deploymentStatus : "development"}.</p>
          <p className="admin-copy">Published: {release.publishedAt ?? "Not confirmed"}. Build: {release.buildId}.</p>
          <p className="admin-copy">Artifact: {release.releaseId}.</p>
        </section>
        <section className="admin-section"><h2>Future integrations</h2><p className="admin-copy">Reserved for Phase 0.4. No integration controls are enabled here.</p></section>

        <section className="admin-section">
          <h2>{passwordHeading}</h2>
          <p className="admin-copy">{passwordCopy}</p>
          <dl className="admin-summary admin-summary--grid">
            <div>
              <dt>Managed password</dt>
              <dd>{credentialSummary.hasManagedPassword ? "Configured" : "Not initialized"}</dd>
            </div>
            <div>
              <dt>Last rotated</dt>
              <dd>{credentialSummary.passwordUpdatedAt ? new Date(credentialSummary.passwordUpdatedAt).toLocaleString() : "Not yet set"}</dd>
            </div>
            <div>
              <dt>Updated by</dt>
              <dd>{credentialSummary.passwordUpdatedBy ?? "Not yet set"}</dd>
            </div>
          </dl>
          <form className="admin-form admin-form--stacked" method="post" action="/api/admin/settings">
            <input type="hidden" name="action" value="change_password" />
            <label className="admin-field">
              <span>Current password</span>
              <input name="currentPassword" type="password" autoComplete="current-password" required />
            </label>
            <label className="admin-field">
              <span>New password</span>
              <input name="newPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
              <small>Use 12-128 characters and include at least three of lowercase, uppercase, number, and symbol.</small>
            </label>
            <label className="admin-field">
              <span>Confirm new password</span>
              <input name="confirmNewPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
            </label>
            <div className="admin-actions">
              <button className="button button--primary admin-button" type="submit">
                {credentialSummary.hasManagedPassword ? "Change password" : "Initialize password"}
              </button>
            </div>
          </form>
        </section>

        <section className="admin-section">
          <h2>Recent audit</h2>
          {auditEntries.length > 0 ? (
            <ul className="admin-audit-list">
              {auditEntries.map((entry) => (
                <li key={entry.id}>
                  <span>{entry.settingKey}</span>
                  <span>{entry.category}</span>
                  <span>{new Date(entry.changedAt).toLocaleString()}</span>
                  <span>{entry.adminIdentity}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-copy">No settings changes have been recorded yet.</p>
          )}
        </section>
      </div>
    </main>
    <SiteFooter utility />
    </>
  );
}

function SettingField({ view }: { view: AdminSettingView }) {
  const secret = view.category === "secret";
  return <label className="admin-field"><span>{view.label}</span>
    {view.inputKind === "boolean" ? <select name={view.key} defaultValue={view.value || "false"}>
      <option value="true">{view.key === "SMTP_SECURE" ? "SSL/TLS (465)" : "Enabled"}</option>
      <option value="false">{view.key === "SMTP_SECURE" ? "STARTTLS (587)" : "Disabled"}</option>
    </select> : <input name={view.key} type={view.inputKind === "password" ? "password" : view.inputKind === "number" ? "number" : view.inputKind === "email" ? "email" : "text"}
      defaultValue={secret ? "" : view.value || ""} autoComplete={secret ? "new-password" : "off"} maxLength={secret ? 4096 : 512} placeholder={secret ? "Leave blank to retain; enter a replacement" : undefined} />}
    <small>{view.description}</small>{secret ? <small>{view.configured ? "Credential configured" : "Credential not configured"}. Stored values are never displayed.</small> : null}
  </label>;
}
