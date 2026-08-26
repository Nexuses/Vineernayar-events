import "server-only";

import { sendBlastEmail } from "@/lib/email-blast";
import { isMailConfigured } from "@/lib/mail";
import { formatEventDate, getEventTimeDisplay } from "@/lib/date-utils";
import { getEventPublicPath } from "@/lib/event-path";
import { toAbsolutePublicUrl } from "@/lib/site-url";
import type { EventDoc } from "@/lib/models/Event";
import type { RegistrationDoc } from "@/lib/models/Registration";

const BUTTON_BG = "#F4EA30";
const BUTTON_TEXT = "#111111";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Absolute URL of the "I'll be attending" landing page for one attendee. */
export function buildConfirmAttendingUrl(event: EventDoc, uniqueCode: string): string {
  const base = toAbsolutePublicUrl(getEventPublicPath(event));
  const params = new URLSearchParams({ code: uniqueCode, intent: "attending" });
  return `${base}/confirm-attendance?${params.toString()}`;
}

export function buildConfirmationSubject(event: Pick<EventDoc, "eventName">): string {
  return `Please confirm your attendance: ${event.eventName}`;
}

export function buildConfirmationHtml(
  event: EventDoc,
  reg: Pick<RegistrationDoc, "firstName" | "uniqueCode">
): string {
  const url = buildConfirmAttendingUrl(event, reg.uniqueCode);
  const dateText = formatEventDate(event.eventStartDate);
  const timeText = getEventTimeDisplay({
    eventStartDate: event.eventStartDate,
    eventEndDate: event.eventEndDate,
    eventTime: event.eventTime,
  });
  const greeting = reg.firstName?.trim() ? `Hi ${escapeHtml(reg.firstName.trim())},` : "Hello,";

  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#18181b">
  <p>${greeting}</p>
  <p>Your seat for <strong>${escapeHtml(event.eventName)}</strong> is reserved. So we can finalise the guest list, please confirm that you will be joining us.</p>
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#f5f5f5;border-radius:8px">
    <tr><td style="padding:16px">
      <strong>Date:</strong> ${escapeHtml(dateText)}<br/>
      ${timeText ? `<strong>Time:</strong> ${escapeHtml(timeText)}<br/>` : ""}
      ${event.venue ? `<strong>Venue:</strong> ${escapeHtml(event.venue)}` : ""}
    </td></tr>
  </table>
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0">
    <tr><td style="border-radius:999px;background:${BUTTON_BG}">
      <a href="${url}" style="display:inline-block;padding:14px 28px;border-radius:999px;font-weight:bold;font-size:15px;color:${BUTTON_TEXT};text-decoration:none">I&rsquo;ll be attending</a>
    </td></tr>
  </table>
  <p style="font-size:13px;color:#52525b">If the button does not work, copy this link into your browser:<br/>
    <a href="${url}" style="color:#52525b">${escapeHtml(url)}</a>
  </p>
  <p>We look forward to seeing you there.</p>
  <p>Best regards,<br/>Team Vineet Nayar</p>
</div>`;
}

/** Send the re-confirmation email carrying the "I'll be attending" button. */
export async function sendConfirmationEmail(
  event: EventDoc,
  reg: RegistrationDoc
): Promise<void> {
  if (!isMailConfigured()) {
    throw new Error("Email is not configured");
  }
  await sendBlastEmail({
    to: reg.email,
    toName: `${reg.firstName} ${reg.surname}`.trim(),
    subject: buildConfirmationSubject(event),
    html: buildConfirmationHtml(event, reg),
  });
}
