import { NextResponse } from "next/server";
import {
  sendEmailSequenceForRegistration,
  isEmailEnabledForEvent,
} from "@/lib/email-sequence-runner";
import { getEventByEventId } from "@/lib/models/Event";
import {
  countRegistrationsByEventId,
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
    const admissionStatus = getAdmissionStatus(reg);
    if (admissionStatus !== "waitlisted" && admissionStatus !== "rejected") {
      return NextResponse.json(
        { error: "Only pending or rejected waitlist entries can be accepted" },
        { status: 400 }
      );
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
      // Only send the confirmation if it is turned on for this event.
      if (await isEmailEnabledForEvent(confirmedReg.eventId, "seq1")) {
        emailSent = await sendEmailSequenceForRegistration(confirmedReg, "seq1");
      }
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
