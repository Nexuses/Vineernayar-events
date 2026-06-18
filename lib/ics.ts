/**
 * Generate an .ics (iCalendar) file for the event so recipients can add it to their calendar.
 */

import {
  EVENT_TIMEZONE,
  formatCalendarUtcCompact,
  formatIcsEventLocal,
  getEventCountdownRange,
  resolveEventEndDate,
} from "@/lib/date-utils";
import { BRAND_NAME } from "@/lib/constants";

const ORGANIZER_EMAIL = process.env.FROM_EMAIL || "noreply@example.com";
const ORGANIZER_NAME = process.env.FROM_NAME || `${BRAND_NAME} Events`;

function escapeIcsText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function escapeIcsParam(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

const VTIMEZONE_IST = [
  "BEGIN:VTIMEZONE",
  `TZID:${EVENT_TIMEZONE}`,
  "X-LIC-LOCATION:Asia/Kolkata",
  "BEGIN:STANDARD",
  "DTSTART:19700101T000000",
  "TZOFFSETFROM:+0530",
  "TZOFFSETTO:+0530",
  "TZNAME:IST",
  "END:STANDARD",
  "END:VTIMEZONE",
].join("\r\n");

export type IcsEventData = {
  eventName: string;
  eventStartDate: Date | string;
  eventEndDate: Date | string;
  eventTime?: string;
  venue: string;
  uniqueCode: string;
  passUrl?: string;
  attendeeName?: string;
  attendeeEmail?: string;
  organizerEmail?: string;
  organizerName?: string;
};

function resolveIcsStartEnd(data: IcsEventData): { start: Date; end: Date } {
  const range = getEventCountdownRange({
    eventStartDate: data.eventStartDate,
    eventEndDate: data.eventEndDate,
    eventTime: data.eventTime,
  });
  if (range) return range;

  return {
    start: new Date(data.eventStartDate),
    end: resolveEventEndDate(data.eventStartDate, data.eventEndDate),
  };
}

/**
 * Returns .ics file content as a string (UTF-8). Use Buffer.from(ics, "utf-8") for attachment.
 */
export function generateIcs(data: IcsEventData, eventId: string): string {
  const uid = `${data.uniqueCode}-${eventId}@${BRAND_NAME.toLowerCase().replace(/\s+/g, "")}.events`;
  const dtstamp = formatCalendarUtcCompact(new Date());
  const { start, end } = resolveIcsStartEnd(data);
  const dtstartLocal = formatIcsEventLocal(start);
  const dtendLocal = formatIcsEventLocal(end);
  const dtstart = dtstartLocal
    ? `DTSTART;TZID=${EVENT_TIMEZONE}:${dtstartLocal}`
    : `DTSTART:${formatCalendarUtcCompact(start)}`;
  const dtend = dtendLocal
    ? `DTEND;TZID=${EVENT_TIMEZONE}:${dtendLocal}`
    : `DTEND:${formatCalendarUtcCompact(end)}`;
  const summary = escapeIcsText(data.eventName);
  const location = escapeIcsText(data.venue || "");
  const descriptionParts = [
    `Pass code: ${data.uniqueCode}`,
    data.passUrl ? `View pass: ${data.passUrl}` : "",
  ].filter(Boolean);
  const description = escapeIcsText(descriptionParts.join("\\n"));

  const organizerEmail = (data.organizerEmail || ORGANIZER_EMAIL).trim();
  const organizerName = escapeIcsParam(data.organizerName || ORGANIZER_NAME);
  const attendeeEmail = data.attendeeEmail?.trim();
  const attendeeName = escapeIcsParam(data.attendeeName?.trim() || attendeeEmail || "Guest");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${BRAND_NAME}//Event Registration//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    VTIMEZONE_IST,
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    dtstart,
    dtend,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    `ORGANIZER;CN=${organizerName}:mailto:${organizerEmail}`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "TRANSP:OPAQUE",
    "CLASS:PUBLIC",
  ];

  if (attendeeEmail) {
    lines.push(
      `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;RSVP=FALSE;CN=${attendeeName}:mailto:${attendeeEmail}`
    );
  }

  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.join("\r\n");
}
