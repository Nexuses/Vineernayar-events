import { getDb } from "../mongodb";
import { ObjectId } from "mongodb";
import type { BlastAudience } from "./Registration";

export interface EmailBlastLogDoc {
  _id?: ObjectId;
  eventId: string;
  eventName: string;
  cityLabel?: string;
  audience: BlastAudience;
  subject: string;
  total: number;
  sent: number;
  failed: number;
  sentAt: Date;
  sentBy: string;
}

const COLLECTION = "email_blast_logs";

export async function getEmailBlastLogsCollection() {
  const db = await getDb();
  return db.collection<EmailBlastLogDoc>(COLLECTION);
}

export async function createEmailBlastLog(
  data: Omit<EmailBlastLogDoc, "_id" | "sentAt">
): Promise<EmailBlastLogDoc> {
  const col = await getEmailBlastLogsCollection();
  const doc: EmailBlastLogDoc = { ...data, sentAt: new Date() };
  const result = await col.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function listEmailBlastLogsByEventIds(
  eventIds: string[]
): Promise<EmailBlastLogDoc[]> {
  if (eventIds.length === 0) return [];
  const col = await getEmailBlastLogsCollection();
  return col
    .find({ eventId: { $in: eventIds } })
    .sort({ sentAt: -1 })
    .toArray();
}
