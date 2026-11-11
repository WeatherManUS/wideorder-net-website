# Phase 0.3 security validation

Target: v0.3.0001, following production v0.2.0003. Infrastructure deployment is transitional; owner enrollment and physical-device validation remain pending.

## Local results, November 11, 2026

- 73 server/unit/integration tests passed, including access-state concurrency, challenge/session binding, expiry, cutover guards, infrastructure recovery, inquiry durability/retries, SMTP TLS acceptance semantics and release identity.
- 20 Chromium WebAuthn scenario groups passed with real signatures from virtual authenticators: primary/synced and independent device-bound backup registration; wrong registration origin; invalid challenge/origin/RP/UV/signature/ownership; unknown/revoked credentials; concurrent replay; step-up; rename/revoke; safe recovery prerequisites; explicit cutover; password API disabled; fresh login using both authenticators; Settings/SMTP controls; session rotation, idle timeout, other-session revocation and logout.
- Total-loss recovery passed separately: infrastructure authorization, one-time redemption, restricted enrollment, blocked Settings/SMTP, two new tested keys, explicit cutover and fresh passkey login.
- Existing inquiry/admin browser suite passed: login/logout, CSRF/authorization, masked SMTP settings, SSRF validation, isolated contact capture, replay rejection, durable diagnostics and protected inquiry details. No real email sent.
- 48 mobile-menu combinations passed: 320, 360, 375, 390, 430 and 768 pixels; portrait/landscape; all four themes. Generated 72 rendered screenshots; reviewed representative images in all four themes, including narrow portrait and short landscape scrolling. Keyboard, touch, Escape/focus return, outside dismissal and link-selection closure passed.
- Eight keyboard/touch case-study comparisons and the featured comparison passed without browser errors.
- Eight consent/tracking scenario groups, 40 theme/viewport checks and 11-route social metadata/image checks passed. Vendor requests and contact submissions were intercepted locally.
- Production dependency audit: zero reported vulnerabilities.
- Security & Access rendered screenshot reviewed; labels, safe credential metadata, recovery status, sessions, local-time/time-zone activity and controls visible.

Commands and fixture setup are in [PASSKEY_SECURITY.md](../PASSKEY_SECURITY.md). Local artifacts remain under ignored `.release/`; no fixture credentials or private authenticator material are committed. The test harness uses OS temporary databases to avoid hot reloads on fixture writes.

## Verification boundaries

Automated WebAuthn tests do not establish physical Windows Hello, Android, Apple or hardware-key compatibility for the owner. Production private settings, passkey counts and infrastructure recovery execution require authorized owner access. Real inbox delivery is not tested by these fixtures. SMTP acceptance remains distinct from inbox delivery.

Production version, timestamp, exact commit, initial-HTML footers, routes and indexing must be independently checked after deployment; this document alone is not deployment evidence. Do not claim passwordless migration complete before owner enrollment, backup testing and explicit cutover.
