import { NextResponse } from "next/server";
import { getRegistrationByCode, getAdmissionStatus } from "@/lib/models/Registration";
import { getEventByEventId } from "@/lib/models/Event";
import { generateFullPassPdf } from "@/lib/pass-pdf";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const reg = await getRegistrationByCode(code);
    if (!reg) {
      return NextResponse.json({ error: "Pass not found" }, { status: 404 });
    }
    if (getAdmissionStatus(reg) !== "confirmed") {
      return NextResponse.json({ error: "Pass not available until seat is confirmed" }, { status: 403 });
    }

    const event = await getEventByEventId(reg.eventId);

    const pdf = await generateFullPassPdf({
      firstName: reg.firstName,
      surname: reg.surname,
      email: reg.email,
      mobileNumber: reg.mobileNumber,
      eventName: reg.eventName,
      eventStartDate: reg.eventStartDate,
      eventEndDate: reg.eventEndDate,
      eventTime: reg.eventTime,
      venue: reg.venue,
      uniqueCode: reg.uniqueCode,
      createdAt: reg.createdAt,
      showPassQr: event?.showPassQr !== false,
      priorityPass: reg.workedWithVineet === true,
    });

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="event-pass-${reg.uniqueCode}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Pass download error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
