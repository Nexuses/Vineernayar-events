import { getDb } from "../mongodb";
import type { ObjectId } from "mongodb";

export interface AdminDoc {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
}

const COLLECTION = "admins";

export async function getAdminsCollection() {
  const db = await getDb();
  return db.collection<AdminDoc>(COLLECTION);
}

export async function findAdminByEmail(email: string): Promise<AdminDoc | null> {
  const col = await getAdminsCollection();
  return col.findOne({ email: email.toLowerCase().trim() });
}

export async function createAdmin(data: {
  email: string;
  passwordHash: string;
  name: string;
}): Promise<AdminDoc> {
  const col = await getAdminsCollection();
  const doc: AdminDoc = {
    email: data.email.toLowerCase().trim(),
    passwordHash: data.passwordHash,
    name: data.name.trim(),
    createdAt: new Date(),
  };
  const result = await col.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}
