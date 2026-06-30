import { NextResponse } from "next/server";
import {
  getAdmissionStatus,
  getRegistrationById,
  updateAdmissionStatus,
} from "@/lib/models/Registration";
import { sendWaitlistRejectedEmail } from "@/lib/waitlist-email";
import {
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

    const rejectedReg = { ...reg, admissionStatus: "rejected" as const };
    let emailSent = false;
    try {
      emailSent = await sendWaitlistRejectedEmail(rejectedReg);
    } catch (err) {
      console.error("Rejection email failed:", err);
    }

    return NextResponse.json({
      ok: true,
      admissionStatus: "rejected",
      emailSent,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
