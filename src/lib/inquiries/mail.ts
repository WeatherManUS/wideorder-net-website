import type { Inquiry } from "./model.ts";
import type { SmtpConfig } from "../smtp/config.ts";
export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
export function inquiryMail(inquiry: Inquiry, config: SmtpConfig, acknowledgment = false) {
  const received = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "short", timeZone: "America/Chicago" }).format(new Date(inquiry.submittedAt));
  const details = acknowledgment ? ["Thanks for getting in touch.", "We've received your message and will review it.", "If we need any additional information, we'll be in touch."] : [
    `Name: ${inquiry.contact.name}`, `Company: ${inquiry.contact.company || "Not provided"}`, `Email: ${inquiry.contact.email}`, `Phone: ${inquiry.contact.phone || "Not provided"}`,
    `Reference: ${inquiry.reference}`, `Submitted: ${received} (America/Chicago)`, `Source page: ${inquiry.sourcePage}`,
    ...Object.entries(inquiry.campaign).map(([key, value]) => `${key}: ${value}`), "Business challenge:", inquiry.contact.message ];
  const heading = acknowledgment ? "Thanks for getting in touch." : "A new business challenge";
  const body = (acknowledgment ? details.slice(1) : details).map(line => {
    if (!acknowledgment && line === "Business challenge:") return '<h2 style="margin:24px 0 16px;font-size:20px;color:#17242D">Business challenge</h2>';
    return `<p style="margin:0 0 16px;white-space:pre-wrap;overflow-wrap:anywhere;font-size:16px;line-height:1.6;color:#17242D">${escapeHtml(line)}</p>`;
  }).join("");
  return { from: { name: config.fromName || "WideOrder", address: config.from },
    to: { address: acknowledgment ? inquiry.contact.email : config.recipient, name: acknowledgment ? inquiry.contact.name : "WideOrder" },
    replyTo: { address: acknowledgment ? config.recipient : inquiry.contact.email },
    envelope: { from: config.from, to: [acknowledgment ? inquiry.contact.email : config.recipient] },
    subject: acknowledgment ? "Thanks for getting in touch with WideOrder" : `WideOrder website inquiry - ${inquiry.reference}`,
    messageId: `<${inquiry.reference}.${acknowledgment ? "ack" : "internal"}@${config.from.split("@")[1]}>`,
    headers: { "X-WideOrder-Inquiry": inquiry.reference }, text: [...details, "WideOrder", "There is a better way."].join("\n\n"),
    html: `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><meta charset="utf-8"><title>${heading}</title></head><body style="margin:0;padding:0;background:#F4F0E8;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F4F0E8"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#FFFFFF;border-top:5px solid #55734E"><tr><td style="padding:28px 24px 12px;font-size:24px;font-weight:bold;color:#17242D">WideOrder</td></tr><tr><td style="padding:12px 24px 24px"><h1 style="margin:0 0 24px;font-size:26px;line-height:1.25;color:#17242D">${heading}</h1>${body}</td></tr><tr><td style="padding:20px 24px;background:#E9E2D6;color:#4C5B64;font-size:14px">There is a better way.</td></tr></table></td></tr></table></body></html>` };
}
