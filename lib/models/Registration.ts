import { getDb } from "../mongodb";
import { ObjectId, type Filter } from "mongodb";
import { createInitialEmailSequence, type EmailSequenceStatus } from "../email-sequence";

export type ParticipationStatus = "registered" | "attended";
export type AdmissionStatus = "waitlisted" | "confirmed" | "rejected";
export type BlastAudience = "confirmed" | "waitlisted" | "all";

export interface RegistrationDoc {
  _id?: ObjectId;
  uniqueCode: string;
  eventId: string;
  eventName: string;
  eventStartDate: Date;
  eventEndDate: Date;
  eventTime?: string;
  venue: string;
  firstName: string;
  surname: string;
  email: string;
  organization?: string;
  designation?: string;
  mobileNumber?: string;
  addToWhatsapp: boolean;
  whatsappNumber?: string;
  identityCardOrPassport?: string;
  specialComment?: string;
  /** Whether the attendee has worked with Vineet Nayar before */
  workedWithVineet?: boolean;
  /** Where / how they worked with Vineet Nayar (when workedWithVineet is true) */
  workedWithVineetDetails?: string;
  /** Question the attendee would like to ask at the event */
  questionForVineet?: string;
  agreedToPrivacy: boolean;
  /** Collected when event.collectApparelSize is true */
  apparelSize?: string;
  /** Collected when event.collectOvernightStay is true */
  overnightStay?: boolean;
  /** Collected when event.collectPassportNic is true */
  passportNic?: string;
  /** Collected when event.collectTransport is enabled and user opts-in */
  transportNeeded?: boolean;
  /** Selected transport location (only when transportNeeded is true) */
  transportLocation?: string;
  participationStatus?: ParticipationStatus;
  /** When the attendee was marked as attended (via scan or admin) */
  participationTimestamp?: Date;
  /** Waitlist workflow: new registrations start as waitlisted until admin accepts */
  admissionStatus?: AdmissionStatus;
  admissionUpdatedAt?: Date;
  /** Internal notes added by admin while reviewing waitlist */
  adminNotes?: string;
  /** Automated email communication sequence status */
  emailSequence?: EmailSequenceStatus;
  createdAt: Date;
}

const COLLECTION = "registrations";

export function getAdmissionStatus(reg: RegistrationDoc): AdmissionStatus {
  return reg.admissionStatus ?? "confirmed";
}

export function isConfirmedRegistration(reg: RegistrationDoc): boolean {
  return getAdmissionStatus(reg) === "confirmed";
}

function confirmedAdmissionFilter(): Filter<RegistrationDoc> {
  return {
    $or: [
      { admissionStatus: "confirmed" as const },
      { admissionStatus: { $exists: false } },
    ],
  };
}

function waitlistedAdmissionFilter(): Filter<RegistrationDoc> {
  return { admissionStatus: "waitlisted" as const };
}

function generateUniqueCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function getRegistrationsCollection() {
  const db = await getDb();
  return db.collection<RegistrationDoc>(COLLECTION);
}

export async function listAllRegistrations(): Promise<RegistrationDoc[]> {
  const col = await getRegistrationsCollection();
  return col.find({}).sort({ createdAt: -1 }).toArray();
}

