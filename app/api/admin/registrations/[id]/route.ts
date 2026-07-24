import { NextResponse } from "next/server";
import {
  updateRegistrationParticipationStatus,
  updateRegistrationFields,
  findRegistrationByEventAndEmail,
  findActiveRegistrationByEventAndMobile,
  getAdmissionStatus,
  deleteRegistrationById,
  getRegistrationById,
} from "@/lib/models/Registration";
import type {
  ParticipationStatus,
  EditableRegistrationFields,
  RegistrationDoc,
} from "@/lib/models/Registration";
import {
  REGISTRATION_FIELD_LIMITS,
  REGISTRATION_DESIGNATION_OTHER,
  isRegistrationDesignationSelection,
  trimToFieldLimit,
  validateRegistrationFieldLengths,
} from "@/lib/registration-field-limits";
import { isAttendeeCategory } from "@/lib/attendee-category";
import { normalizePhoneForOtp } from "@/lib/otp-store";
import {
  assertCanModifyAdminData,
  assertEventAccess,
  getAdminSession,
  unauthorizedResponse,
} from "@/lib/admin-access";

function buildPlaceholderEmail(eventId: string, mobileNumber: string): string {
  const mobileDigits = mobileNumber.replace(/\D/g, "").slice(-10);
  return `manual-${eventId}-${mobileDigits}@hfms.internal`.toLowerCase();
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function handleRegistrationEdit(
  id: string,
  reg: RegistrationDoc,
  fields: Record<string, unknown>
): Promise<NextResponse> {
  const firstName = str(fields.firstName);
  if (!firstName) {
    return NextResponse.json({ error: "First name is required" }, { status: 400 });
  }
  const surname = str(fields.surname);
  const emailRaw = str(fields.email).toLowerCase();
  const city = str(fields.city);
  const organization = str(fields.organization);
  const currentDesignation = str(fields.currentDesignation);
  const designationCustom = str(fields.designation);
  const attendeeCategoryRaw = str(fields.attendeeCategory);
  const adminNotes = str(fields.adminNotes);

  // Mobile — required, normalized to E.164.
  const mobileNormalized = normalizePhoneForOtp(str(fields.mobileNumber));
  if (!mobileNormalized) {
    return NextResponse.json(
      { error: "Enter mobile number in international format, e.g. +91XXXXXXXXXX" },
      { status: 400 }
    );
  }

  if (emailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }
  if (city.length > REGISTRATION_FIELD_LIMITS.city) {
    return NextResponse.json({ error: "City is too long" }, { status: 400 });
  }

  // Designation — optional; when "Other" the custom text is required.
  if (currentDesignation && !isRegistrationDesignationSelection(currentDesignation)) {
    return NextResponse.json({ error: "Invalid designation" }, { status: 400 });
  }
  if (currentDesignation === REGISTRATION_DESIGNATION_OTHER && !designationCustom) {
    return NextResponse.json(
      { error: "Please specify the designation for 'Other'" },
      { status: 400 }
    );
  }

  // Attendee category — optional; must be a known value when provided.
  if (attendeeCategoryRaw && !isAttendeeCategory(attendeeCategoryRaw)) {
    return NextResponse.json({ error: "Invalid attendee category" }, { status: 400 });
  }

  const email = emailRaw || buildPlaceholderEmail(reg.eventId, mobileNormalized);

  const lengthError = validateRegistrationFieldLengths({
    firstName,
    surname,
    email,
    organization: organization || undefined,
    mobileE164: mobileNormalized,
  });
  if (lengthError) {
    return NextResponse.json({ error: lengthError }, { status: 400 });
  }

  // Uniqueness — a real email or the mobile must not collide with a different
  // (non-rejected) registration in the same event.
  if (emailRaw) {
    const clash = await findRegistrationByEventAndEmail(reg.eventId, emailRaw);
    if (
      clash &&
      clash._id?.toString() !== id &&
      getAdmissionStatus(clash) !== "rejected"
    ) {
      return NextResponse.json(
        { error: "This email is already registered for this event" },
        { status: 409 }
      );
    }
  }
  const mobileClash = await findActiveRegistrationByEventAndMobile(reg.eventId, mobileNormalized);
  if (mobileClash && mobileClash._id?.toString() !== id) {
    return NextResponse.json(
      { error: "This mobile number is already registered for this event" },
      { status: 409 }
    );
  }

  const patch: EditableRegistrationFields = {
    firstName: trimToFieldLimit(firstName, REGISTRATION_FIELD_LIMITS.firstName),
    surname: trimToFieldLimit(surname, REGISTRATION_FIELD_LIMITS.surname),
    email,
    mobileNumber: mobileNormalized,
    city: city ? trimToFieldLimit(city, REGISTRATION_FIELD_LIMITS.city) : undefined,
    organization: organization
      ? trimToFieldLimit(organization, REGISTRATION_FIELD_LIMITS.organization)
      : undefined,
    adminNotes: adminNotes || undefined,
  };

  if (!currentDesignation) {
    patch.currentDesignation = undefined;
    patch.designation = undefined;
  } else if (currentDesignation === REGISTRATION_DESIGNATION_OTHER) {
    patch.currentDesignation = currentDesignation;
    patch.designation = trimToFieldLimit(designationCustom, REGISTRATION_FIELD_LIMITS.designation);
  } else {
    patch.currentDesignation = currentDesignation;
    patch.designation = undefined;
  }

  patch.attendeeCategory = attendeeCategoryRaw
    ? (attendeeCategoryRaw as EditableRegistrationFields["attendeeCategory"])
    : undefined;

  await updateRegistrationFields(id, patch);
  return NextResponse.json({ success: true });
}

async function ensureRegistrationAccess(id: string) {
  const session = await getAdminSession();
  if (!session) return { error: unauthorizedResponse() as NextResponse };
  const reg = await getRegistrationById(id);
  if (!reg) return { error: NextResponse.json({ error: "Registration not found" }, { status: 404 }) };
  const denied = assertEventAccess(session, reg.eventId);
  if (denied) return { error: denied };
  return { session, reg };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await ensureRegistrationAccess(id);
    if (access.error) return access.error;
    const blocked = assertCanModifyAdminData(access.session);
    if (blocked) return blocked;

    const body = await request.json();

    // Field edit from the guest list: body carries a `fields` object.
    if (body && typeof body === "object" && body.fields && typeof body.fields === "object") {
      return handleRegistrationEdit(id, access.reg, body.fields as Record<string, unknown>);
    }

    const { participationStatus } = body as { participationStatus?: string };
    if (participationStatus !== "registered" && participationStatus !== "attended") {
      return NextResponse.json({ error: "participationStatus must be 'registered' or 'attended'" }, { status: 400 });
    }
    const ok = await updateRegistrationParticipationStatus(id, participationStatus as ParticipationStatus);
    if (!ok) return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    return NextResponse.json({
      success: true,
      participationStatus,
      participationTimestamp: participationStatus === "attended" ? new Date().toISOString() : null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await ensureRegistrationAccess(id);
    if (access.error) return access.error;
    const blocked = assertCanModifyAdminData(access.session);
    if (blocked) return blocked;

    const ok = await deleteRegistrationById(id);
    if (!ok) return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
