import { SiteFooter } from "@/components/site-shell";
﻿import type { Metadata } from "next";
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
};

const errorMessages: Record<string, string> = {
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

  const publicViews = views.filter((view) => view.category === "public");
  const secretViews = views.filter((view) => view.category === "secret");
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
            <h2>Public settings</h2>
            {publicViews.map((view) => (
              <label key={view.key} className="admin-field">
                <span>{view.label}</span>
                {view.inputKind === "boolean" ? (
                  <select name={view.key} defaultValue={view.value ?? "false"}>
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                ) : (
                  <input
                    name={view.key}
                    type={view.inputKind === "number" ? "number" : view.inputKind === "email" ? "email" : "text"}
                    defaultValue={view.value ?? ""}
                    required={view.required}
                  />
                )}
                <small>{view.description}</small>
                <small>Source: {view.source}</small>
              </label>
            ))}
          </section>

          <section className="admin-section">
            <h2>Secret settings</h2>
            {secretViews.map((view) => (
              <label key={view.key} className="admin-field">
                <span>{view.label}</span>
                <input name={view.key} type="password" autoComplete="new-password" placeholder="Enter a replacement value" />
                <small>{view.description}</small>
                <small>Configured: {view.configured ? "Yes" : "No"} | Source: {view.source}</small>
              </label>
            ))}
          </section>

          <div className="admin-actions">
            <button className="button button--primary admin-button" type="submit">
              Save settings
            </button>
          </div>
        </form>

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
