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

type ParsedRow = {
  rowNumber: number;
  name: string;
  firstName: string;
  surname: string;
  email: string;
  mobile: string;
  existing: RegistrationDoc | null;
};

/**
 * Read the file and work out, per row, whether the contact is already
 * registered for this event. Performs no writes and sends nothing, so the same
 * pass backs both the preview and the real upload.
 */
async function classifyRows(
  eventId: string,
  rows: Record<string, string>[]
): Promise<{ valid: ParsedRow[]; issues: RowIssue[] }> {
  const issues: RowIssue[] = [];
  const valid: ParsedRow[] = [];
  const seenEmails = new Set<string>();

  for (let index = 0; index < rows.length; index += 1) {
    // +2 => 1 for the header row, 1 to make it 1-indexed like a spreadsheet.
    const rowNumber = index + 2;
    const row = rows[index];

    const firstName = (row.firstname ?? "").trim();
    const surname = (row.surname ?? row.lastname ?? "").trim();
    const email = (row.email ?? "").trim().toLowerCase();
    const mobileRaw = (row.mobilenumber ?? row.mobile ?? "").trim();

    const name = [firstName, surname].filter(Boolean).join(" ") || email || "—";
    const fail = (error: string) => issues.push({ row: rowNumber, name, error });

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

    const existing = await findRegistrationByEventAndEmail(eventId, email);
    if (!existing && !firstName) {
      fail("First name is required to register a new contact");
      continue;
    }

    valid.push({
      rowNumber,
      name,
      firstName,
      surname,
      email,
      // Mobile is optional: a missing or unparseable number is accepted and the
      // contact is still registered and emailed, just without a phone stored.
      mobile: normalizePhoneForOtp(mobileRaw),
      existing,
    });
  }

  return { valid, issues };
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
    // A dry run reports what would happen without registering or emailing.
    const dryRun = body?.dryRun === true;

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

    const { valid, issues } = await classifyRows(eventId, rows);
    const newContacts = valid.filter((r) => !r.existing);

    if (dryRun) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        total: rows.length,
        willRegister: newContacts.length,
        alreadyRegistered: valid.length - newContacts.length,
        failed: issues.length,
        // Enough to show the admin exactly who is new before anything is sent.
        newContacts: newContacts.slice(0, 100).map((r) => ({
          row: r.rowNumber,
          name: r.name,
          email: r.email,
        })),
        truncatedNewContacts: Math.max(0, newContacts.length - 100),
        issues: issues.slice(0, 50),
        truncatedIssues: Math.max(0, issues.length - 50),
      });
    }

    const col = await getRegistrationsCollection();
    const runIssues: RowIssue[] = [...issues];
    let registered = 0;
    let alreadyRegistered = 0;
    let emailed = 0;
    let emailFailed = 0;

    for (const row of valid) {
      let reg: RegistrationDoc | null = row.existing;

      if (reg) {
        alreadyRegistered += 1;
      } else {
        try {
          reg = await createRegistration({
            eventId,
            eventName: event.eventName,
            eventStartDate: event.eventStartDate,
            eventEndDate: event.eventEndDate,
            eventTime: event.eventTime,
            venue: event.venue,
            firstName: trimToFieldLimit(row.firstName, REGISTRATION_FIELD_LIMITS.firstName),
            surname: trimToFieldLimit(row.surname, REGISTRATION_FIELD_LIMITS.surname),
            email: row.email,
            ...(row.mobile ? { mobileNumber: row.mobile } : {}),
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
          console.error(`Confirm upload row ${row.rowNumber} failed to register:`, err);
          runIssues.push({ row: row.rowNumber, name: row.name, error: "Could not register this contact" });
          continue;
        }
      }

      // Every contact in the file is sent the confirmation email.
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
        console.error(`Confirmation email failed for ${row.email}:`, err);
        emailFailed += 1;
        runIssues.push({
          row: row.rowNumber,
          name: row.name,
          error: "Registered, but the confirmation email could not be sent",
        });
      }
    }

    return NextResponse.json({
      ok: true,
      total: rows.length,
      registered,
      alreadyRegistered,
      emailed,
      emailFailed,
      failed: runIssues.length,
      issues: runIssues.slice(0, 50),
      truncatedIssues: Math.max(0, runIssues.length - 50),
    });
  } catch (err) {
    console.error("Confirm upload error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
