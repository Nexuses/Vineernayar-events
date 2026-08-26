import { NextResponse } from "next/server";
import { getEventByEventId } from "@/lib/models/Event";
import {
  createRegistration,
  findRegistrationByEventAndEmail,
  getRegistrationsCollection,
  type RegistrationDoc,
} from "@/lib/models/Registration";
import { sendConfirmationEmail } from "@/lib/confirmation-email";
import { normalizePhoneForOtp } from "@/lib/otp-store";
import {
  REGISTRATION_FIELD_LIMITS,
  trimToFieldLimit,
} from "@/lib/registration-field-limits";
import {
  assertCanManualRegister,
  assertEventAccess,
  getAdminSession,
  unauthorizedResponse,
} from "@/lib/admin-access";
import { parseCsvObjects } from "@/lib/csv-parse";

/** Guard against oversized uploads. */
const MAX_ROWS = 2000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RowIssue = { row: number; name: string; error: string };

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
    if (!("email" in rows[0])) {
      return NextResponse.json(
        {
          error:
            "CSV must include an 'Email' column. Expected headers: First Name, Surname, Email, Mobile Number.",
        },
        { status: 400 }
      );
    }

    const col = await getRegistrationsCollection();
    const issues: RowIssue[] = [];
    const seenEmails = new Set<string>();
    let registered = 0;
    let alreadyRegistered = 0;
    let emailed = 0;
    let emailFailed = 0;

    for (let index = 0; index < rows.length; index += 1) {
      // +2 => 1 for the header row, 1 to make it 1-indexed like a spreadsheet.
      const rowNumber = index + 2;
      const row = rows[index];

      const firstName = (row.firstname ?? "").trim();
      const surname = (row.surname ?? row.lastname ?? "").trim();
      const email = (row.email ?? "").trim().toLowerCase();
      const mobileRaw = (row.mobilenumber ?? row.mobile ?? "").trim();

      const label = [firstName, surname].filter(Boolean).join(" ") || email || "—";
      const fail = (error: string) => issues.push({ row: rowNumber, name: label, error });

      if (!email) {
        fail("Email is required");
        continue;
      }
      if (!EMAIL_RE.test(email)) {
        fail("Invalid email address");
        continue;
      }
      if (seenEmails.has(email)) {
        fail("Duplicate email within this file");
        continue;
      }
      seenEmails.add(email);

      // Mobile is optional here: a contact with a missing or unparseable number
      // is still registered and emailed, just without a phone number stored.
      const mobileNormalized = normalizePhoneForOtp(mobileRaw);

      let reg: RegistrationDoc | null = await findRegistrationByEventAndEmail(eventId, email);

      if (reg) {
        alreadyRegistered += 1;
      } else {
        if (!firstName) {
          fail("First name is required to register a new contact");
          continue;
        }
        try {
          reg = await createRegistration({
            eventId,
            eventName: event.eventName,
            eventStartDate: event.eventStartDate,
            eventEndDate: event.eventEndDate,
            eventTime: event.eventTime,
            venue: event.venue,
            firstName: trimToFieldLimit(firstName, REGISTRATION_FIELD_LIMITS.firstName),
            surname: trimToFieldLimit(surname, REGISTRATION_FIELD_LIMITS.surname),
            email,
            ...(mobileNormalized ? { mobileNumber: mobileNormalized } : {}),
            addToWhatsapp: false,
            agreedToPrivacy: true,
            // Uploaded contacts are attending guests, so they are registered
            // directly rather than placed on the waitlist.
            admissionStatus: "confirmed",
            registrationSource: "manual",
            adminNotes: "Added via Confirm module upload",
          });
          registered += 1;
        } catch (err) {
          console.error(`Confirm upload row ${rowNumber} failed to register:`, err);
          fail("Could not register this contact");
          continue;
        }
      }

      // Every uploaded contact is sent the confirmation email.
      try {
        await sendConfirmationEmail(event, reg);
        emailed += 1;
        if (reg._id) {
          await col.updateOne(
            { _id: reg._id },
            { $set: { confirmationEmailSentAt: new Date() } }
          );
        }
      } catch (err) {
        console.error(`Confirmation email failed for ${email}:`, err);
        emailFailed += 1;
        fail("Registered, but the confirmation email could not be sent");
      }
    }

    return NextResponse.json({
      ok: true,
      total: rows.length,
      registered,
      alreadyRegistered,
      emailed,
      emailFailed,
      failed: issues.length,
      issues: issues.slice(0, 50),
      truncatedIssues: Math.max(0, issues.length - 50),
    });
  } catch (err) {
    console.error("Confirm upload error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
