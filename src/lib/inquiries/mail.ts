import type { Inquiry } from "./model.ts";
import type { SmtpConfig } from "../smtp/config.ts";
export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
export function inquiryMail(inquiry: Inquiry, config: SmtpConfig, acknowledgment = false) {
  const details = acknowledgment ? ["Thank you for contacting WideOrder. Your inquiry has been received.", `Reference: ${inquiry.reference}`, `Received: ${inquiry.submittedAt}`, "We will review your inquiry."] : [
    "WideOrder website inquiry", `Reference: ${inquiry.reference}`, `Submitted: ${inquiry.submittedAt}`,
    `Name: ${inquiry.contact.name}`, `Company: ${inquiry.contact.company || "Not provided"}`, `Email: ${inquiry.contact.email}`, `Phone: ${inquiry.contact.phone || "Not provided"}`,
    `Source page: ${inquiry.sourcePage}`, ...Object.entries(inquiry.campaign).map(([key, value]) => `${key}: ${value}`), "Business challenge:", inquiry.contact.message ];
  return { from: { name: config.fromName || "WideOrder", address: config.from },
    to: { address: acknowledgment ? inquiry.contact.email : config.recipient, name: acknowledgment ? inquiry.contact.name : "WideOrder" },
    replyTo: { address: acknowledgment ? config.recipient : inquiry.contact.email },
    envelope: { from: config.from, to: [acknowledgment ? inquiry.contact.email : config.recipient] },
    subject: `${acknowledgment ? "Your WideOrder inquiry" : "WideOrder website inquiry"} ? ${inquiry.reference}`,
    messageId: `<${inquiry.reference}.${acknowledgment ? "ack" : "internal"}@${config.from.split("@")[1]}>`,
    headers: { "X-WideOrder-Inquiry": inquiry.reference }, text: details.join("\n\n"),
    html: `<html><body><h1>${acknowledgment ? "Inquiry received" : "Website inquiry"}</h1>${details.map(line => `<p style="white-space:pre-wrap">${escapeHtml(line)}</p>`).join("")}<p>WideOrder<br>There is a better way.</p></body></html>` };
}
