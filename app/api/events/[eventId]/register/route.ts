import { NextResponse } from "next/server";
import { getPublishedEventByEventId, getPublicRegistrationStatus } from "@/lib/models/Event";
import { isEligible } from "@/lib/models/EligibleEmail";
import { createRegistration, findRegistrationByEventAndEmail, countRegistrationsByEventId } from "@/lib/models/Registration";
import { sendEmailSequenceForRegistration } from "@/lib/email-sequence-runner";
import { generateIcs } from "@/lib/ics";
import { generateFullPassPdf } from "@/lib/pass-pdf";
import QRCode from "qrcode";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const event = await getPublishedEventByEventId(eventId);
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    if ((await getPublicRegistrationStatus(event)) === "closed") {
      return NextResponse.json({ error: "Registration is closed for this event" }, { status: 403 });
    }

    const body = await request.json();
    const {
      firstName,
      surname,
      email,
      organization,
      designation,
      mobileNumber,
      addToWhatsapp,
      whatsappNumber,
      identityCardOrPassport,
      specialComment,
      apparelSize,
      overnightStay,
      passportNic,
      transportNeeded,
      transportLocation,
      agreedToPrivacy,
    } = body;

    if (!firstName?.trim() || !surname?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "First name, surname and email are required" }, { status: 400 });
    }
    if (!organization?.trim() || !designation?.trim() || !mobileNumber?.trim()) {
      return NextResponse.json(
        { error: "Organization, designation and mobile number are required" },
        { status: 400 }
      );
    }
    if (!agreedToPrivacy) {
      return NextResponse.json({ error: "You must agree to the Privacy Policy" }, { status: 400 });
    }
    if (event.requireWhatsAppNumber && !String(whatsappNumber ?? "").trim()) {
      return NextResponse.json(
        { error: "WhatsApp number is required" },
        { status: 400 }
      );
    }
    if (event.collectApparelSize && event.requireApparelSize && !String(apparelSize ?? "").trim()) {
      return NextResponse.json({ error: "Apparel size is required" }, { status: 400 });
    }
    if (event.collectOvernightStay && event.requireOvernightStay && !overnightStay) {
      return NextResponse.json({ error: "Overnight Stay is required" }, { status: 400 });
    }
    if (event.collectPassportNic && event.requirePassportNic && !String(passportNic ?? "").trim()) {
      return NextResponse.json({ error: "Passport or NIC is required" }, { status: 400 });
    }
    if (
      event.collectTransport &&
      event.requireTransport &&
      typeof transportNeeded !== "boolean"
    ) {
      return NextResponse.json({ error: "Transport is required" }, { status: 400 });
    }

    if (event.collectTransport && transportNeeded) {
      const loc = typeof transportLocation === "string" ? transportLocation.trim() : "";
      if (!loc) {
        return NextResponse.json({ error: "Transport location is required" }, { status: 400 });
      }
    }

    const requireEligible = event.registrationType !== "open_for_all";
    if (requireEligible) {
      const eligible = await isEligible(eventId, email);
      if (!eligible) {
        return NextResponse.json({ error: "This email is not eligible to register for this event" }, { status: 403 });
      }
    }

    const existing = await findRegistrationByEventAndEmail(eventId, email);
    if (existing) {
      return NextResponse.json({ error: "Already registered" }, { status: 409 });
    }

    const addToWhatsappEffective = event.requireWhatsAppNumber ? true : !!addToWhatsapp;
    const whatsappNumberEffective = addToWhatsappEffective ? whatsappNumber?.trim() || undefined : undefined;

    if (event.seatLimit && event.seatLimit > 0) {
      const registrationCount = await countRegistrationsByEventId(eventId);
      if (registrationCount >= event.seatLimit) {
        return NextResponse.json({ error: "Registration is closed for this event" }, { status: 403 });
      }
    }

    const reg = await createRegistration({
      eventId,
      eventName: event.eventName,
      eventStartDate: event.eventStartDate,
      eventEndDate: event.eventEndDate,
      eventTime: event.eventTime,
      venue: event.venue,
      firstName: firstName.trim(),
      surname: surname.trim(),
      email: email.trim().toLowerCase(),
      organization: (organization || "").trim(),
      designation: (designation || "").trim(),
      mobileNumber: (mobileNumber || "").trim(),
      addToWhatsapp: addToWhatsappEffective,
      whatsappNumber: whatsappNumberEffective,
      identityCardOrPassport: identityCardOrPassport?.trim() || undefined,
      specialComment: specialComment?.trim() || undefined,
      apparelSize: apparelSize?.trim() || undefined,
      overnightStay: event.collectOvernightStay ? !!overnightStay : undefined,
      passportNic: passportNic?.trim() || undefined,
      transportNeeded: event.collectTransport ? !!transportNeeded : undefined,
      transportLocation:
        event.collectTransport && transportNeeded && typeof transportLocation === "string"
          ? transportLocation.trim() || undefined
          : undefined,
      agreedToPrivacy: true,
    });

    const baseUrl =
      process.env.SITE_URL ||
      (typeof request.url === "string" ? new URL(request.url).origin : null) ||
      "http://localhost:3000";
    const passUrl = `${baseUrl}/events/${eventId}/pass/${reg.uniqueCode}`;

    let passPdfBuffer: Buffer | undefined;
    let passIcsBuffer: Buffer | undefined;
    let qrBuffer: Buffer | undefined;
    try {
      passPdfBuffer = await generateFullPassPdf({
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
      });
    } catch (err) {
      console.error("Pass generation failed:", err);
    }
    try {
      qrBuffer = await QRCode.toBuffer(reg.uniqueCode, {
        errorCorrectionLevel: "M",
        width: 280,
        margin: 1,
      });
    } catch (err) {
      console.error("QR code generation failed:", err);
    }
    try {
      const icsContent = generateIcs(
        {
          eventName: event.eventName,
          eventStartDate: event.eventStartDate,
          eventEndDate: event.eventEndDate,
          eventTime: event.eventTime,
          venue: event.venue,
          uniqueCode: reg.uniqueCode,
          passUrl,
          attendeeName: `${reg.firstName} ${reg.surname}`,
          attendeeEmail: reg.email,
        },
        eventId
      );
      passIcsBuffer = Buffer.from(icsContent, "utf-8");
    } catch (err) {
      console.error("ICS generation failed:", err);
    }
    try {
      await sendEmailSequenceForRegistration(reg, "seq1", {
        qrBuffer,
        passPdfBuffer,
        passIcsBuffer,
      });
    } catch (err) {
      console.error("Pass email failed:", err);
    }

    return NextResponse.json({
      success: true,
      uniqueCode: reg.uniqueCode,
      registrationId: reg._id?.toString(),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
