import { getDb } from "../mongodb";
import { ObjectId } from "mongodb";

export type ParticipationStatus = "registered" | "attended";

export interface RegistrationDoc {
  _id?: ObjectId;
  uniqueCode: string;
  eventId: string;
  eventName: string;
  eventStartDate: Date;
  eventEndDate: Date;
  venue: string;
  firstName: string;
  surname: string;
  email: string;
  organization: string;
  designation: string;
  mobileNumber: string;
  addToWhatsapp: boolean;
  whatsappNumber?: string;
  identityCardOrPassport?: string;
  specialComment?: string;
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
  createdAt: Date;
}

const COLLECTION = "registrations";

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

export async function listRegistrationsByEventId(eventId: string): Promise<RegistrationDoc[]> {
  const col = await getRegistrationsCollection();
  return col.find({ eventId }).sort({ createdAt: -1 }).toArray();
}
