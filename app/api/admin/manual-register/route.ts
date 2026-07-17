import { NextResponse } from "next/server";
import { sendEmailSequenceForRegistration } from "@/lib/email-sequence-runner";
import { getEventByEventId } from "@/lib/models/Event";
import {
  countRegistrationsByEventId,
  createRegistration,
  findActiveRegistrationByEventAndMobile,
  findRegistrationByEventAndEmail,
  getAdmissionStatus,
} from "@/lib/models/Registration";
import { normalizePhoneForOtp } from "@/lib/otp-store";
import {
  REGISTRATION_FIELD_LIMITS,
  trimToFieldLimit,
  validateRegistrationFieldLengths,
} from "@/lib/registration-field-limits";
import {
  assertCanManualRegister,
  assertEventAccess,
  getAdminSession,
  unauthorizedResponse,
} from "@/lib/admin-access";

function buildPlaceholderEmail(eventId: string, mobileNumber: string): string {
  const mobileDigits = mobileNumber.replace(/\D/g, "").slice(-10);
  return `manual-${eventId}-${mobileDigits}@hfms.internal`.toLowerCase();
}

function buildAccompanyingPersonsComment(count: number): string | undefined {
  if (!Number.isFinite(count) || count <= 0) return undefined;
  const label = count === 1 ? "person" : "persons";
  return `Coming with ${count} additional ${label}`;
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();
  const blocked = assertCanManualRegister(session);
  if (blocked) return blocked;

  try {
    const body = await request.json();
    const eventId = typeof body?.eventId === "string" ? body.eventId.trim() : "";
    const firstName = typeof body?.firstName === "string" ? body.firstName.trim() : "";
    const surname = typeof body?.lastName === "string" ? body.lastName.trim() : "";
    const emailRaw = typeof body?.email === "string" ? body.email.trim() : "";
    const cityRaw = typeof body?.city === "string" ? body.city.trim() : "";
    const mobileRaw = typeof body?.mobileNumber === "string" ? body.mobileNumber.trim() : "";
    const accompanyingPersonsRaw = body?.accompanyingPersons;

    if (!eventId) {
      return NextResponse.json({ error: "Event is required" }, { status: 400 });
    }
    if (!firstName) {
      return NextResponse.json({ error: "First name is required" }, { status: 400 });
    }
    if (!surname) {
      return NextResponse.json({ error: "Last name is required" }, { status: 400 });
    }

    const denied = assertEventAccess(session, eventId);
    if (denied) return denied;

    const event = await getEventByEventId(eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const mobileNormalized = normalizePhoneForOtp(mobileRaw);
    if (!mobileNormalized) {
      return NextResponse.json(
        { error: "Enter mobile number in international format, e.g. +91XXXXXXXXXX" },
        { status: 400 }
      );
    }

    const email =
      emailRaw ||
      buildPlaceholderEmail(eventId, mobileNormalized);

    if (emailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    }

    if (cityRaw.length > REGISTRATION_FIELD_LIMITS.city) {
      return NextResponse.json({ error: "City is too long" }, { status: 400 });
    }

    const accompanyingPersons =
      accompanyingPersonsRaw === undefined || accompanyingPersonsRaw === null || accompanyingPersonsRaw === ""
        ? 0
        : Number(accompanyingPersonsRaw);

    if (!Number.isInteger(accompanyingPersons) || accompanyingPersons < 0 || accompanyingPersons > 20) {
      return NextResponse.json(
        { error: "Coming with persons must be a number between 0 and 20" },
        { status: 400 }
      );
    }

    const lengthError = validateRegistrationFieldLengths({
      firstName,
      surname,
      email,
      mobileE164: mobileNormalized,
    });
    if (lengthError) {
      return NextResponse.json({ error: lengthError }, { status: 400 });
    }

    const existingByMobile = await findActiveRegistrationByEventAndMobile(eventId, mobileNormalized);
    if (existingByMobile) {
      return NextResponse.json(
        { error: "This mobile number is already registered for this event" },
        { status: 409 }
      );
    }

    if (emailRaw) {
      const existingByEmail = await findRegistrationByEventAndEmail(eventId, emailRaw);
      if (existingByEmail && getAdmissionStatus(existingByEmail) !== "rejected") {
        return NextResponse.json(
          { error: "This email is already registered for this event" },
          { status: 409 }
        );
      }
    }

    if (event.seatLimit && event.seatLimit > 0) {
      const confirmedCount = await countRegistrationsByEventId(eventId);
      if (confirmedCount >= event.seatLimit) {
        return NextResponse.json({ error: "Event seat limit reached" }, { status: 409 });
      }
    }

    const reg = await createRegistration({
      eventId,
      eventName: event.eventName,
      eventStartDate: event.eventStartDate,
      eventEndDate: event.eventEndDate,
      eventTime: event.eventTime,
      venue: event.venue,
      firstName: trimToFieldLimit(firstName, REGISTRATION_FIELD_LIMITS.firstName),
      surname: trimToFieldLimit(surname, REGISTRATION_FIELD_LIMITS.surname),
      email: email.toLowerCase(),
      mobileNumber: mobileNormalized,
      ...(cityRaw ? { city: trimToFieldLimit(cityRaw, REGISTRATION_FIELD_LIMITS.city) } : {}),
      addToWhatsapp: false,
      agreedToPrivacy: true,
      admissionStatus: "confirmed",
      registrationSource: "manual",
      adminNotes: "Manual registration by admin",
      specialComment: buildAccompanyingPersonsComment(accompanyingPersons),
    });

    let emailSent = false;
    try {
      emailSent = await sendEmailSequenceForRegistration(reg, "seq1");
    } catch (err) {
      console.error("Manual register confirmation email failed:", err);
    }

    return NextResponse.json({
      ok: true,
      registrationId: reg._id?.toString(),
      uniqueCode: reg.uniqueCode,
      emailSent,
    });
  } catch (err) {
    console.error("Manual register error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
