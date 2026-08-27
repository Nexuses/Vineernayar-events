import { formatEventDate, getEventTimeDisplay } from "@/lib/date-utils";
import { applyEmailTemplate } from "@/lib/email-template-client";
import { buildGoogleMapsDirectionsUrl } from "@/lib/google-maps";

/**
 * Shared, client-safe pieces of the re-confirmation email.
 *
 * The message body is editable, including where the event details sit and how
 * they are worded. The two response buttons are appended on every send and
 * cannot be edited away, so every email always carries a way to respond.
 */

const YES_BG = "#F4EA30";
const YES_TEXT = "#111111";
const NO_BORDER = "#C9C9C4";
const NO_TEXT = "#3F3F46";

export const RECONFIRM_PLACEHOLDERS = [
  "{{firstName}}",
  "{{surname}}",
  "{{eventName}}",
  "{{eventDetails}}",
  "{{eventDate}}",
  "{{eventTime}}",
  "{{venue}}",
  "{{directionsUrl}}",
];

/**
 * The editable part. {{eventDetails}} renders the styled Date / Venue /
 * Directions card; move it, reword it, or replace it with the individual
 * {{eventDate}}, {{venue}} and {{directionsUrl}} placeholders.
 */
export const DEFAULT_RECONFIRM_BODY_HTML = `<p>Hi {{firstName}},</p>
<p>Your seat for <strong>{{eventName}}</strong> is reserved, and we are finalising the guest list.</p>
<p>Please let us know whether you will be joining us, so that we can offer your seat to someone on the waitlist.</p>
{{eventDetails}}`;

/** Appended after the buttons; not editable. */
export const DEFAULT_RECONFIRM_SIGNOFF_HTML = `<p>We look forward to seeing you there!<br/>Team VN</p>`;

export type ReconfirmVars = {
  firstName: string;
  surname: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  directionsUrl: string;
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
  const venue = event.venue ?? "";
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
    venue,
    directionsUrl: venue ? buildGoogleMapsDirectionsUrl(venue) : "",
  };
}

/** Date / Venue / Directions card, rendered where {{eventDetails}} appears. */
export function buildEventDetailsBlock(vars: ReconfirmVars): string {
  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:6px 14px 6px 0;font-size:13px;color:#6B6B63;white-space:nowrap;vertical-align:top">${label}</td>
      <td style="padding:6px 0;font-size:15px;color:#18181b;font-weight:bold">${value}</td>
    </tr>`;

  const rows = [
    vars.eventDate ? row("Date", escapeHtml(vars.eventDate)) : "",
    vars.venue ? row("Venue", escapeHtml(vars.venue)) : "",
    vars.directionsUrl
      ? row(
          "Directions",
          `<a href="${vars.directionsUrl}" style="color:#18181b;text-decoration:underline">Open in Google Maps</a>`
        )
      : "",
  ].join("");

  if (!rows.trim()) return "";

  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0;border-left:3px solid ${YES_BG};background:#FCFCFA">
    <tr><td style="padding:14px 18px">
      <table role="presentation" cellpadding="0" cellspacing="0">${rows}</table>
    </td></tr>
  </table>`;
}

/** Fixed block: the two response buttons. Never editable. */
export function buildResponseButtons(attendingUrl: string, declinedUrl: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0">
    <tr>
      <td style="border-radius:999px;background:${YES_BG}">
        <a href="${attendingUrl}" style="display:inline-block;padding:14px 26px;border-radius:999px;font-weight:bold;font-size:15px;color:${YES_TEXT};text-decoration:none">Yes, I&rsquo;ll be attending</a>
      </td>
      <td style="width:12px"></td>
      <td style="border-radius:999px;border:1px solid ${NO_BORDER}">
        <a href="${declinedUrl}" style="display:inline-block;padding:13px 26px;border-radius:999px;font-weight:bold;font-size:15px;color:${NO_TEXT};text-decoration:none">No, I won&rsquo;t attend</a>
      </td>
    </tr>
  </table>`;
}

/**
 * Assemble the full email: the editable body (with the details card rendered
 * wherever {{eventDetails}} sits), then the two fixed buttons, then the
 * sign-off.
 */
export function buildReconfirmHtml(
  vars: ReconfirmVars,
  attendingUrl: string,
  declinedUrl: string,
  bodyHtml?: string | null
): string {
  const asVars: Record<string, string> = {
    ...(vars as unknown as Record<string, string>),
    eventDetails: buildEventDetailsBlock(vars),
  };
  const body = applyEmailTemplate(bodyHtml?.trim() || DEFAULT_RECONFIRM_BODY_HTML, asVars);
  const signOff = applyEmailTemplate(DEFAULT_RECONFIRM_SIGNOFF_HTML, asVars);

  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#18181b">
  ${body}
  ${buildResponseButtons(attendingUrl, declinedUrl)}
  ${signOff}
</div>`;
}
