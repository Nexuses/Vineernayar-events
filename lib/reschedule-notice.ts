import "server-only";

import { sendBlastEmail } from "@/lib/email-blast";
import { isMailConfigured } from "@/lib/mail";
import { formatEventDate, getEventTimeDisplay } from "@/lib/date-utils";
import { listRegistrationsByEventId } from "@/lib/models/Registration";
import type { EventDoc } from "@/lib/models/Event";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildRescheduleSubject(event: Pick<EventDoc, "eventName">): string {
  return `New date for ${event.eventName}`;
}

export function buildRescheduleHtml(
  event: Pick<EventDoc, "eventName" | "eventStartDate" | "eventEndDate" | "eventTime" | "venue">,
  firstName: string
): string {
  const dateText = formatEventDate(event.eventStartDate);
  const timeText = getEventTimeDisplay({
    eventStartDate: event.eventStartDate,
    eventEndDate: event.eventEndDate,
    eventTime: event.eventTime,
  });
  const greeting = firstName.trim() ? `Hi ${escapeHtml(firstName.trim())},` : "Hello,";

  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#18181b">
  <p>${greeting}</p>
  <p>The date for <strong>${escapeHtml(event.eventName)}</strong> has changed. Your registration has been moved across automatically &mdash; there is nothing you need to do.</p>
  <p style="margin:20px 0;padding:16px;background:#f5f5f5;border-radius:8px">
    <strong>New date:</strong> ${escapeHtml(dateText)}<br/>
    ${timeText ? `<strong>Time:</strong> ${escapeHtml(timeText)}<br/>` : ""}
    ${event.venue ? `<strong>Venue:</strong> ${escapeHtml(event.venue)}` : ""}
  </p>
  <p>Your existing pass remains valid for the new date. We look forward to seeing you there.</p>
  <p>Best regards,<br/>Team Vineet Nayar</p>
</div>`;
}

/**
 * Tell everyone registered for an event that its date has changed.
 *
 * Only sent when an admin explicitly opts in while saving the new date — moving
 * an event is silent by default.
 */
export async function sendRescheduleNotices(event: EventDoc): Promise<{
  total: number;
  sent: number;
  failed: number;
}> {
  if (!isMailConfigured()) {
    throw new Error("Email is not configured");
  }

  const registrations = await listRegistrationsByEventId(event.eventId);
  const subject = buildRescheduleSubject(event);

  let sent = 0;
  let failed = 0;

  for (const reg of registrations) {
    const to = reg.email?.trim();
    // Manual registrations without a real email get a placeholder address.
    if (!to || to.endsWith("@hfms.internal")) continue;

    try {
      await sendBlastEmail({
        to,
        toName: `${reg.firstName} ${reg.surname}`.trim(),
        subject,
        html: buildRescheduleHtml(event, reg.firstName),
      });
      sent += 1;
    } catch (err) {
      console.error(`Reschedule notice failed for ${to}:`, err);
      failed += 1;
    }
  }

  return { total: registrations.length, sent, failed };
}
