import { SiteFooter } from "@/components/site-shell";
﻿import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";

import { getAuthenticatedAdminFromCookies, getAdminCredentialSummary } from "@/lib/managed-config/admin";
import { ADMIN_EMAIL } from "@/lib/managed-config/definitions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "WideOrder Admin Login",
  robots: {
    index: false,
    follow: false,
  },
};

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const statusMessages: Record<string, string> = {
  password_initialized: "Managed administrator password saved. Sign in again with the new password.",
  password_changed: "Administrator password changed. Sign in again with the new password.",
};

const errorMessages: Record<string, string> = {
  invalid_credentials: "The administrator password was not accepted.",
  throttled: "Too many invalid login attempts. Please wait and try again.",
  bootstrap_missing: "Bootstrap admin credentials are not configured yet.",
  service_unavailable: "Administrator access is unavailable until the managed configuration store is connected.",
  invalid_request: "A valid password is required.",
  csrf: "This login request was rejected. Reload and try again.",
  unauthenticated: "Please sign in to continue.",
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  noStore();

  let admin = null;
  let serviceUnavailable = false;

  try {
    admin = await getAuthenticatedAdminFromCookies();
  } catch {
    serviceUnavailable = true;
  }

  if (admin) {
    redirect("/admin/settings");
  }

  const params = (await searchParams) ?? {};
  const errorKey = typeof params.error === "string" ? params.error : "";
  const statusKey = typeof params.status === "string" ? params.status : "";
  const credentialSummary = serviceUnavailable
    ? {
        bootstrapConfigured: false,
        hasManagedPassword: false,
        effectiveSource: "missing",
      }
    : await getAdminCredentialSummary().catch(() => {
        serviceUnavailable = true;
        return {
          bootstrapConfigured: false,
          hasManagedPassword: false,
          effectiveSource: "missing",
        } as const;
      });
  const errorMessage = errorMessages[errorKey] ?? (serviceUnavailable ? errorMessages.service_unavailable : "");
  const statusMessage = statusMessages[statusKey] ?? "";
  const loginReady = !serviceUnavailable && (credentialSummary.hasManagedPassword || credentialSummary.bootstrapConfigured);

  return (
    <>
    <main className="admin-shell">
      <div className="admin-card admin-card--narrow">
        <p className="admin-eyebrow">WideOrder internal administration</p>
        <h1>Admin login</h1>
        <p className="admin-copy">This private route is reserved for the approved business administrator.</p>
        <dl className="admin-summary">
          <div>
            <dt>Administrator</dt>
            <dd>{ADMIN_EMAIL}</dd>
          </div>
          <div>
            <dt>Managed password</dt>
            <dd>{credentialSummary.hasManagedPassword ? "Configured" : "Not initialized"}</dd>
          </div>
          <div>
            <dt>Bootstrap recovery</dt>
            <dd>{credentialSummary.bootstrapConfigured ? "Configured" : "Missing WIDEORDER_ADMIN_PASSWORD_HASH"}</dd>
          </div>
          <div>
            <dt>Current login source</dt>
            <dd>{credentialSummary.effectiveSource}</dd>
          </div>
        </dl>
        {statusMessage ? <p className="admin-alert admin-alert--success">{statusMessage}</p> : null}
        {errorMessage ? <p className="admin-alert admin-alert--error">{errorMessage}</p> : null}
        <form className="admin-form" method="post" action="/api/admin/login">
          <label className="admin-field">
            <span>Password</span>
            <input name="password" type="password" autoComplete="current-password" required disabled={!loginReady} />
          </label>
          <button className="button button--primary admin-button" type="submit" disabled={!loginReady}>
            Sign in
          </button>
        </form>
      </div>
    </main>
    <SiteFooter utility />
    </>
  );
}
