# Native inquiries and SMTP operations

## Administrator setup

Use `/admin/settings` after signing in to the existing authorized administrator account. No public navigation entry is added. The existing bootstrap/managed scrypt password and persistent sessions remain in place. Session cookies are HttpOnly, SameSite=Strict and Secure in production; mutations and tests require trusted browser origins. Login attempts are persistently throttled.

Email / SMTP defaults: Hostinger, `smtp.hostinger.com`, port `465`, SSL/TLS, authentication enabled, display name `WideOrder`. New sender and notification recipient settings start blank; SMTP username/password fields never display stored credentials. Blank credential submissions retain existing values. Legacy SMTP settings, if already configured, are preserved; no legacy Resend sender/recipient is silently treated as approval to enable SMTP.

1. Enter the Hostinger username/password, verified domain sender and notification recipient; optionally enable customer acknowledgments.
2. Save settings. Credentials use AES-256-GCM with `WIDEORDER_CONFIG_ENCRYPTION_KEY`; setting batches and audit metadata commit together. Audit records contain setting names, never values.
3. Test connection. This verifies connectivity/TLS/authentication, **not message delivery**.
4. Send test email. It goes only to the saved recipient. SMTP acceptance is reported separately from inbox arrival; confirm arrival in the recipient mailbox.
5. Process due notifications or let the worker run. Inspect the queue and protected inquiry detail pages.

Port 587 requires STARTTLS; plaintext and certificate-validation bypass are not supported. Hosts are editable within the server-managed `WIDEORDER_SMTP_ALLOWED_HOSTS` comma-separated allowlist, defaulting to `smtp.hostinger.com`. Adding another provider requires trusted server configuration. Every connection resolves public IPv4 addresses, rejects private/special addresses and pins its chosen IP while retaining the hostname for certificate validation. SMTP tests are authenticated, origin-checked and rate-limited. No public relay exists.

## Receipt, acceptance and retries

`POST /api/contact` validates the five fields, same-origin submission, bounded request size, Turnstile, honeypot and request limits. The browser supplies a random idempotency key; a matching retry returns the existing inquiry reference without sending again. Keys and content fingerprints are HMAC-protected server-side. Form values remain in place on errors.

A valid inquiry is encrypted and stored in `wideorder_inquiries` in the existing production MySQL database **before** SMTP is attempted. Local development uses the existing SQLite adapter. No production SQLite fallback was introduced. The encrypted payload includes contact fields, timestamp, source path and consent-permitted campaign labels, but no challenge tokens, SMTP credentials or raw IP addresses. Request-limit keys use HMACs. Optional attribution is client-declared and sanitized; it is not trusted identity or authorization data.

The response distinguishes durable receipt (`202`, notification pending) from SMTP acceptance (`200`, notification accepted). Neither implies inbox delivery. Missing SMTP credentials leave inquiries pending. Missing spam-protection or persistence/encryption configuration fails clearly without a false receipt.

A Node runtime worker checks due rows every minute. Claims use a compare-and-swap lease shared across instances. Temporary SMTP rejections retry with exponential delays, up to five attempts. The authenticated Settings action can process due notifications and retry definite failures after configuration is corrected. Acknowledgments are a separate queue stage; a failed acknowledgment does not resend an accepted internal message. The setting must be enabled both at capture and send time.

SMTP cannot guarantee exactly-once inbox delivery. An ambiguous DATA timeout, a crash with an expired sending lease, or failure recording known acceptance is quarantined as `review`; it is not blindly resent. Check the destination mailbox using the stable inquiry/message reference before operator recovery. Pending work survives restarts; retries require the application process to run. No external cron, hosting or DNS setting is changed by this release.

Only authenticated administrators can view decrypted inquiries. Retention/deletion requests require authorized operational handling; there is no public inquiry lookup. Back up MySQL and the encryption key securely together. Losing or replacing the key without a migration makes existing encrypted records unreadable. Do not put either backup in Git.

## Testing

- `node --experimental-transform-types --import ./scripts/test-register.mjs --test src/lib/inquiries/inquiries.test.mjs src/lib/smtp/transport.test.mjs`
- The SMTP protocol fixture uses local TLS certificates and loopback servers to test implicit TLS, STARTTLS, connection verification and DATA acceptance/rejection. It does not connect to a Hostinger account.
- Start `node scripts/start-inquiry-qa.mjs`, then run `node scripts/inquiry-admin-qa.mjs` with `PLAYWRIGHT_MODULE_PATH` pointing to an existing Playwright installation. The audit exercises an isolated development server/database on port 3105 with ephemeral administrator credentials. It must not run against production.
- Existing release, appearance, marketing and case-study audits remain available. Live mailbox delivery must be reported pending until account credentials are configured and actual inbox arrival is checked.

The Turnstile test key is intentionally retained at the user's instruction. It does not establish real production abuse protection; replace it with production keys before formal launch.

## Production Turnstile verification

The contact widget uses action `contact`. The server requires a successful Siteverify response for that action and hostname `wideorder.net` or `www.wideorder.net`; localhost is accepted only outside production. Test-key responses (`example.com`, without an action) are intentionally rejected. Use mocked verifier responses in isolated tests, not a production bypass.

The existing managed Settings fields remain the credential destination. No credentials are embedded in source. Every request, including an idempotent retry, needs a fresh token. The browser resets its widget after each submission attempt. With a fresh valid token, repeating the same request key still returns the existing inquiry without sending a duplicate notification.

Release validation: lint, typecheck, production build and nine inquiry/Turnstile tests passed. Live real-token success and replay rejection must be verified after deployment; mocked tests do not establish that the saved widget secret matches the site key.
