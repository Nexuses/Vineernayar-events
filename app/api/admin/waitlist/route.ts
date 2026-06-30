import { NextResponse } from "next/server";
import { listWaitlistedByEventId } from "@/lib/models/Registration";
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
    const list = await listWaitlistedByEventId(eventId);
    const serialized = list.map((r) => ({
      _id: r._id?.toString(),
      uniqueCode: r.uniqueCode,
      eventId: r.eventId,
      eventName: r.eventName,
      firstName: r.firstName,
      surname: r.surname,
      email: r.email,
      organization: r.organization,
      designation: r.designation,
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
      adminNotes: r.adminNotes ?? "",
      admissionStatus: r.admissionStatus,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    }));
    return NextResponse.json(serialized);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
