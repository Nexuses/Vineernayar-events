import { NextResponse } from "next/server";
import { listRegistrationsByEventId } from "@/lib/models/Registration";
import { serializeEmailSequence } from "@/lib/email-sequence";
import { serializeWhatsAppSequence } from "@/lib/whatsapp-sequence";
import {
  assertEventAccess,
  getAdminSession,
  unauthorizedResponse,
} from "@/lib/admin-access";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });
  const denied = assertEventAccess(session, eventId);
  if (denied) return denied;
  try {
    const list = await listRegistrationsByEventId(eventId);
    const serialized = list.map((r) => ({
      _id: r._id?.toString(),
      uniqueCode: r.uniqueCode,
      eventId: r.eventId,
      eventName: r.eventName,
      firstName: r.firstName,
      surname: r.surname,
      email: r.email,
      organization: r.organization,
      currentDesignation: r.currentDesignation,
      whyAttend: r.whyAttend,
      signedCopyInterested: r.signedCopyInterested,
      mobileNumber: r.mobileNumber,
      workedWithVineet: r.workedWithVineet,
      workedWithVineetDetails: r.workedWithVineetDetails,
      questionForVineet: r.questionForVineet,
      addToWhatsapp: r.addToWhatsapp,
      whatsappNumber: r.whatsappNumber,
      identityCardOrPassport: r.identityCardOrPassport,
      specialComment: r.specialComment,
      apparelSize: r.apparelSize,
      overnightStay: r.overnightStay,
      passportNic: r.passportNic,
      transportNeeded: r.transportNeeded,
      transportLocation: r.transportLocation,
      participationStatus: r.participationStatus || "registered",
      attendanceRsvpStatus: r.attendanceRsvpStatus ?? "pending",
      attendanceRsvpAt:
        r.attendanceRsvpAt instanceof Date
          ? r.attendanceRsvpAt.toISOString()
          : r.attendanceRsvpAt ?? null,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
      participationTimestamp:
        r.participationTimestamp instanceof Date
          ? r.participationTimestamp.toISOString()
          : r.participationTimestamp,
      waitlistEmailStatus: r.waitlistEmailStatus ?? null,
      waitlistEmailSentAt:
        r.waitlistEmailSentAt instanceof Date
          ? r.waitlistEmailSentAt.toISOString()
          : r.waitlistEmailSentAt ?? null,
      waitlistEmailError: r.waitlistEmailError ?? null,
      waitlistWhatsAppStatus: r.waitlistWhatsAppStatus ?? null,
      waitlistWhatsAppSentAt:
        r.waitlistWhatsAppSentAt instanceof Date
          ? r.waitlistWhatsAppSentAt.toISOString()
          : r.waitlistWhatsAppSentAt ?? null,
      waitlistWhatsAppError: r.waitlistWhatsAppError ?? null,
      emailSequence: serializeEmailSequence(r.emailSequence),
      whatsappSequence: serializeWhatsAppSequence(r.whatsappSequence),
    }));
    return NextResponse.json(serialized);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
