import { randomUUID } from "node:crypto";
import { validateSmtpConfig, type SmtpConfig } from "../smtp/config.ts";
import { createSmtpTransport, smtpFailure } from "../smtp/transport.ts";
import { recordMailEventSafely } from "./diagnostics.ts";

export async function runSmtpTest(config: SmtpConfig, operation: "connection_test" | "test_email", createTransport = createSmtpTransport) {
  try {
    if (!validateSmtpConfig(config, false)) {
      await recordMailEventSafely({ operation, outcome: "failed", code: "smtp_not_configured" });
      return { key: "smtp_not_configured", error: true };
    }
  } catch {
    await recordMailEventSafely({ operation, outcome: "failed", code: "smtp_configuration_invalid" });
    return { key: "smtp_test_failed", error: true };
  }
  let transport: Awaited<ReturnType<typeof createSmtpTransport>> | undefined;
  let sending = false;
  await recordMailEventSafely({ operation, outcome: "started", recipient: config.recipient });
  try {
    transport = await createTransport(config);
    if (operation === "connection_test") {
      await transport.verify();
      await recordMailEventSafely({ operation, outcome: "verified" });
      return { key: "connection_verified", error: false };
    }
    sending = true;
    const result = await transport.sendMail({ from: { name: config.fromName || "WideOrder", address: config.from }, to: { address: config.recipient },
      envelope: { from: config.from, to: [config.recipient] }, subject: "WideOrder SMTP test",
      text: `Administrator-requested SMTP test. Reference: ${randomUUID()}. Check this mailbox to confirm arrival.`,
      html: "<p>Administrator-requested WideOrder SMTP test.</p><p>Receiving this message confirms arrival in this mailbox.</p>" });
    if (!result.accepted?.some(value => value.toLowerCase() === config.recipient.toLowerCase())) throw Object.assign(new Error("not_accepted"), { responseCode: 450 });
    await recordMailEventSafely({ operation, outcome: "accepted", recipient: config.recipient, response: result.response });
    return { key: "test_accepted", error: false };
  } catch (error) {
    const code = sending ? smtpFailure(error).code : "connection_failed";
    await recordMailEventSafely({ operation, outcome: "failed", code, error, recipient: config.recipient });
    return { key: "smtp_test_failed", error: true };
  } finally { transport?.close(); }
}
