import { NextResponse } from "next/server";
import {
  updateRegistrationParticipationStatus,
  deleteRegistrationById,
  getRegistrationById,
} from "@/lib/models/Registration";
import type { ParticipationStatus } from "@/lib/models/Registration";
import {
  assertEventAccess,
  getAdminSession,
  unauthorizedResponse,
} from "@/lib/admin-access";

async function ensureRegistrationAccess(id: string) {
  const session = await getAdminSession();
  if (!session) return { error: unauthorizedResponse() as NextResponse };
  const reg = await getRegistrationById(id);
  if (!reg) return { error: NextResponse.json({ error: "Registration not found" }, { status: 404 }) };
  const denied = assertEventAccess(session, reg.eventId);
  if (denied) return { error: denied };
  return { session, reg };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await ensureRegistrationAccess(id);
    if (access.error) return access.error;

    const body = await request.json();
    const { participationStatus } = body as { participationStatus?: string };
    if (participationStatus !== "registered" && participationStatus !== "attended") {
      return NextResponse.json({ error: "participationStatus must be 'registered' or 'attended'" }, { status: 400 });
    }
    const ok = await updateRegistrationParticipationStatus(id, participationStatus as ParticipationStatus);
    if (!ok) return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    return NextResponse.json({
      success: true,
      participationStatus,
      participationTimestamp: participationStatus === "attended" ? new Date().toISOString() : null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await ensureRegistrationAccess(id);
    if (access.error) return access.error;

    const ok = await deleteRegistrationById(id);
    if (!ok) return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
