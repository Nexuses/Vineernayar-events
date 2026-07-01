import { NextResponse } from "next/server";
import { getPublishedEventByParam, getPublicRegistrationStatus } from "@/lib/models/Event";
import { isEligible } from "@/lib/models/EligibleEmail";
import { findRegistrationByEventAndEmail } from "@/lib/models/Registration";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId: param } = await params;
    const event = await getPublishedEventByParam(param);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if ((await getPublicRegistrationStatus(event)) === "closed") {
      return NextResponse.json({ eligible: false, registrationClosed: true }, { status: 403 });
    }
    const { email } = await request.json();
    if (!email?.trim()) {
      return NextResponse.json({ eligible: false, error: "Email required" }, { status: 400 });
    }
    const normalized = email.trim().toLowerCase();
    const alreadyRegistered = await findRegistrationByEventAndEmail(event.eventId, normalized);
    if (alreadyRegistered) {
      return NextResponse.json({ eligible: true, alreadyRegistered: true });
    }
    if (event.registrationType === "open_for_all") {
      return NextResponse.json({ eligible: true });
    }
    const eligible = await isEligible(event.eventId, email);
    return NextResponse.json({ eligible });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
