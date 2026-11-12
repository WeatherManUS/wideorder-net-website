# Hardware-optional passkeys and restricted Hostinger recovery

Baseline: v0.3.0002. This is a Phase 0.3 security follow-up, before the Phase 0.4 branding work and owner-controlled cutover.

## Approved behavior

- Two tested credentials in genuinely independent recovery groups qualify, including two synced credentials. A device-bound credential or hardware key is optional. Authenticator backup flags remain accurately displayed.
- Restoring the bootstrap hash alone never restores ordinary password login after cutover.
- An explicitly configured one-hour-or-shorter Hostinger authorization window plus the corresponding password permits one restricted recovery redemption. It revokes old keys/sessions, preserves their records and security events, and grants replacement enrollment only.
- Both temporary recovery variables must be removed before explicit cutover. No production recovery settings are configured by the release.

## Validation

- 81 automated tests pass, including concurrent redemption, stale/expired/future windows, wrong credentials, missing confirmation, replay prevention, IP/account throttling, session expiry, blocked Settings/SMTP and cutover guards.
- Chromium Hostinger-recovery UI checks pass: password login remains disabled, failed password submission clears the input, successful recovery is restricted, replay fails, Settings/inquiries/SMTP are inaccessible, and logout invalidates the session. A narrow-screen rendered screenshot was reviewed.
- The passkey browser suite uses two simulated synced authenticators with real WebAuthn signatures to validate enrollment, explicit cutover, step-up, revocation and subsequent passkey-only login. The offline recovery alternative is exercised separately.
- Production metadata, route footers and anonymous access protections require independent checks after deployment. Virtual authenticators do not establish completion of the owner's physical-device cutover.

For local Hostinger browser tests, start `node --experimental-transform-types scripts/start-security-qa.mjs --host-recovery`, then run `node scripts/hostinger-recovery-qa.mjs` with `PLAYWRIGHT_MODULE_PATH` pointing to the installed Playwright module. Restart the launcher without that flag before the normal passkey/offline recovery suites. Fixtures use isolated temporary SQLite databases and must never target production.

The [operator runbook](../PASSKEY_SECURITY.md) includes exact Hostinger settings, time limits, cleanup, MFA responsibilities and the offline recovery alternative. The backup hash must be kept with a separately protected record of its corresponding password; a hash is not itself a usable login credential.
