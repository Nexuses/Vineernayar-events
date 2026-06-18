/**
 * Event times are entered in admin as local (India) and stored in UTC.
 * Use this timezone for consistent display in admin and on public site.
 */
export const EVENT_TIMEZONE = "Asia/Kolkata";

/**
 * Parse a datetime-local value ("YYYY-MM-DDTHH:mm") as event time (India).
 * Ensures the same input produces the same UTC moment regardless of server timezone.
 */
/**
 * Parse a date-only value (YYYY-MM-DD) as midnight in the event timezone.
 */
export function parseEventDate(value: string): Date {
  if (!value || typeof value !== "string") return new Date(NaN);
  const s = value.trim();
  if (!s) return new Date(NaN);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return parseEventDateTime(`${s}T00:00`);
  }
  return parseEventDateTime(s);
}

/** End of the same calendar day as `start` in the event timezone. */
export function endOfEventDate(start: Date | string): Date {
  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) return startDate;
  const parts = getIstParts(startDate);
  if (!parts) return startDate;
  return istPartsToDate({ ...parts, hour: "23", minute: "59", second: "59" });
}

/** Format a stored date for `<input type="date">` in the event timezone. */
export function toEventDateInput(d: Date | string): string {
  const parts = getIstParts(d);
  if (!parts) return "";
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export type EventDateTimeFields = {
  eventStartDate: Date | string;
  eventEndDate?: Date | string;
  eventTime?: string;
};

/** Display time range from admin text, or fall back to stored datetimes. */
export function getEventTimeDisplay(event: EventDateTimeFields): string {
  if (event.eventTime?.trim()) return event.eventTime.trim();
  if (!event.eventStartDate) return "—";
  const end = resolveEventEndDate(
    event.eventStartDate,
    event.eventEndDate ?? event.eventStartDate
  );
  const startTime = formatEventTime(event.eventStartDate);
  const endTime = formatEventTime(end);
  if (startTime === "—" && endTime === "—") return "—";
  return `${startTime} – ${endTime}`;
}

export function resolveEventDatesFromAdminFields(
  eventDate: string,
  eventTime?: string
): { eventStartDate: Date; eventEndDate: Date; eventTime: string } {
  const start = parseEventDate(eventDate);
  const end = endOfEventDate(start);
  return {
    eventStartDate: start,
    eventEndDate: end,
    eventTime: (eventTime ?? "").trim(),
  };
}

export function parseEventDateTime(value: string): Date {
  if (!value || typeof value !== "string") return new Date(NaN);
  const s = value.trim();
  if (!s) return new Date(NaN);
  // If it already has timezone info, parse as-is
  if (/[+-]\d{2}:?\d{2}$|Z$/i.test(s)) return new Date(s);
  // Otherwise treat as India time (IST = +05:30)
  const withTz = s.length <= 16 ? `${s.slice(0, 16)}:00+05:30` : `${s}+05:30`;
  return new Date(withTz);
}

/**
 * Format a date for display (event date/time in India).
 */
export function formatEventDate(d: Date | string): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: EVENT_TIMEZONE,
    });
  } catch {
    return "—";
  }
}

export function formatEventTime(d: Date | string): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: EVENT_TIMEZONE,
    });
  } catch {
    return "—";
  }
}

export function formatEventDateTime(d: Date | string): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: EVENT_TIMEZONE,
    });
  } catch {
    return "—";
  }
}

/** Registration timestamp in India time (YYYY-MM-DD HH:mm:ss). */
export function formatRegisteredDate(d: Date | string): string {
  const parts = getIstParts(d);
  if (!parts) return "—";
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

/** Calendar date key in event timezone (YYYY-MM-DD). */
export function getIstDateKey(d: Date | string): string | null {
  const parts = getIstParts(d);
  if (!parts) return null;
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** Whole calendar days from `from` to `to` in IST (to − from). */
export function istCalendarDayDiff(from: Date | string, to: Date | string): number | null {
  const fromKey = getIstDateKey(from);
  const toKey = getIstDateKey(to);
  if (!fromKey || !toKey) return null;
  const start = new Date(`${fromKey}T00:00:00+05:30`).getTime();
  const end = new Date(`${toKey}T00:00:00+05:30`).getTime();
  return Math.round((end - start) / (24 * 60 * 60 * 1000));
}

/**
 * Compact UTC instant for Google Calendar `dates` param (must end with Z).
 * Example: 2026-06-10T05:30:00.000Z → 20260610T053000Z
 */
export function formatCalendarUtcCompact(d: Date | string): string {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

type IstParts = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
};

function getIstParts(d: Date | string): IstParts | null {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: EVENT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  const hour = get("hour");
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: (hour === "24" ? "00" : hour).padStart(2, "0"),
    minute: get("minute").padStart(2, "0"),
    second: get("second").padStart(2, "0"),
  };
}

function istPartsToDate(parts: IstParts): Date {
  return new Date(
    `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}+05:30`
  );
}

function parseTimeToken(token: string): { hour: number; minute: number } | null {
  const match = token.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;

  let hour = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2] ?? "0", 10);
  const meridiem = match[3]?.toLowerCase();

  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return { hour, minute };
}

