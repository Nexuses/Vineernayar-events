import { getDb } from "../mongodb";
import { ObjectId, type ObjectId as ObjectIdType } from "mongodb";

export type AdminRole = "superadmin" | "manager";

/** Legacy DB value before role rename */
type LegacyAdminRole = "event_user";

export interface AdminDoc {
  _id?: ObjectIdType;
  email: string;
  passwordHash: string;
  name: string;
  role?: AdminRole | LegacyAdminRole;
  assignedEventIds?: string[];
  createdAt: Date;
  createdBy?: ObjectIdType;
}

const COLLECTION = "admins";

export function normalizeAdminRole(role?: string): AdminRole {
  if (role === "superadmin") return "superadmin";
  if (role === "manager" || role === "event_user") return "manager";
  return "superadmin";
}

export function getAdminRole(admin: AdminDoc): AdminRole {
  return normalizeAdminRole(admin.role);
}

export function isSuperAdmin(admin: AdminDoc): boolean {
  return getAdminRole(admin) === "superadmin";
}

export function isManager(admin: AdminDoc): boolean {
  return getAdminRole(admin) === "manager";
}

export async function getAdminsCollection() {
  const db = await getDb();
  return db.collection<AdminDoc>(COLLECTION);
}

export async function findAdminByEmail(email: string): Promise<AdminDoc | null> {
  const col = await getAdminsCollection();
  return col.findOne({ email: email.toLowerCase().trim() });
}

export async function findAdminById(id: string): Promise<AdminDoc | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await getAdminsCollection();
  return col.findOne({ _id: new ObjectId(id) });
}

export async function countAdmins(): Promise<number> {
  const col = await getAdminsCollection();
  return col.countDocuments();
}

export async function listAdmins(): Promise<AdminDoc[]> {
  const col = await getAdminsCollection();
  return col.find({}).sort({ createdAt: -1 }).toArray();
}

export async function createAdmin(data: {
  email: string;
  passwordHash: string;
  name: string;
  role?: AdminRole;
  assignedEventIds?: string[];
  createdBy?: ObjectIdType;
}): Promise<AdminDoc> {
  const col = await getAdminsCollection();
  const role = data.role ?? "manager";
  const assignedEventIds =
    role === "superadmin" ? [] : (data.assignedEventIds ?? []).map((id) => id.trim()).filter(Boolean);

  const doc: AdminDoc = {
    email: data.email.toLowerCase().trim(),
    passwordHash: data.passwordHash,
    name: data.name.trim(),
    role,
    assignedEventIds,
    createdAt: new Date(),
    createdBy: data.createdBy,
  };
  const result = await col.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function updateAdmin(
  id: string,
  data: {
    name?: string;
    role?: AdminRole;
    assignedEventIds?: string[];
    passwordHash?: string;
  }
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await getAdminsCollection();
  const update: Partial<AdminDoc> = {};

  if (data.name !== undefined) update.name = data.name.trim();
  if (data.passwordHash !== undefined) update.passwordHash = data.passwordHash;
  if (data.role !== undefined) {
    update.role = data.role;
    if (data.role === "superadmin") {
      update.assignedEventIds = [];
    }
  }
  if (data.assignedEventIds !== undefined) {
    update.assignedEventIds = data.assignedEventIds.map((eid) => eid.trim()).filter(Boolean);
  }

  if (Object.keys(update).length === 0) return true;

  const result = await col.updateOne({ _id: new ObjectId(id) }, { $set: update });
  return result.matchedCount > 0;
}

export async function deleteAdmin(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await getAdminsCollection();
  const result = await col.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}
