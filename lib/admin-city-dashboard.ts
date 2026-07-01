import { getEventCityLabel } from "@/lib/event-option-label";
import type { EventDoc } from "@/lib/models/Event";

export type AdminCityDashboard = {
  slug: string;
  label: string;
  eventIds: string[];
};

/** Fixed sidebar order for city dashboards. */
export const ADMIN_CITY_NAV_ORDER = [
  "Delhi",
  "Mumbai",
  "Bengaluru",
  "Hyderabad",
  "Chennai",
  "Kolkata",
] as const;

const CITY_ORDER_ALIASES: Record<string, string> = {
  bangalore: "bengaluru",
};

function normalizeCityKey(value: string): string {
  const key = value.trim().toLowerCase();
  return CITY_ORDER_ALIASES[key] ?? key;
}

function cityNavSortIndex(city: AdminCityDashboard): number {
  const slug = normalizeCityKey(city.slug);
  const label = normalizeCityKey(city.label);

  for (let i = 0; i < ADMIN_CITY_NAV_ORDER.length; i++) {
    const ordered = normalizeCityKey(ADMIN_CITY_NAV_ORDER[i]);
    if (slug === ordered || label === ordered) return i;
  }

  return ADMIN_CITY_NAV_ORDER.length;
}

export function sortCitiesForNav(cities: AdminCityDashboard[]): AdminCityDashboard[] {
  return [...cities].sort((a, b) => {
    const orderDiff = cityNavSortIndex(a) - cityNavSortIndex(b);
    if (orderDiff !== 0) return orderDiff;
    return a.label.localeCompare(b.label);
  });
}

export function citySlugFromLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function citySlugFromEvent(event: Pick<EventDoc, "eventId" | "slug" | "eventName" | "venue">): string {
  if (event.slug?.trim()) return event.slug.trim().toLowerCase();
  const label = getEventCityLabel(event);
  if (label) return citySlugFromLabel(label);
  return event.eventId;
}

export function groupEventsByCity(events: EventDoc[]): AdminCityDashboard[] {
  const map = new Map<string, AdminCityDashboard>();

  for (const event of events) {
    const slug = citySlugFromEvent(event);
    const label = getEventCityLabel(event) || slug;
    const existing = map.get(slug);
    if (existing) {
      if (!existing.eventIds.includes(event.eventId)) {
        existing.eventIds.push(event.eventId);
      }
    } else {
      map.set(slug, { slug, label, eventIds: [event.eventId] });
    }
  }

  return sortCitiesForNav(Array.from(map.values()));
}

export function findCityDashboard(
  cities: AdminCityDashboard[],
  citySlug: string
): AdminCityDashboard | undefined {
  const normalized = citySlug.trim().toLowerCase();
  return cities.find((c) => c.slug === normalized);
}
