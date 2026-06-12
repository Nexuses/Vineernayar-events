import { getDb } from "../mongodb";
import type { ObjectId } from "mongodb";

export interface EligibleEmailDoc {
  _id?: ObjectId;
  eventId: string;
  email: string;
  createdAt: Date;
}

const COLLECTION = "eligible_emails";

export async function getEligibleEmailsCollection() {
  const db = await getDb();
  return db.collection<EligibleEmailDoc>(COLLECTION);
}

/** List eligible emails for a single event. */
export async function listEligibleByEvent(eventId: string): Promise<EligibleEmailDoc[]> {
  const col = await getEligibleEmailsCollection();
  const all = await col.find({ eventId }).sort({ createdAt: -1 }).toArray();
  const seen = new Set<string>();
  return all.filter((doc) => {
    const key = doc.email.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** List all eligible records (all events). Used for dashboard total count. */
export async function listAllEligible(): Promise<EligibleEmailDoc[]> {
  const col = await getEligibleEmailsCollection();
  return col.find({}).sort({ createdAt: -1 }).toArray();
}

export async function addEligibleEmail(
  eventId: string,
  email: string
): Promise<EligibleEmailDoc> {
  const col = await getEligibleEmailsCollection();
  const normalized = email.toLowerCase().trim();
  const existing = await col.findOne({ eventId, email: normalized });
  if (existing) return existing;
  const doc: EligibleEmailDoc = { eventId, email: normalized, createdAt: new Date() };
  const result = await col.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function addEligibleEmailsBulk(
  eventId: string,
  emails: string[]
): Promise<{ added: number; skipped: number }> {
  let added = 0;
  let skipped = 0;
  const col = await getEligibleEmailsCollection();
  for (const email of emails) {
    const normalized = email.toLowerCase().trim();
    if (!normalized) continue;
    const existing = await col.findOne({ eventId, email: normalized });
    if (existing) {
      skipped++;
      continue;
    }
    const doc: EligibleEmailDoc = { eventId, email: normalized, createdAt: new Date() };
    await col.insertOne(doc);
    added++;
  }
  return { added, skipped };
}

export async function removeEligibleEmail(
  eventId: string,
  email: string
): Promise<boolean> {
  const col = await getEligibleEmailsCollection();
  const result = await col.deleteMany({
    eventId,
    email: email.toLowerCase().trim(),
  });
  return result.deletedCount > 0;
}

/** Check if email is eligible for the given event. */
export async function isEligible(eventId: string, email: string): Promise<boolean> {
  const col = await getEligibleEmailsCollection();
  const doc = await col.findOne({
    eventId,
    email: email.toLowerCase().trim(),
  });
  return !!doc;
}
