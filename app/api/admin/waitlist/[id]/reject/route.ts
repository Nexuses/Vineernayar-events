import { NextResponse } from "next/server";
import {
  getAdmissionStatus,
  getRegistrationById,
  updateAdmissionStatus,
} from "@/lib/models/Registration";
import {
  assertCanModifyAdminData,
  assertEventAccess,
  getAdminSession,
  unauthorizedResponse,
} from "@/lib/admin-access";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();
  const blocked = assertCanModifyAdminData(session);
  if (blocked) return blocked;

  try {
    const { id } = await params;
    const reg = await getRegistrationById(id);
    if (!reg) return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    const denied = assertEventAccess(session, reg.eventId);
    if (denied) return denied;
    if (getAdmissionStatus(reg) !== "waitlisted") {
      return NextResponse.json({ error: "Registration is not on the waitlist" }, { status: 400 });
    }

    const updated = await updateAdmissionStatus(id, "rejected");
    if (!updated) {
      return NextResponse.json({ error: "Unable to update registration" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      admissionStatus: "rejected",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
