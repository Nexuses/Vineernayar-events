import { NextResponse } from "next/server";
import { getPublishedEventByEventId, getEffectiveRegistrationStatus } from "@/lib/models/Event";
import { isEligible } from "@/lib/models/EligibleEmail";
import { findRegistrationByEventAndEmail } from "@/lib/models/Registration";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const event = await getPublishedEventByEventId(eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (getEffectiveRegistrationStatus(event) === "closed") {
      return NextResponse.json({ eligible: false, registrationClosed: true }, { status: 403 });
    }
    const { email } = await request.json();
    if (!email?.trim()) {
      return NextResponse.json({ eligible: false, error: "Email required" }, { status: 400 });
    }
    const normalized = email.trim().toLowerCase();
    const alreadyRegistered = await findRegistrationByEventAndEmail(eventId, normalized);
    if (alreadyRegistered) {
      return NextResponse.json({ eligible: true, alreadyRegistered: true });
    }
    if (event.registrationType === "open_for_all") {
      return NextResponse.json({ eligible: true });
    }
    const eligible = await isEligible(eventId, email);
    return NextResponse.json({ eligible });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
