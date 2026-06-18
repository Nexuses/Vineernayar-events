import { getDb } from "../mongodb";
import { ObjectId } from "mongodb";
import { DEFAULT_EVENT_BANNER_URL } from "../constants";
import { countRegistrationsByEventId, getRegistrationCountsByEventIds } from "./Registration";
import {
  getRegistrationWindowStatus,
  getPublicRegistrationWindowLabel,
  getRegistrationWindowLabel,
  getRegistrationWindowBadgeClass,
  type RegistrationWindowStatus,
} from "../registration-window";

export type { RegistrationWindowStatus };
export {
  getRegistrationWindowStatus,
  getPublicRegistrationWindowLabel,
  getRegistrationWindowLabel,
  getRegistrationWindowBadgeClass,
};

export type RegistrationStatus = "open" | "closed";

/** Who can register: open_for_all = anyone; invitees_only = only eligible client list */
export type RegistrationType = "open_for_all" | "invitees_only";

export interface EventDoc {
  _id?: ObjectId;
  eventId: string;
  eventName: string;
  /** Optional long-form text shown on the public event page */
  description?: string;
  eventBanner: string; // URL or path like /events/xxx.jpg
  eventStartDate: Date;
  eventEndDate: Date;
  /** Display time range, e.g. "10:00 am - 4:00 pm" */
  eventTime?: string;
  /** If true, event is visible on the public frontend */
  published?: boolean;
  registrationStartDate?: Date;
  registrationEndDate?: Date;
  /** If true, registration form shows a Transport dropdown with these locations */
  collectTransport?: boolean;
  /** If true and Transport is collected, attendee must opt-in to Transport (Yes) */
  requireTransport?: boolean;
  /** Exactly 3 locations (strings) shown in the dropdown when collectTransport is enabled */
  transportLocations?: string[];
  venue: string;
  speaker: string;
  phone: string;
  registrationStatus: RegistrationStatus;
  /** Who can register: open_for_all = anyone, invitees_only = only eligible list */
  registrationType?: RegistrationType;
  /** If true, registration form shows Apparel - sizes field */
  collectApparelSize?: boolean;
  /** If true and Apparel - sizes is collected, attendee must select a size */
  requireApparelSize?: boolean;
  /** If true, registration form shows Overnight Stay field */
  collectOvernightStay?: boolean;
  /** If true and Overnight Stay is collected, attendee must opt-in to Overnight Stay (Yes) */
  requireOvernightStay?: boolean;
  /** If true, registration form shows Passport/NIC field */
  collectPassportNic?: boolean;
  /** If true and Passport/NIC is collected, attendee must provide Passport/NIC */
  requirePassportNic?: boolean;
  /** If true, when attendee enables "Add to WhatsApp", whatsapp number becomes required */
  requireWhatsAppNumber?: boolean;
  /** Max registrations allowed; when reached, public registration closes automatically */
  seatLimit?: number;
  createdAt: Date;
}

const COLLECTION = "events";

/** Re-export for convenience */
export { DEFAULT_EVENT_BANNER_URL };

export function getEventBannerUrl(doc: { eventBanner?: string | null }): string {
  const url = doc.eventBanner?.trim();
  return url || DEFAULT_EVENT_BANNER_URL;
}

/** Uses registration start/end dates (not the legacy registrationStatus field). */
export function getEffectiveRegistrationStatus(
  event: Pick<EventDoc, "registrationStartDate" | "registrationEndDate">
): RegistrationStatus {
  return getRegistrationWindowStatus(event) === "open" ? "open" : "closed";
}

function isSeatsFull(
  event: Pick<EventDoc, "seatLimit">,
  registrationCount: number
): boolean {
  const limit = event.seatLimit;
  return typeof limit === "number" && limit > 0 && registrationCount >= limit;
}

/** Public registration window: dates, then seat limit. */
export async function getPublicRegistrationWindowStatus(
  event: Pick<EventDoc, "eventId" | "registrationStartDate" | "registrationEndDate" | "seatLimit">
): Promise<RegistrationWindowStatus> {
  const window = getRegistrationWindowStatus(event);
  if (window !== "open") return window;
  if (!event.seatLimit || event.seatLimit <= 0) return "open";
  const count = await countRegistrationsByEventId(event.eventId);
  return isSeatsFull(event, count) ? "closed" : "open";
}

