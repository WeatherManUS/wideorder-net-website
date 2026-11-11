"use client";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import type { accessView } from "@/lib/access/webauthn";
import { LocalTime } from "./local-time";
type View = Awaited<ReturnType<typeof accessView>>;
const messages: Record<string, string> = {
  remove_bootstrap_before_cutover: "Remove the bootstrap password hash from Hostinger only after both passkeys have been tested, then return here to finish cutover.",
  backup_not_ready: "Keep two tested independent credentials, including a device-bound authenticator. Add and test a replacement before revoking a required backup.",
  fresh_login_required: "Sign in again, then begin enrollment within five minutes.",
  fresh_verification_required: "Verify a passkey again before this change.",
  rate_limited: "Too many authentication requests. Wait five minutes before trying again.",
  verification_failed: "Verification failed. Use the named passkey when testing a specific credential, then try again.",
  recovery_rejected: "The recovery authorization was not accepted or has expired. Contact your authorized infrastructure operator.",
  unauthenticated: "Your session has expired. Sign in again.",
  origin_rejected: "Open administration at https://wideorder.net. Passkeys require the exact approved origin.",
};
async function request(input: Record<string, unknown>) {
  const response = await fetch("/api/admin/access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  const result = await response.json();
  if (!response.ok) throw new Error(messages[result.error] || "The security operation was not completed. Reload and try again; no fallback login was attempted.");
  return result;
}
export async function verifyAccess(action?: string) {
  const options = await request({ operation: "options", purpose: action ? "verify" : "login", action });
  const response = await startAuthentication({ optionsJSON: options.options });
  return request({ operation: "verify", ceremonyId: options.ceremonyId, response });
}
function errorText(error: unknown) { return error instanceof Error && error.name === "Error" ? error.message : "Passkey operation cancelled or unavailable. No change was confirmed."; }

export function PasskeyLogin() {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  return <div className="admin-form"><button type="button" className="button button--primary" disabled={busy} onClick={async () => {
    setBusy(true); setMessage(""); try { const result = await verifyAccess(); window.location.assign(result.redirect || "/admin/settings"); } catch (error) { setMessage(errorText(error)); setBusy(false); }
  }}>{busy ? "Verifying…" : "Sign in with a passkey"}</button><p role="status">{message}</p></div>;
}

export function SensitiveAdminForm({ children, action, grant, required, className }: { children: ReactNode; action: string; grant: string; required: boolean; className?: string }) {
  const ready = useRef(false);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    if (ready.current || !required) return;
    event.preventDefault(); if (busy) return;
    const form = event.currentTarget, submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    setBusy(true); setMessage("");
    try { await verifyAccess(grant); ready.current = true; form.requestSubmit(submitter || undefined); }
    catch (error) { setMessage(errorText(error)); setBusy(false); }
  }
  return <form method="post" action={action} className={className} onSubmit={submit} aria-busy={busy}>{children}<p role="status">{message || (busy ? "Verifying access…" : "")}</p></form>;
}

