import { NextResponse } from "next/server";
import { getPublishedEventByParam, getPublicRegistrationStatus } from "@/lib/models/Event";
import { isEligible } from "@/lib/models/EligibleEmail";
import {
  createRegistration,
  findRegistrationByEventAndEmail,
  getAdmissionStatus,
} from "@/lib/models/Registration";
import { sendWaitlistThankYouEmail } from "@/lib/waitlist-email";
import { checkOtpCode, normalizePhoneForOtp } from "@/lib/twilio-otp";
import { validateRegistrationFieldLengths, isRegistrationProfile } from "@/lib/registration-field-limits";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId: param } = await params;
    const event = await getPublishedEventByParam(param);
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const eventId = event.eventId;

    if ((await getPublicRegistrationStatus(event)) === "closed") {
      return NextResponse.json({ error: "Registration is closed for this event" }, { status: 403 });
    }

    const body = await request.json();
    const {
      firstName,
      surname,
      email,
      mobileNumber,
      organization,
      designation,
      workedWithVineet,
      workedWithVineetDetails,
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
      otpCode,
    } = body;

    if (!firstName?.trim() || !surname?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "First name, surname and email are required" }, { status: 400 });
    }
    const mobileNormalized = normalizePhoneForOtp(typeof mobileNumber === "string" ? mobileNumber : "");
    const lengthError = validateRegistrationFieldLengths({
      firstName: String(firstName),
      surname: String(surname),
      email: String(email),
      organization: typeof organization === "string" ? organization : undefined,
      mobileE164: mobileNormalized || undefined,
    });
    if (lengthError) {
      return NextResponse.json({ error: lengthError }, { status: 400 });
    }
    const organizationTrimmed =
      typeof organization === "string" ? organization.trim() : "";
    const profileValue = typeof designation === "string" ? designation.trim() : "";
    if (profileValue && !isRegistrationProfile(profileValue)) {
      return NextResponse.json({ error: "Invalid profile selection" }, { status: 400 });
    }
    const workedWithVineetProvided =
      workedWithVineet !== undefined && workedWithVineet !== null && workedWithVineet !== "";
    if (!workedWithVineetProvided || typeof workedWithVineet !== "boolean") {
      return NextResponse.json(
        { error: "Please answer whether you have worked, studied, or partnered with Vineet Nayar" },
        { status: 400 }
      );
    }
    const workedWithVineetValue = workedWithVineet;
    if (workedWithVineetValue === true) {
      const details =
        typeof workedWithVineetDetails === "string" ? workedWithVineetDetails.trim() : "";
      if (!details) {
        return NextResponse.json(
          { error: "Please tell us more about where or how you connected" },
          { status: 400 }
        );
      }
    }
    if (!mobileNormalized) {
      return NextResponse.json(
        { error: "Mobile number is required in international format (e.g. +91XXXXXXXXXX)" },
        { status: 400 }
      );
    }
    const otpTrimmed = typeof otpCode === "string" ? otpCode.trim() : "";
    if (!otpTrimmed) {
      return NextResponse.json({ error: "OTP is required" }, { status: 400 });
    }
    const otpOk = await checkOtpCode(mobileNormalized, otpTrimmed);
    if (!otpOk) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
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
    if (existing && getAdmissionStatus(existing) !== "rejected") {
      return NextResponse.json({ error: "Already registered" }, { status: 409 });
    }

    const addToWhatsappEffective = event.requireWhatsAppNumber ? true : !!addToWhatsapp;
    const whatsappNumberEffective = addToWhatsappEffective ? whatsappNumber?.trim() || undefined : undefined;

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
      mobileNumber: mobileNormalized,
      organization: organizationTrimmed || undefined,
      designation: profileValue || undefined,
      workedWithVineet: workedWithVineetValue,
      workedWithVineetDetails:
        workedWithVineetValue === true
          ? (typeof workedWithVineetDetails === "string" ? workedWithVineetDetails.trim() : "")
          : undefined,
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
      admissionStatus: "waitlisted",
    });

    let emailSent = false;
    try {
      emailSent = await sendWaitlistThankYouEmail(reg);
    } catch (err) {
      console.error("Waitlist thank-you email failed:", err);
    }

    return NextResponse.json({
      success: true,
      waitlisted: true,
      emailSent,
      uniqueCode: reg.uniqueCode,
      registrationId: reg._id?.toString(),
      ...(emailSent
        ? {}
        : {
            emailWarning:
              "Registration saved, but the waitlist email could not be sent. Contact the organizer if you do not receive it.",
          }),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
