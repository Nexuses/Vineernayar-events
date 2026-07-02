import { EVENT_TIMEZONE } from "@/lib/date-utils";
import { isMailConfigured, sendAppMail } from "@/lib/mail";
import { SMTP_REPLY_EMAIL } from "@/lib/smtp";

export type ContactEmailPayload = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

function getNotifyRecipients(): string[] {
  const raw = process.env.CONTACT_NOTIFY_EMAIL || process.env.JOIN_NOTIFY_EMAIL || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatSubmittedAt(date = new Date()): string {
  return date.toLocaleString("en-IN", {
    timeZone: EVENT_TIMEZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function isContactEmailConfigured(): boolean {
  return isMailConfigured() && getNotifyRecipients().length > 0;
}

export async function sendContactEmails(
  payload: ContactEmailPayload
): Promise<{ ok: boolean; error?: string }> {
  if (!isMailConfigured()) {
    return {
      ok: false,
      error: "Email is not configured. Please try again later.",
    };
  }

  const notifyTo = getNotifyRecipients();
  if (notifyTo.length === 0) {
    return {
      ok: false,
      error: "Contact notifications are not configured. Please try again later.",
    };
  }

  const submittedAt = formatSubmittedAt();

  const notifyText = [
    "New contact message — Humans First",
    "",
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Phone: ${payload.phone}`,
    `Submitted: ${submittedAt}`,
    "",
    "Message:",
    payload.message,
  ].join("\n");

  const notifyHtml = `
    <p>A new message came in from the <strong>Contact Us</strong> form.</p>
    <p><strong>Name:</strong> ${escapeHtml(payload.name)}<br/>
    <strong>Email:</strong> ${escapeHtml(payload.email)}<br/>
    <strong>Phone:</strong> ${escapeHtml(payload.phone)}<br/>
    <strong>Submitted:</strong> ${escapeHtml(submittedAt)}</p>
    <p><strong>Message</strong></p>
    <p style="white-space:pre-wrap">${escapeHtml(payload.message)}</p>
  `;

  const thankYouText = `Hi ${payload.name},

Thank you for reaching out to the Humans First team.
We have received your message and will get back to you soon.

Warm regards,
Vineet Nayar Team
Humans First Machine Second`;

  const thankYouHtml = `
    <p>Hi ${escapeHtml(payload.name)},</p>
    <p>Thank you for reaching out to the Humans First team.</p>
    <p>We have received your message and will get back to you soon.</p>
    <p>Warm regards,<br/>Vineet Nayar Team<br/>Humans First Machine Second</p>
  `;

  try {
    await sendAppMail({
      to: notifyTo,
      subject: `New contact message - ${payload.name}`,
      replyTo: payload.email,
      text: notifyText,
      html: notifyHtml,
    });

    try {
      await sendAppMail({
        to: payload.email,
        toName: payload.name,
        replyTo: SMTP_REPLY_EMAIL,
        subject: "Thank you - we received your message | Humans First",
        text: thankYouText,
        html: thankYouHtml,
      });
    } catch (thankYouErr) {
      console.error("Contact thank-you email failed:", thankYouErr);
    }

    return { ok: true };
  } catch (err) {
    console.error("Contact email send error:", err);
    return {
      ok: false,
      error: "Unable to send your message. Please try again.",
    };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
