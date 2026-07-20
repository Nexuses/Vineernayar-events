import { NextResponse } from "next/server";
import { getEventByEventId } from "@/lib/models/Event";
import {
  countRegistrationsByEventId,
  createRegistration,
  findActiveRegistrationByEventAndMobile,
  findRegistrationByEventAndEmail,
  getAdmissionStatus,
} from "@/lib/models/Registration";
import { parseAttendeeCategoryInput } from "@/lib/attendee-category";
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
import { parseCsvObjects } from "@/lib/csv-parse";

/** Guard against oversized pastes/uploads. */
const MAX_ROWS = 1000;

type RowResult = { row: number; name: string; error: string };

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
    const csvText = typeof body?.csv === "string" ? body.csv : "";

    if (!eventId) {
      return NextResponse.json({ error: "Event is required" }, { status: 400 });
    }
    if (!csvText.trim()) {
      return NextResponse.json({ error: "CSV file is empty" }, { status: 400 });
    }

    const denied = assertEventAccess(session, eventId);
    if (denied) return denied;

    const event = await getEventByEventId(eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const { headers, rows } = parseCsvObjects(csvText);
    if (headers.length === 0 || rows.length === 0) {
      return NextResponse.json(
        { error: "No data rows found. Download the sample CSV and use the same column headers." },
        { status: 400 }
      );
    }
    if (rows.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `Too many rows (${rows.length}). Upload at most ${MAX_ROWS} at a time.` },
        { status: 400 }
      );
    }
    if (!("firstname" in rows[0]) || !("mobilenumber" in rows[0])) {
      return NextResponse.json(
        {
          error:
            "CSV must include at least 'First Name' and 'Mobile Number' columns. Download the sample CSV for the expected format.",
        },
        { status: 400 }
      );
    }

    // Seat limit applies to confirmed registrations. Imported rows land on the
    // waitlist, so they do not consume seats here — but a full event is still
    // worth surfacing to the admin as a warning after the import.
    const seatLimit = event.seatLimit && event.seatLimit > 0 ? event.seatLimit : null;

    const errors: RowResult[] = [];
    // Track within-file duplicates so a file containing the same mobile twice
    // does not create two registrations.
    const seenMobiles = new Set<string>();
    const seenEmails = new Set<string>();
    let created = 0;

    for (let index = 0; index < rows.length; index += 1) {
      // +2 => 1 for the header row, 1 to make it 1-indexed like a spreadsheet.
      const rowNumber = index + 2;
      const row = rows[index];

      const firstName = (row.firstname ?? "").trim();
      const surname = (row.lastname ?? row.surname ?? "").trim();
      const emailRaw = (row.email ?? "").trim();
      const cityRaw = (row.city ?? "").trim();
      const mobileRaw = (row.mobilenumber ?? row.mobile ?? "").trim();
      const categoryRaw = (row.attendeecategory ?? "").trim();
      const accompanyingRaw = (row.comingwithhowmanypersons ?? row.accompanyingpersons ?? "").trim();

      const label = [firstName, surname].filter(Boolean).join(" ") || emailRaw || mobileRaw || "—";
      const fail = (error: string) => errors.push({ row: rowNumber, name: label, error });

      if (!firstName) {
        fail("First name is required");
        continue;
      }

      const mobileNormalized = normalizePhoneForOtp(mobileRaw);
      if (!mobileNormalized) {
        fail("Mobile number must be in international format, e.g. +91XXXXXXXXXX");
        continue;
      }

      if (emailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
        fail("Invalid email address");
        continue;
      }

      if (cityRaw.length > REGISTRATION_FIELD_LIMITS.city) {
        fail("City is too long");
        continue;
      }

      const category = parseAttendeeCategoryInput(categoryRaw);
      if (category === "invalid") {
        fail(`Attendee Category must be 'VIP' or 'HCL / Other' (got '${categoryRaw}')`);
        continue;
      }

      const accompanyingPersons = accompanyingRaw === "" ? 0 : Number(accompanyingRaw);
      if (
        !Number.isInteger(accompanyingPersons) ||
        accompanyingPersons < 0 ||
        accompanyingPersons > 20
      ) {
        fail("Coming with how many persons must be a whole number between 0 and 20");
        continue;
      }

      const lengthError = validateRegistrationFieldLengths({
        firstName,
        surname,
        email: emailRaw || buildPlaceholderEmail(eventId, mobileNormalized),
        mobileE164: mobileNormalized,
      });
      if (lengthError) {
        fail(lengthError);
        continue;
      }

      if (seenMobiles.has(mobileNormalized)) {
        fail("Duplicate mobile number within this file");
        continue;
      }
      if (emailRaw && seenEmails.has(emailRaw.toLowerCase())) {
        fail("Duplicate email within this file");
        continue;
      }

      const existingByMobile = await findActiveRegistrationByEventAndMobile(
        eventId,
        mobileNormalized
      );
      if (existingByMobile) {
        fail("This mobile number is already registered for this event");
        continue;
      }

      if (emailRaw) {
        const existingByEmail = await findRegistrationByEventAndEmail(eventId, emailRaw);
        if (existingByEmail && getAdmissionStatus(existingByEmail) !== "rejected") {
          fail("This email is already registered for this event");
          continue;
        }
      }

      const email = emailRaw || buildPlaceholderEmail(eventId, mobileNormalized);

      try {
        await createRegistration({
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
          ...(category ? { attendeeCategory: category } : {}),
          addToWhatsapp: false,
          agreedToPrivacy: true,
          // Imported rows stay on the waitlist. No confirmation email is sent
          // here — that happens when an admin accepts them from the waitlist.
          admissionStatus: "waitlisted",
          registrationSource: "manual",
          adminNotes: "Bulk CSV import by admin",
          specialComment: buildAccompanyingPersonsComment(accompanyingPersons),
        });
        created += 1;
        seenMobiles.add(mobileNormalized);
        if (emailRaw) seenEmails.add(emailRaw.toLowerCase());
      } catch (err) {
        console.error(`Bulk import row ${rowNumber} failed:`, err);
        fail("Could not save this row");
      }
    }

    let warning: string | undefined;
    if (seatLimit) {
      const confirmedCount = await countRegistrationsByEventId(eventId);
      if (confirmedCount >= seatLimit) {
        warning = `This event has reached its seat limit (${seatLimit} confirmed). Imported guests are on the waitlist and will need seats freed before they can be accepted.`;
      }
    }

    return NextResponse.json({
      ok: true,
      created,
      failed: errors.length,
      total: rows.length,
      errors: errors.slice(0, 50),
      truncatedErrors: Math.max(0, errors.length - 50),
      warning,
    });
  } catch (err) {
    console.error("Bulk manual register error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
