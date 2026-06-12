import { NextResponse } from "next/server";
import { getAdminFromCookie } from "@/lib/auth";
import { listRegistrationsByEventId } from "@/lib/models/Registration";

export async function GET(request: Request) {
  const admin = await getAdminFromCookie();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });
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
      designation: r.designation,
      mobileNumber: r.mobileNumber,
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
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
      participationTimestamp:
        r.participationTimestamp instanceof Date
          ? r.participationTimestamp.toISOString()
          : r.participationTimestamp,
    }));
    return NextResponse.json(serialized);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
