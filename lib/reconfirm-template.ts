import { formatEventDate, getEventTimeDisplay } from "@/lib/date-utils";
import { applyEmailTemplate } from "@/lib/email-template-client";

/**
 * Shared, client-safe pieces of the re-confirmation email.
 *
 * Only the message body is editable by an admin. The event details block and
 * the "I'll be attending" button are assembled here and appended on every send,
 * so they cannot be edited away.
 */

const BUTTON_BG = "#F4EA30";
const BUTTON_TEXT = "#111111";

export const RECONFIRM_PLACEHOLDERS = [
  "{{firstName}}",
  "{{surname}}",
  "{{eventName}}",
  "{{eventDate}}",
  "{{eventTime}}",
  "{{venue}}",
];

/** The editable part. */
export const DEFAULT_RECONFIRM_BODY_HTML = `<p>Hi {{firstName}},</p>
<p>Your seat for <strong>{{eventName}}</strong> is reserved. So we can finalise the guest list, please confirm that you will be joining us.</p>`;

/** Appended after the button; not editable. */
export const DEFAULT_RECONFIRM_SIGNOFF_HTML = `<p>We look forward to seeing you there.</p>
<p>Best regards,<br/>Team Vineet Nayar</p>`;

export type ReconfirmVars = {
  firstName: string;
  surname: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  venue: string;
};

type EventLike = {
  eventName: string;
  eventStartDate: Date | string;
  eventEndDate: Date | string;
  eventTime?: string;
  venue?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildReconfirmVars(
  event: EventLike,
  reg: { firstName?: string; surname?: string }
): ReconfirmVars {
  return {
    firstName: reg.firstName?.trim() || "",
    surname: reg.surname?.trim() || "",
    eventName: event.eventName ?? "",
    eventDate: formatEventDate(event.eventStartDate),
    eventTime: getEventTimeDisplay({
      eventStartDate: event.eventStartDate,
      eventEndDate: event.eventEndDate,
      eventTime: event.eventTime,
    }),
    venue: event.venue ?? "",
  };
}

/** Fixed block: event details plus the confirmation button. */
export function buildConfirmationButtonBlock(vars: ReconfirmVars, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#f5f5f5;border-radius:8px">
    <tr><td style="padding:16px">
      <strong>Date:</strong> ${escapeHtml(vars.eventDate)}<br/>
      ${vars.eventTime ? `<strong>Time:</strong> ${escapeHtml(vars.eventTime)}<br/>` : ""}
      ${vars.venue ? `<strong>Venue:</strong> ${escapeHtml(vars.venue)}` : ""}
    </td></tr>
  </table>
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0">
    <tr><td style="border-radius:999px;background:${BUTTON_BG}">
      <a href="${url}" style="display:inline-block;padding:14px 28px;border-radius:999px;font-weight:bold;font-size:15px;color:${BUTTON_TEXT};text-decoration:none">I&rsquo;ll be attending</a>
    </td></tr>
  </table>
  <p style="font-size:13px;color:#52525b">If the button does not work, copy this link into your browser:<br/>
    <a href="${url}" style="color:#52525b">${escapeHtml(url)}</a>
  </p>`;
}

/**
 * Assemble the full email: editable body, then the fixed details + button,
 * then the sign-off.
 */
export function buildReconfirmHtml(
  vars: ReconfirmVars,
  confirmUrl: string,
  bodyHtml?: string | null
): string {
  const asVars = vars as unknown as Record<string, string>;
  const body = applyEmailTemplate(bodyHtml?.trim() || DEFAULT_RECONFIRM_BODY_HTML, asVars);
  const signOff = applyEmailTemplate(DEFAULT_RECONFIRM_SIGNOFF_HTML, asVars);

  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#18181b">
  ${body}
  ${buildConfirmationButtonBlock(vars, confirmUrl)}
  ${signOff}
</div>`;
}
