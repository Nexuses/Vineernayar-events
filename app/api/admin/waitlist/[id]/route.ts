import { NextResponse } from "next/server";
import {
  getAdmissionStatus,
  getRegistrationById,
  updateRegistrationAdminNotes,
} from "@/lib/models/Registration";
import {
  assertEventAccess,
  getAdminSession,
  unauthorizedResponse,
} from "@/lib/admin-access";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();

  try {
    const { id } = await params;
    const reg = await getRegistrationById(id);
    if (!reg) return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    const denied = assertEventAccess(session, reg.eventId);
    if (denied) return denied;
    if (getAdmissionStatus(reg) !== "waitlisted") {
      return NextResponse.json({ error: "Registration is not on the waitlist" }, { status: 400 });
    }

    const body = await request.json();
    const adminNotes = typeof body?.adminNotes === "string" ? body.adminNotes : "";
    const ok = await updateRegistrationAdminNotes(id, adminNotes);
    if (!ok) return NextResponse.json({ error: "Unable to save notes" }, { status: 500 });

    return NextResponse.json({
      ok: true,
      adminNotes: adminNotes.trim() || "",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