/** First time in a range like "10:00 am - 4:00 pm". */
export function parseEventStartTimeFromText(timeText: string): { hour: number; minute: number } | null {
  const text = timeText.trim();
  if (!text) return null;
  const startToken = text.split(/\s*[-–]\s*/)[0]?.trim() ?? text;
  return parseTimeToken(startToken);
}

/** Last time in a range like "10:00 am - 4:00 pm". */
export function parseEventEndTimeFromText(timeText: string): { hour: number; minute: number } | null {
  const parts = timeText.trim().split(/\s*[-–]\s*/);
  if (parts.length < 2) return null;
  return parseTimeToken(parts[parts.length - 1] ?? "");
}

function dateFromIstParts(
  dateParts: IstParts,
  time: { hour: number; minute: number }
): Date {
  return istPartsToDate({
    ...dateParts,
    hour: String(time.hour).padStart(2, "0"),
    minute: String(time.minute).padStart(2, "0"),
    second: "00",
  });
}

/** Start/end instants for live countdown (India timezone). */
export function getEventCountdownRange(event: EventDateTimeFields): {
  start: Date;
  end: Date;
} | null {
  const dateParts = getIstParts(event.eventStartDate);
  if (!dateParts) return null;

  const startTime =
    (event.eventTime && parseEventStartTimeFromText(event.eventTime)) ||
    parseTimeToken(`${dateParts.hour}:${dateParts.minute}`) ||
    { hour: 0, minute: 0 };

  const endParts = event.eventEndDate ? getIstParts(event.eventEndDate) : null;
  let endTime =
    (event.eventTime && parseEventEndTimeFromText(event.eventTime)) ||
    (endParts ? parseTimeToken(`${endParts.hour}:${endParts.minute}`) : null);

  if (!endTime || endTime.hour * 60 + endTime.minute <= startTime.hour * 60 + startTime.minute) {
    endTime = { hour: 23, minute: 59 };
  }

  return {
    start: dateFromIstParts(dateParts, startTime),
    end: dateFromIstParts(dateParts, endTime),
  };
}

/**
 * Ensures calendar/ICS end time is after start. If stored end is invalid (e.g. wrong month),
 * uses the end time on the start event day in India timezone.
 */
export function resolveEventEndDate(start: Date | string, end: Date | string): Date {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime())) return endDate;
  if (Number.isNaN(endDate.getTime())) return startDate;
  if (endDate.getTime() > startDate.getTime()) return endDate;

  const startParts = getIstParts(startDate);
  const endParts = getIstParts(endDate);
  if (!startParts || !endParts) return endDate;

  const sameDayEnd = istPartsToDate({
    ...startParts,
    hour: endParts.hour,
    minute: endParts.minute,
    second: endParts.second,
  });
  if (sameDayEnd.getTime() > startDate.getTime()) return sameDayEnd;

  return endDate;
}

export function assertEventEndAfterStart(start: Date, end: Date): string | null {
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Event start and end dates are required";
  }
  if (end.getTime() <= start.getTime()) {
    return "Event end date must be after the start date";
  }
  return null;
}

/** ICS local date/time in event timezone (no Z suffix). Example: 20260610T110000 */
export function formatIcsEventLocal(d: Date | string): string {
  if (!d) return "";
  try {
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return "";
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: EVENT_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((p) => p.type === type)?.value ?? "";
    const y = get("year");
    const m = get("month");
    const day = get("day");
    const hour = get("hour");
    const minute = get("minute");
    const second = get("second");
    if (!y || !m || !day || !hour || !minute || !second) return "";
    const normalizedHour = (hour === "24" ? "00" : hour).padStart(2, "0");
    return `${y}${m}${day}T${normalizedHour}${minute.padStart(2, "0")}${second.padStart(2, "0")}`;
  } catch {
    return "";
  }
}

export function buildGoogleCalendarUrl(params: {
  title: string;
  start: Date | string;
  end: Date | string;
  eventTime?: string;
  details?: string;
  location?: string;
}): string {
  const range = getEventCountdownRange({
    eventStartDate: params.start,
    eventEndDate: params.end,
    eventTime: params.eventTime,
  });
  const startInstant = range?.start ?? new Date(params.start);
  const endInstant =
    range?.end ?? resolveEventEndDate(params.start, params.end);
  const start = formatCalendarUtcCompact(startInstant);
  const end = formatCalendarUtcCompact(endInstant);
  if (!start || !end) return "https://calendar.google.com/calendar/render?action=TEMPLATE";

  const search = new URLSearchParams({
    action: "TEMPLATE",
    text: params.title,
    dates: `${start}/${end}`,
  });
  if (params.details) search.set("details", params.details);
  if (params.location) search.set("location", params.location);
  return `https://calendar.google.com/calendar/render?${search.toString()}`;
}

/** For datetime-local input: format a Date to "YYYY-MM-DDTHH:mm" in event timezone. */
export function toDatetimeLocal(d: Date | string): string {
  if (!d) return "";
  try {
    const date = new Date(d);
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: EVENT_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((p) => p.type === type)?.value ?? "";
    const y = get("year");
    const m = get("month");
    const day = get("day");
    const hour = get("hour");
    const minute = get("minute");
    if (!y || !m || !day || hour === undefined || minute === undefined) return "";
    return `${y}-${m}-${day}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
  } catch {
    return "";
  }
}
