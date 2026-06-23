import { sendSequenceEmail, type PassEmailData, type SequenceEmailAttachments } from "./email";
import { type EmailSequenceKey, isSequenceDue } from "./email-sequence";
import { generateIcs } from "./ics";
import { generateFullPassPdf } from "./pass-pdf";
import { getEventByEventId } from "./models/Event";
import {
  getRegistrationsCollection,
  listAllRegistrations,
  type RegistrationDoc,
} from "./models/Registration";
import { ObjectId } from "mongodb";

const SEQUENCES_WITH_PASS_ATTACHMENTS = new Set<EmailSequenceKey>(["seq1", "seq2", "seq3"]);

function buildPassUrl(eventId: string, uniqueCode: string): string {
  const base =
    process.env.SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
  return `${base}/events/${eventId}/pass/${uniqueCode}`;
}

function toPassEmailData(reg: RegistrationDoc, passUrl: string): PassEmailData {
  return {
    to: reg.email,
    firstName: reg.firstName,
    surname: reg.surname,
    mobileNumber: reg.mobileNumber,
    email: reg.email,
    eventName: reg.eventName,
    eventStartDate:
      reg.eventStartDate instanceof Date
        ? reg.eventStartDate.toISOString()
        : String(reg.eventStartDate),
    eventEndDate:
      reg.eventEndDate instanceof Date
        ? reg.eventEndDate.toISOString()
        : String(reg.eventEndDate),
    eventTime: reg.eventTime,
    venue: reg.venue,
    createdAt:
      reg.createdAt instanceof Date
        ? reg.createdAt.toISOString()
        : String(reg.createdAt),
    passUrl,
    uniqueCode: reg.uniqueCode,
  };
}

async function buildPassEmailAttachments(
  reg: RegistrationDoc,
  passUrl: string
): Promise<SequenceEmailAttachments> {
  let passPdfBuffer: Buffer | undefined;
  let passIcsBuffer: Buffer | undefined;

  const event = await getEventByEventId(reg.eventId);

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
      showPassQr: event?.showPassQr !== false,
    });
  } catch (err) {
    console.error("Pass PDF generation for email failed:", err);
  }

  try {
    const icsContent = generateIcs(
      {
        eventName: reg.eventName,
        eventStartDate: reg.eventStartDate,
        eventEndDate: reg.eventEndDate,
        eventTime: reg.eventTime,
        venue: reg.venue,
        uniqueCode: reg.uniqueCode,
        passUrl,
        attendeeName: `${reg.firstName} ${reg.surname}`,
        attendeeEmail: reg.email,
      },
      reg.eventId
    );
    passIcsBuffer = Buffer.from(icsContent, "utf-8");
  } catch (err) {
    console.error("ICS generation for email failed:", err);
  }

  return { passPdfBuffer, passIcsBuffer };
}

export async function updateEmailSequenceStatus(
  registrationId: string,
  key: EmailSequenceKey,
  status: "pending" | "sent" | "failed",
  error?: string
): Promise<boolean> {
  const col = await getRegistrationsCollection();
  if (!ObjectId.isValid(registrationId)) return false;

  const entry: { status: typeof status; sentAt?: Date; error?: string } = {
    status,
  };
  if (status === "sent") entry.sentAt = new Date();
  if (error) entry.error = error;

  const result = await col.updateOne(
    { _id: new ObjectId(registrationId) },
    { $set: { [`emailSequence.${key}`]: entry } }
  );
  return result.matchedCount > 0;
}

export async function sendEmailSequenceForRegistration(
  reg: RegistrationDoc,
  key: EmailSequenceKey,
  opts?: {
    passPdfBuffer?: Buffer;
    passIcsBuffer?: Buffer;
  }
): Promise<boolean> {
  const passUrl = buildPassUrl(reg.eventId, reg.uniqueCode);
  const data = toPassEmailData(reg, passUrl);
  const id = reg._id?.toString();
  if (!id) return false;

  try {
    let emailAttachments: SequenceEmailAttachments | undefined;

    if (SEQUENCES_WITH_PASS_ATTACHMENTS.has(key)) {
      emailAttachments =
        opts?.passPdfBuffer || opts?.passIcsBuffer
          ? {
              passPdfBuffer: opts.passPdfBuffer,
              passIcsBuffer: opts.passIcsBuffer,
            }
          : await buildPassEmailAttachments(reg, passUrl);
    }

    const ok = await sendSequenceEmail(data, key, emailAttachments);

    await updateEmailSequenceStatus(
      id,
      key,
      ok ? "sent" : "failed",
      ok ? undefined : "Email delivery failed"
    );
    return ok;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Send failed";
    await updateEmailSequenceStatus(id, key, "failed", message);
    return false;
  }
}

export async function processDueEmailSequences(now: Date = new Date()): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  const registrations = await listAllRegistrations();
  let processed = 0;
  let sent = 0;
  let failed = 0;

  for (const reg of registrations) {
    for (const key of ["seq2", "seq3", "seq4", "seq5"] as EmailSequenceKey[]) {
      const current = reg.emailSequence?.[key];
      if (current?.status === "sent") continue;
      if (!isSequenceDue(key, reg, now)) continue;

      processed += 1;
      const ok = await sendEmailSequenceForRegistration(reg, key);
      if (ok) sent += 1;
      else failed += 1;
    }
  }

  return { processed, sent, failed };
}
