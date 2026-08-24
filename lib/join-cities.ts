import { EVENT_TIMEZONE } from "./date-utils";
import { getEventCityLabel } from "./event-option-label";

/**
 * The "Join the Movement" city list is derived from the published events in the
 * database — city label plus the event's own date — so dates and ordering are
 * managed entirely on the platform. Nothing here is hardcoded.
 */
export type JoinCityEvent = {
  eventName: string;
  venue?: string;
  slug?: string;
  eventStartDate: Date | string;
  eventEndDate?: Date | string;
};

/** Short IST date for a city option, e.g. "6 Sep". */
export function formatJoinCityDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    timeZone: EVENT_TIMEZONE,
    day: "numeric",
    month: "short",
  });
}

/** One option label, e.g. "Bengaluru · 6 Sep". */
export function formatJoinCityOption(event: JoinCityEvent): string {
  const city = getEventCityLabel(event).trim();
  if (!city) return "";
  const date = formatJoinCityDate(event.eventStartDate);
  return date ? `${city} · ${date}` : city;
}

function eventMs(value: Date | string | undefined): number {
  if (!value) return NaN;
  const d = value instanceof Date ? value : new Date(value);
  return d.getTime();
}

/**
 * Build the city options from events.
 *
 * Only events that have not finished are offered — this is a seat-reservation
 * picker, so a city whose event already happened must not be selectable — and
 * they are listed in chronological order by event date. Both the dates and the
 * sequence therefore come straight from the platform.
 */
export function buildJoinCities(
  events: JoinCityEvent[],
  now: number = Date.now()
): string[] {
  const upcoming = events
    .filter((event) => {
      const end = eventMs(event.eventEndDate ?? event.eventStartDate);
      return !Number.isNaN(end) && end >= now;
    })
    .sort((a, b) => eventMs(a.eventStartDate) - eventMs(b.eventStartDate));

  const seen = new Set<string>();
  const options: string[] = [];
  for (const event of upcoming) {
    const label = formatJoinCityOption(event);
    if (!label || seen.has(label)) continue;
    seen.add(label);
    options.push(label);
  }
  return options;
}