export function RecoveryLogin() {
  const [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  return <form className="admin-form" onSubmit={async event => { event.preventDefault(); const form = event.currentTarget; setBusy(true); try { const result = await request({ operation: "redeem_recovery", token: String(new FormData(form).get("token") || "") }); form.reset(); window.location.assign(result.redirect); } catch (error) { form.reset(); setMessage(errorText(error)); setBusy(false); } }}>
    <label className="admin-field"><span>One-time infrastructure recovery authorization</span><input name="token" type="password" autoComplete="off" maxLength={100} required /></label>
    <button className="button button--primary" disabled={busy}>Begin restricted recovery</button><p role="status">{message}</p>
  </form>;
}

export function SecurityAccess({ view }: { view: View }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const active = view.credentials.filter(key => !key.revokedAt);
  async function run(operation: () => Promise<void>) { setBusy(true); setMessage(""); try { await operation(); router.refresh(); } catch (error) { setMessage(errorText(error)); } finally { setBusy(false); } }
  return <section id="security-access" className="admin-section">
    <h2>Security &amp; Access</h2>
    <p className="admin-copy">Mode: <strong>{view.mode === "transitional" ? "Enrollment in progress — password login remains enabled" : view.mode === "passkey" ? "Passkey-only login" : view.mode === "cutover" ? "Cutover needs completion — password login is disabled" : "Restricted infrastructure recovery"}</strong>.</p>
    <p className="admin-copy">One administrator, multiple passkeys. Your device verifies your PIN or biometric locally; WideOrder never receives biometric data. Device names and recovery groups are your labels, not verified device identities.</p>
    <p role="status" className={message ? "admin-alert" : undefined}>{message}</p>
    <fieldset disabled={busy} style={{ border: 0, padding: 0, minWidth: 0 }}>
      <h3>Registered passkeys</h3>
      {!active.length && <p>No active passkeys. Register your first passkey within five minutes of signing in.</p>}
      {view.credentials.map(key => <article key={key.ref} className="admin-section">
        <h4>{key.name}{key.revokedAt ? " — revoked" : ""}</h4>
        <p>Recovery group: {key.recoveryGroup}. {key.deviceType === "multiDevice" ? "Backup-eligible / sync-capable" : "Device-bound (reported by authenticator)"}; {key.backedUp ? "reported backed up" : "not reported backed up"}.</p>
        <p>Registered <LocalTime value={key.createdAt} />. Last used <LocalTime value={key.lastUsedAt} />. {key.testedAt ? "Authentication tested." : "Authentication test required."}</p>
        {!key.revokedAt && <>
          <button type="button" className="button button--secondary" onClick={() => void run(async () => { await verifyAccess(`test:${key.ref}`); setMessage(`${key.name} authentication verified.`); })}>Test {key.name}</button>
          <form className="admin-form" onSubmit={event => { event.preventDefault(); const name = String(new FormData(event.currentTarget).get("name")); void run(async () => { await verifyAccess(`rename:${key.ref}`); await request({ operation: "manage", action: "rename", ref: key.ref, name }); setMessage("Passkey renamed."); }); }}>
            <label className="admin-field"><span>Rename {key.name}</span><input name="name" defaultValue={key.name} maxLength={80} required /></label><button className="button button--secondary">Save passkey name</button>
          </form>
          <button type="button" className="button button--secondary" onClick={() => { if (!window.confirm(`Revoke ${key.name}? Sessions authenticated with it will also be revoked.`)) return; void run(async () => { await verifyAccess(`revoke:${key.ref}`); await request({ operation: "manage", action: "revoke", ref: key.ref }); setMessage("Passkey and associated sessions revoked."); }); }}>Revoke {key.name}</button>
        </>}
      </article>)}
      <h3>Add passkey</h3>
      <form className="admin-form" onSubmit={event => { event.preventDefault(); const form = event.currentTarget, data = new FormData(form); void run(async () => {
        if (active.length) await verifyAccess("register");
        const options = await request({ operation: "options", purpose: "register", name: String(data.get("name")), recoveryGroup: String(data.get("recoveryGroup")) });
        const response = await startRegistration({ optionsJSON: options.options });
        await request({ operation: "verify", ceremonyId: options.ceremonyId, response });
        form.reset(); setMessage("Passkey registered. Use its Test button and select that credential to verify it before cutover.");
      }); }}>
        <label className="admin-field"><span>Passkey name</span><input name="name" maxLength={80} required placeholder="Office laptop or backup hardware key" /></label>
        <label className="admin-field"><span>Independent recovery group</span><input name="recoveryGroup" maxLength={80} required placeholder="Apple account, Google account, or separately stored key" /></label>
        <p className="admin-copy">Use the same group for credentials depending on the same provider account. A synced copy is not an independent backup. Keep a device-bound backup separately secured.</p>
        <button className="button button--primary">Add passkey</button>
      </form>
      <h3>Recovery readiness</h3>
      <p>{view.backupReady ? "Two tested recovery groups and a device-bound credential are recorded. Your independence confirmation is still required at cutover." : "Before cutover: test two credentials in independent recovery groups, including at least one device-bound authenticator."}</p>
      <details><summary>Review loss and recovery procedure</summary>
        <ul><li>Lost phone, laptop or key: sign in with the independent backup, revoke the lost credential and its sessions, then add and test a replacement. Add the replacement first if revocation would leave fewer than two viable credentials.</li>
          <li>Compromised sync provider: use a separately controlled device-bound backup, revoke every credential in the compromised provider group, revoke other sessions, and replace affected credentials.</li>
          <li>Total loss: an authorized operator must use separately authenticated hosting and database access, record your manual authorization, and run the documented offline recovery command. It revokes existing credentials/sessions and issues a short-lived one-time enrollment authorization. Email, SMS and the old password cannot authorize recovery.</li>
          <li>Recovery access permits enrollment only. Register and test two new independent authenticators before explicitly returning to passkey-only mode. Keep the hosting/database recovery account protected by its own MFA and recovery material stored offline.</li>
        </ul><p>Operator runbook: docs/PASSKEY_SECURITY.md in the repository. Review this process and secure your infrastructure recovery access before cutover.</p>
      </details>
      {view.mode !== "passkey" && <form className="admin-form" onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); void run(async () => { await verifyAccess("cutover"); const result = await request({ operation: "manage", action: "cutover", independentConfirmed: data.get("independent") === "on", recoveryReviewed: data.get("recovery") === "on", confirm: String(data.get("confirm")) }); window.location.assign(result.redirect); }); }}>
        <h3>Enable passkey-only login</h3>
        {view.bootstrapPresent && <p className="admin-alert">After testing both passkeys, remove WIDEORDER_ADMIN_PASSWORD_HASH from Hostinger. Cutover is blocked while that bootstrap password is configured. Passkey login remains available during the transition.</p>}
        <label><input type="checkbox" name="independent" required /> I have tested both credentials and confirmed that their recovery does not depend on the same provider account or lost device.</label>
        <label><input type="checkbox" name="recovery" required /> I reviewed total-loss recovery and secured separate MFA-protected hosting/database recovery access.</label>
        <label className="admin-field"><span>Type ENABLE PASSKEY ONLY</span><input name="confirm" required autoComplete="off" /></label>
        <button className="button button--primary" disabled={!view.backupReady || view.bootstrapPresent}>Confirm passkey-only cutover</button>
        <p>All sessions will end. Sign in with a passkey from a fresh browser session afterward. Password login will not return automatically after an error.</p>
      </form>}
      {!view.recoveryOnly && <><h3>Active sessions</h3><p>Sessions expire after 12 hours or 30 minutes idle. Browser/device labels are approximate and are not device fingerprints.</p>
        {view.sessions.map(session => <p key={session.id}>{session.current ? "Current — " : ""}{session.label} ({session.method}). Signed in <LocalTime value={session.createdAt} />; last active <LocalTime value={session.lastSeenAt} />; expires <LocalTime value={session.expiresAt} />.</p>)}
        <button type="button" className="button button--secondary" disabled={!active.length} onClick={() => void run(async () => { await verifyAccess("sessions"); await request({ operation: "manage", action: "revoke_sessions" }); setMessage("All other sessions revoked."); })}>Revoke all other sessions</button></>}
    </fieldset>
    <h3>Recent security activity</h3><p>Append-only application events: most recent 1,000 or 365 days, whichever is shorter. Infrastructure operators can modify the database; it is not tamper-proof against database administrators.</p>
    {view.events.map(event => <p key={event.id}><LocalTime value={event.at} /> — {event.type.replaceAll("_", " ")}: {event.result}</p>)}
  </section>;
}
