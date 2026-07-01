import { NextResponse } from "next/server";
import { getPublishedEventByParam, getPublicRegistrationStatus } from "@/lib/models/Event";
import { normalizePhoneForOtp, sendOtpCode } from "@/lib/twilio-otp";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId: param } = await params;
    const event = await getPublishedEventByParam(param);
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    if ((await getPublicRegistrationStatus(event)) === "closed") {
      return NextResponse.json({ error: "Registration is closed for this event" }, { status: 403 });
    }

    const body = await request.json();
    const phone = normalizePhoneForOtp(typeof body?.mobileNumber === "string" ? body.mobileNumber : "");
    if (!phone) {
      return NextResponse.json(
        { error: "Enter mobile number in international format, e.g. +91XXXXXXXXXX" },
        { status: 400 }
      );
    }

    await sendOtpCode(phone);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Send OTP error:", err);
    const message = err instanceof Error ? err.message : "Unable to send OTP";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
