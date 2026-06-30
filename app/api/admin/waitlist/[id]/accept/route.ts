import { NextResponse } from "next/server";
import { sendEmailSequenceForRegistration } from "@/lib/email-sequence-runner";
import { getEventByEventId } from "@/lib/models/Event";
import {
  countRegistrationsByEventId,
  getAdmissionStatus,
  getRegistrationById,
  updateAdmissionStatus,
} from "@/lib/models/Registration";
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

    const event = await getEventByEventId(reg.eventId);
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    if (event.seatLimit && event.seatLimit > 0) {
      const confirmedCount = await countRegistrationsByEventId(reg.eventId);
      if (confirmedCount >= event.seatLimit) {
        return NextResponse.json({ error: "Event seat limit reached" }, { status: 409 });
      }
    }

    const updated = await updateAdmissionStatus(id, "confirmed");
    if (!updated) {
      return NextResponse.json({ error: "Unable to update registration" }, { status: 500 });
    }

    const confirmedReg = { ...reg, admissionStatus: "confirmed" as const };
    let emailSent = false;
    try {
      emailSent = await sendEmailSequenceForRegistration(confirmedReg, "seq1");
    } catch (err) {
      console.error("Confirmation email failed on accept:", err);
    }

    return NextResponse.json({
      ok: true,
      admissionStatus: "confirmed",
      emailSent,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