export async function createRegistration(data: Omit<RegistrationDoc, "_id" | "uniqueCode" | "createdAt">): Promise<RegistrationDoc> {
  const col = await getRegistrationsCollection();
  let uniqueCode = generateUniqueCode();
  while (await col.findOne({ uniqueCode })) {
    uniqueCode = generateUniqueCode();
  }
  const doc: RegistrationDoc = {
    ...data,
    uniqueCode,
    participationStatus: "registered",
    admissionStatus: data.admissionStatus ?? "waitlisted",
    emailSequence: createInitialEmailSequence(),
    createdAt: new Date(),
  };
  const result = await col.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function findRegistrationByEventAndEmail(
  eventId: string,
  email: string
): Promise<RegistrationDoc | null> {
  const col = await getRegistrationsCollection();
  return col.findOne({ eventId, email: email.trim().toLowerCase() });
}

export async function updateAdmissionStatus(
  id: string,
  admissionStatus: AdmissionStatus
): Promise<boolean> {
  const col = await getRegistrationsCollection();
  if (!ObjectId.isValid(id)) return false;
  const result = await col.updateOne(
    { _id: new ObjectId(id) },
    { $set: { admissionStatus, admissionUpdatedAt: new Date() } }
  );
  return result.modifiedCount > 0;
}

export async function updateRegistrationAdminNotes(
  id: string,
  adminNotes: string
): Promise<boolean> {
  const col = await getRegistrationsCollection();
  if (!ObjectId.isValid(id)) return false;
  const trimmed = adminNotes.trim();
  const result = await col.updateOne(
    { _id: new ObjectId(id) },
    { $set: { adminNotes: trimmed } }
  );
  return result.matchedCount > 0;
}

export async function updateRegistrationParticipationStatus(
  id: string,
  participationStatus: ParticipationStatus
): Promise<boolean> {
  const col = await getRegistrationsCollection();
  if (!ObjectId.isValid(id)) return false;
  const set: Partial<RegistrationDoc> =
    participationStatus === "attended"
      ? { participationStatus, participationTimestamp: new Date() }
      : { participationStatus, participationTimestamp: undefined };
  const result = await col.updateOne(
    { _id: new ObjectId(id) },
    { $set: set }
  );
  return result.modifiedCount > 0;
}

export async function deleteRegistrationById(id: string): Promise<boolean> {
  const col = await getRegistrationsCollection();
  if (!ObjectId.isValid(id)) return false;
  const result = await col.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

export async function getRegistrationByCode(code: string): Promise<RegistrationDoc | null> {
  const col = await getRegistrationsCollection();
  return col.findOne({ uniqueCode: code.toUpperCase() });
}

export async function getRegistrationById(id: string): Promise<RegistrationDoc | null> {
  const col = await getRegistrationsCollection();
  if (!ObjectId.isValid(id)) return null;
  return col.findOne({ _id: new ObjectId(id) });
}

function nonRejectedAdmissionFilter(): Filter<RegistrationDoc> {
  return {
    $or: [
      { admissionStatus: { $exists: false } },
      { admissionStatus: { $in: ["confirmed", "waitlisted"] as AdmissionStatus[] } },
    ],
  };
}

function audienceFilter(audience: BlastAudience): Filter<RegistrationDoc> {
  if (audience === "confirmed") return confirmedAdmissionFilter();
  if (audience === "waitlisted") return waitlistedAdmissionFilter();
  return nonRejectedAdmissionFilter();
}

export async function listRegistrationsForEmailBlast(
  eventId: string,
  audience: BlastAudience
): Promise<RegistrationDoc[]> {
  const col = await getRegistrationsCollection();
  return col
    .find({ eventId, ...audienceFilter(audience) })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function countRegistrationsForEmailBlast(
  eventId: string,
  audience: BlastAudience
): Promise<number> {
  const col = await getRegistrationsCollection();
  return col.countDocuments({ eventId, ...audienceFilter(audience) });
}

export async function listRegistrationsByEventId(eventId: string): Promise<RegistrationDoc[]> {
  const col = await getRegistrationsCollection();
  return col
    .find({ eventId, ...confirmedAdmissionFilter() })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function listWaitlistedByEventId(eventId: string): Promise<RegistrationDoc[]> {
  const col = await getRegistrationsCollection();
  return col.find({ eventId, ...waitlistedAdmissionFilter() }).sort({ createdAt: -1 }).toArray();
}

export async function countRegistrationsByEventId(eventId: string): Promise<number> {
  const col = await getRegistrationsCollection();
  return col.countDocuments({ eventId, ...confirmedAdmissionFilter() });
}

export async function countWaitlistedByEventId(eventId: string): Promise<number> {
  const col = await getRegistrationsCollection();
  return col.countDocuments({ eventId, ...waitlistedAdmissionFilter() });
}

export async function getRegistrationCountsByEventIds(
  eventIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (eventIds.length === 0) return counts;

  const col = await getRegistrationsCollection();
  const rows = await col
    .aggregate<{ _id: string; count: number }>([
      { $match: { eventId: { $in: eventIds }, ...confirmedAdmissionFilter() } },
      { $group: { _id: "$eventId", count: { $sum: 1 } } },
    ])
    .toArray();

  for (const id of eventIds) counts.set(id, 0);
  for (const row of rows) counts.set(row._id, row.count);
  return counts;
}