/** Whether the public registration form accepts submissions. */
export async function getPublicRegistrationStatus(
  event: Pick<EventDoc, "eventId" | "registrationStartDate" | "registrationEndDate" | "seatLimit">
): Promise<RegistrationStatus> {
  const window = await getPublicRegistrationWindowStatus(event);
  return window === "open" ? "open" : "closed";
}

export async function getPublicRegistrationWindowStatusByEventIds(
  events: Pick<EventDoc, "eventId" | "registrationStartDate" | "registrationEndDate" | "seatLimit">[]
): Promise<Map<string, RegistrationWindowStatus>> {
  const counts = await getRegistrationCountsByEventIds(events.map((e) => e.eventId));
  const statuses = new Map<string, RegistrationWindowStatus>();
  for (const event of events) {
    const window = getRegistrationWindowStatus(event);
    if (window !== "open") {
      statuses.set(event.eventId, window);
      continue;
    }
    const count = counts.get(event.eventId) ?? 0;
    statuses.set(event.eventId, isSeatsFull(event, count) ? "closed" : "open");
  }
  return statuses;
}

export async function getPublicRegistrationStatusByEventIds(
  events: Pick<EventDoc, "eventId" | "registrationStartDate" | "registrationEndDate" | "seatLimit">[]
): Promise<Map<string, RegistrationStatus>> {
  const windows = await getPublicRegistrationWindowStatusByEventIds(events);
  const statuses = new Map<string, RegistrationStatus>();
  for (const [eventId, window] of windows) {
    statuses.set(eventId, window === "open" ? "open" : "closed");
  }
  return statuses;
}

export async function getEventsCollection() {
  const db = await getDb();
  return db.collection<EventDoc>(COLLECTION);
}

