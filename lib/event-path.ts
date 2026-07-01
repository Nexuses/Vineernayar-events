import type { EventDoc } from "@/lib/models/Event";

export function getEventPublicSlug(event: Pick<EventDoc, "slug" | "eventId">): string {
  return event.slug || event.eventId;
}

export function getEventPublicPath(event: Pick<EventDoc, "slug" | "eventId">): string {
  return `/events/${getEventPublicSlug(event)}`;
}

export function getEventRegisterPath(event: Pick<EventDoc, "slug" | "eventId">): string {
  return getEventPublicPath(event);
}

export function getEventPassPath(
  event: Pick<EventDoc, "slug" | "eventId">,
  uniqueCode: string
): string {
  return `${getEventPublicPath(event)}/pass/${uniqueCode}`;
}

/** When the URL uses legacy eventId but a slug exists, return the canonical path. */
export function getCanonicalEventPathIfNeeded(
  param: string,
  event: Pick<EventDoc, "slug" | "eventId">,
  suffix = ""
): string | null {
  const canonical = getEventPublicSlug(event);
  if (param === canonical) return null;
  return `${getEventPublicPath(event)}${suffix}`;
}
