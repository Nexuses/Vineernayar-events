import { getBannerHighlightLabel } from "@/lib/banner-label";

function slugToCityLabel(slug?: string): string {
  if (!slug?.trim()) return "";
  return slug
    .trim()
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getEventCityLabel(event: {
  eventName: string;
  venue?: string;
  slug?: string;
}): string {
  const fromSlug = slugToCityLabel(event.slug);
  if (fromSlug) return fromSlug;
  return getBannerHighlightLabel(event.venue, event.eventName);
}

export function formatEventDropdownLabel(event: {
  eventName: string;
  venue?: string;
  slug?: string;
}): string {
  const city = getEventCityLabel(event);
  if (!city) return event.eventName;
  if (event.eventName.toLowerCase().includes(city.toLowerCase())) {
    return event.eventName;
  }
  return `${event.eventName} (${city})`;
}