export async function createEvent(data: Omit<EventDoc, "_id" | "eventId" | "createdAt">): Promise<EventDoc> {
  const col = await getEventsCollection();
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const doc: EventDoc = {
    eventId,
    eventName: data.eventName.trim(),
    description: data.description?.trim() || undefined,
    eventBanner: data.eventBanner.trim() || "",
    eventStartDate: new Date(data.eventStartDate),
    eventEndDate: new Date(data.eventEndDate),
    eventTime: data.eventTime?.trim() || undefined,
    published: data.published ?? false,
    registrationStartDate: data.registrationStartDate ? new Date(data.registrationStartDate) : undefined,
    registrationEndDate: data.registrationEndDate ? new Date(data.registrationEndDate) : undefined,
    collectTransport: data.collectTransport ?? false,
    requireTransport: data.requireTransport ?? false,
    transportLocations: data.transportLocations ?? [],
    venue: data.venue.trim(),
    speaker: data.speaker.trim(),
    phone: data.phone.trim(),
    registrationStatus: data.registrationStatus,
    registrationType: data.registrationType ?? "invitees_only",
    collectApparelSize: data.collectApparelSize ?? false,
    requireApparelSize: data.requireApparelSize ?? false,
    collectOvernightStay: data.collectOvernightStay ?? false,
    requireOvernightStay: data.requireOvernightStay ?? false,
    collectPassportNic: data.collectPassportNic ?? false,
    requirePassportNic: data.requirePassportNic ?? false,
    requireWhatsAppNumber: data.requireWhatsAppNumber ?? false,
    seatLimit: data.seatLimit,
    createdAt: new Date(),
  };
  const result = await col.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function listEvents(): Promise<EventDoc[]> {
  const col = await getEventsCollection();
  const cursor = col.find({}).sort({ createdAt: -1 });
  return cursor.toArray();
}

/** Upcoming events first (nearest date), then past events (most recent first). */
export function sortEventsByDate(events: EventDoc[]): EventDoc[] {
  const now = Date.now();
  const upcoming: EventDoc[] = [];
  const past: EventDoc[] = [];

  for (const event of events) {
    const endMs = new Date(event.eventEndDate).getTime();
    if (!Number.isNaN(endMs) && endMs >= now) {
      upcoming.push(event);
    } else {
      past.push(event);
    }
  }

  const byStartAsc = (a: EventDoc, b: EventDoc) =>
    new Date(a.eventStartDate).getTime() - new Date(b.eventStartDate).getTime();
  const byStartDesc = (a: EventDoc, b: EventDoc) =>
    new Date(b.eventStartDate).getTime() - new Date(a.eventStartDate).getTime();

  upcoming.sort(byStartAsc);
  past.sort(byStartDesc);
  return [...upcoming, ...past];
}

export async function listPublishedEvents(): Promise<EventDoc[]> {
  const col = await getEventsCollection();
  // Backward compatibility: if `published` is missing, treat it as published.
  const events = await col
    .find({ $or: [{ published: true }, { published: { $exists: false } }] })
    .toArray();
  return sortEventsByDate(events);
}

export async function getEventById(id: string): Promise<EventDoc | null> {
  const col = await getEventsCollection();
  if (!ObjectId.isValid(id)) return null;
  return col.findOne({ _id: new ObjectId(id) });
}

export async function getEventByEventId(eventId: string): Promise<EventDoc | null> {
  const col = await getEventsCollection();
  return col.findOne({ eventId });
}

export async function getPublishedEventByEventId(eventId: string): Promise<EventDoc | null> {
  const col = await getEventsCollection();
  // Backward compatibility: if `published` is missing, treat it as published.
  return col.findOne({ eventId, $or: [{ published: true }, { published: { $exists: false } }] });
}

export async function updateEvent(
  id: string,
  data: Partial<Omit<EventDoc, "_id" | "eventId" | "createdAt" | "seatLimit">> & {
    seatLimit?: number | null;
  }
): Promise<EventDoc | null> {
  const col = await getEventsCollection();
  if (!ObjectId.isValid(id)) return null;
  const update: Record<string, unknown> = {};
  const unset: Record<string, ""> = {};
  if (data.eventName !== undefined) update.eventName = data.eventName.trim();
  if (data.description !== undefined) {
    const trimmed = data.description.trim();
    update.description = trimmed || undefined;
  }
  if (data.eventBanner !== undefined) update.eventBanner = data.eventBanner.trim();
  if (data.eventStartDate !== undefined) update.eventStartDate = new Date(data.eventStartDate);
  if (data.eventEndDate !== undefined) update.eventEndDate = new Date(data.eventEndDate);
  if (data.eventTime !== undefined) {
    const trimmed = data.eventTime.trim();
    if (trimmed) update.eventTime = trimmed;
    else unset.eventTime = "";
  }
  if (data.registrationStartDate !== undefined) {
    update.registrationStartDate = data.registrationStartDate ? new Date(data.registrationStartDate) : null;
  }
  if (data.registrationEndDate !== undefined) {
    update.registrationEndDate = data.registrationEndDate ? new Date(data.registrationEndDate) : null;
  }
  if (data.collectTransport !== undefined) update.collectTransport = data.collectTransport;
  if (data.requireTransport !== undefined) update.requireTransport = data.requireTransport;
  if (data.transportLocations !== undefined) update.transportLocations = data.transportLocations;
  if (data.venue !== undefined) update.venue = data.venue.trim();
  if (data.speaker !== undefined) update.speaker = data.speaker.trim();
  if (data.phone !== undefined) update.phone = data.phone.trim();
  if (data.registrationStatus !== undefined) update.registrationStatus = data.registrationStatus;
  if (data.registrationType !== undefined) update.registrationType = data.registrationType;
  if (data.collectApparelSize !== undefined) update.collectApparelSize = data.collectApparelSize;
  if (data.requireApparelSize !== undefined) update.requireApparelSize = data.requireApparelSize;
  if (data.collectOvernightStay !== undefined) update.collectOvernightStay = data.collectOvernightStay;
  if (data.requireOvernightStay !== undefined) update.requireOvernightStay = data.requireOvernightStay;
  if (data.collectPassportNic !== undefined) update.collectPassportNic = data.collectPassportNic;
  if (data.requirePassportNic !== undefined) update.requirePassportNic = data.requirePassportNic;
  if (data.requireWhatsAppNumber !== undefined) update.requireWhatsAppNumber = data.requireWhatsAppNumber;
  if (data.seatLimit !== undefined) {
    if (data.seatLimit === null) {
      unset.seatLimit = "";
    } else {
      update.seatLimit = data.seatLimit;
    }
  }
  if (data.published !== undefined) update.published = data.published;
  const updateOps: Record<string, unknown> = {};
  if (Object.keys(update).length > 0) updateOps.$set = update;
  if (Object.keys(unset).length > 0) updateOps.$unset = unset;
  const result = await col.findOneAndUpdate(
    { _id: new ObjectId(id) },
    updateOps,
    { returnDocument: "after" }
  );
  return result ?? null;
}
