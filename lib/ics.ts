/**
 * Generate an .ics (iCalendar) file for the event so recipients can add it to their calendar.
 */

import { EVENT_TIMEZONE, formatCalendarUtcCompact, formatIcsEventLocal } from "@/lib/date-utils";
import { BRAND_NAME } from "@/lib/constants";

function escapeIcsText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

const VTIMEZONE_KOLKATA = [
  "BEGIN:VTIMEZONE",
  `TZID:${EVENT_TIMEZONE}`,
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
  venue: string;
  uniqueCode: string;
  passUrl?: string;
  attendeeName?: string;
  attendeeEmail?: string;
};

/**
 * Returns .ics file content as a string (UTF-8). Use Buffer.from(ics, "utf-8") for attachment.
 */
export function generateIcs(data: IcsEventData, eventId: string): string {
  const uid = `${data.uniqueCode}-${eventId}@${BRAND_NAME.toLowerCase()}`;
  const dtstamp = formatCalendarUtcCompact(new Date());
  const dtstartLocal = formatIcsEventLocal(data.eventStartDate);
  const dtendLocal = formatIcsEventLocal(data.eventEndDate);
  const summary = escapeIcsText(data.eventName);
  const location = escapeIcsText(data.venue || "");
  const descriptionParts = [
    `Pass code: ${data.uniqueCode}`,
    data.passUrl ? `View pass: ${data.passUrl}` : "",
  ].filter(Boolean);
  const description = escapeIcsText(descriptionParts.join("\\n"));

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${BRAND_NAME}//Event Pass//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    VTIMEZONE_KOLKATA,
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;TZID=${EVENT_TIMEZONE}:${dtstartLocal}`,
    `DTEND;TZID=${EVENT_TIMEZONE}:${dtendLocal}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
  ];

  if (data.attendeeEmail) {
    lines.push(`ATTENDEE:mailto:${data.attendeeEmail}`);
  }

  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.join("\r\n");
}
