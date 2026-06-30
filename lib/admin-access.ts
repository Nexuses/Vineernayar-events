import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAdminFromCookie } from "@/lib/auth";
import {
  type AdminDoc,
  findAdminById,
  getAdminRole,
  isSuperAdmin,
} from "@/lib/models/Admin";
import { listEvents } from "@/lib/models/Event";
import type { EventDoc } from "@/lib/models/Event";

export type AdminSession = AdminDoc & { _id: ObjectId };

export { getAdminRole, isSuperAdmin };

export async function getAdminSession(): Promise<AdminSession | null> {
  const payload = await getAdminFromCookie();
  if (!payload?.id) return null;
  const admin = await findAdminById(payload.id);
  if (!admin?._id) return null;
  return admin as AdminSession;
}

export function canAccessEvent(admin: AdminDoc, eventId: string): boolean {
  if (isSuperAdmin(admin)) return true;
  return (admin.assignedEventIds ?? []).includes(eventId);
}

export function canEditEvents(admin: AdminDoc): boolean {
  return isSuperAdmin(admin);
}

export function assertCanEditEvents(admin: AdminDoc): NextResponse | null {
  if (!canEditEvents(admin)) {
    return forbiddenResponse("Only super admins can edit events");
  }
  return null;
}

export function forbiddenResponse(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function assertEventAccess(admin: AdminDoc, eventId: string): NextResponse | null {
  if (!canAccessEvent(admin, eventId)) return forbiddenResponse();
  return null;
}

export async function listEventsForAdmin(admin: AdminDoc): Promise<EventDoc[]> {
  const events = await listEvents();
  if (isSuperAdmin(admin)) return events;
  const assigned = new Set(admin.assignedEventIds ?? []);
  return events.filter((e) => assigned.has(e.eventId));
}

export function serializeAdminPublic(admin: AdminDoc) {
  return {
    id: admin._id?.toString(),
    email: admin.email,
    name: admin.name,
    role: getAdminRole(admin),
    assignedEventIds: admin.assignedEventIds ?? [],
    createdAt: admin.createdAt instanceof Date ? admin.createdAt.toISOString() : admin.createdAt,
  };
}
