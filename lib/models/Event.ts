import { getDb } from "../mongodb";
import { ObjectId } from "mongodb";
import { DEFAULT_EVENT_BANNER_URL } from "../constants";

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
  createdAt: Date;
}

const COLLECTION = "events";

/** Re-export for convenience */
export { DEFAULT_EVENT_BANNER_URL };

export function getEventBannerUrl(doc: { eventBanner?: string | null }): string {
  const url = doc.eventBanner?.trim();
  return url || DEFAULT_EVENT_BANNER_URL;
}

/** Uses the admin-set registrationStatus only (not registration start/end dates). */
export function getEffectiveRegistrationStatus(
  event: Pick<EventDoc, "registrationStatus">
): RegistrationStatus {
  return event.registrationStatus === "closed" ? "closed" : "open";
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

export async function listPublishedEvents(): Promise<EventDoc[]> {
  const col = await getEventsCollection();
  // Backward compatibility: if `published` is missing, treat it as published.
  const cursor = col
    .find({ $or: [{ published: true }, { published: { $exists: false } }] })
    .sort({ createdAt: -1 });
  return cursor.toArray();
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
  data: Partial<Omit<EventDoc, "_id" | "eventId" | "createdAt">>
): Promise<EventDoc | null> {
  const col = await getEventsCollection();
  if (!ObjectId.isValid(id)) return null;
  const update: Record<string, unknown> = {};
  if (data.eventName !== undefined) update.eventName = data.eventName.trim();
  if (data.description !== undefined) {
    const trimmed = data.description.trim();
    update.description = trimmed || undefined;
  }
  if (data.eventBanner !== undefined) update.eventBanner = data.eventBanner.trim();
  if (data.eventStartDate !== undefined) update.eventStartDate = new Date(data.eventStartDate);
  if (data.eventEndDate !== undefined) update.eventEndDate = new Date(data.eventEndDate);
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
  if (data.published !== undefined) update.published = data.published;
  const result = await col.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: update },
    { returnDocument: "after" }
  );
  return result ?? null;
}
