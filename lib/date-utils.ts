/**
 * Event times are entered in admin as local (India) and stored in UTC.
 * Use this timezone for consistent display in admin and on public site.
 */
export const EVENT_TIMEZONE = "Asia/Kolkata";

/**
 * Parse a datetime-local value ("YYYY-MM-DDTHH:mm") as event time (India).
 * Ensures the same input produces the same UTC moment regardless of server timezone.
 */
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
  details?: string;
  location?: string;
}): string {
  const start = formatCalendarUtcCompact(params.start);
  const end = formatCalendarUtcCompact(resolveEventEndDate(params.start, params.end));
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
