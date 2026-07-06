import { sendSequenceEmail, type PassEmailData, type SequenceEmailAttachments } from "./email";
import { type EmailSequenceKey, isSequenceDue } from "./email-sequence";
import { buildSequenceRenderContext } from "./email-sequence-template";
import { resolveSequenceWhatsAppMessageText } from "./whatsapp-template-resolve";
import { sendEnablexWhatsAppText } from "./enablex-whatsapp";
import { generateIcs } from "./ics";
import { generateFullPassPdf } from "./pass-pdf";
import { getEventByEventId } from "./models/Event";
import { getEventPassPath } from "./event-path";
import { getPublicSiteUrl } from "./site-url";
import {
  getRegistrationsCollection,
  listAllRegistrations,
  isConfirmedRegistration,
  type RegistrationDoc,
} from "./models/Registration";
import type { WhatsAppSequenceKey } from "./whatsapp-sequence";
import { ObjectId } from "mongodb";

const SEQUENCES_WITH_PASS_ATTACHMENTS = new Set<EmailSequenceKey>(["seq1", "seq2", "seq3"]);

async function buildPassUrl(eventId: string, uniqueCode: string): Promise<string> {
  const base = getPublicSiteUrl();
  const event = await getEventByEventId(eventId);
  if (event) return `${base}${getEventPassPath(event, uniqueCode)}`;
  return `${base}/events/${eventId}/pass/${uniqueCode}`;
}

function toPassEmailData(reg: RegistrationDoc, passUrl: string): PassEmailData {
  return {
    to: reg.email,
    firstName: reg.firstName,
    surname: reg.surname,
    mobileNumber: reg.mobileNumber,
    email: reg.email,
    eventId: reg.eventId,
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
    priorityPass: reg.workedWithVineet === true,
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
      priorityPass: reg.workedWithVineet === true,
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

export async function updateWhatsAppSequenceStatus(
  registrationId: string,
  key: WhatsAppSequenceKey,
  status: "pending" | "sent" | "failed",
  error?: string
): Promise<boolean> {
  const col = await getRegistrationsCollection();
  if (!ObjectId.isValid(registrationId)) return false;

  const entry: { status: typeof status; sentAt?: Date; error?: string } = { status };
  if (status === "sent") entry.sentAt = new Date();
  if (error) entry.error = error;

  const result = await col.updateOne(
    { _id: new ObjectId(registrationId) },
    { $set: { [`whatsappSequence.${key}`]: entry } }
  );
  return result.matchedCount > 0;
}

export async function sendWhatsAppSequenceForRegistration(
  reg: RegistrationDoc,
  key: WhatsAppSequenceKey,
  passUrl: string
): Promise<boolean> {
  const id = reg._id?.toString();
  if (!id) return false;
  const targetNumber = reg.whatsappNumber || reg.mobileNumber || "";
  if (!targetNumber.trim()) {
    await updateWhatsAppSequenceStatus(id, key, "failed", "No WhatsApp number on registration");
    return false;
  }

  try {
    const renderCtx = buildSequenceRenderContext({
      firstName: reg.firstName,
      eventName: reg.eventName,
      eventStartDate:
        reg.eventStartDate instanceof Date
          ? reg.eventStartDate.toISOString()
          : String(reg.eventStartDate),
      eventEndDate:
        reg.eventEndDate instanceof Date ? reg.eventEndDate.toISOString() : String(reg.eventEndDate),
      eventTime: reg.eventTime,
      venue: reg.venue,
      passUrl,
      priorityPass: reg.workedWithVineet === true,
    });
    const message = await resolveSequenceWhatsAppMessageText(key, renderCtx, reg.eventId);
    const result = await sendEnablexWhatsAppText({
      to: targetNumber,
      message: message.slice(0, 3900),
    });
    await updateWhatsAppSequenceStatus(
      id,
      key,
      result.ok ? "sent" : "failed",
      result.ok ? undefined : result.error || "WhatsApp delivery failed"
    );
    return result.ok;
  } catch (err) {
    const message = err instanceof Error ? err.message : "WhatsApp send failed";
    await updateWhatsAppSequenceStatus(id, key, "failed", message);
    return false;
  }
}

export async function sendEmailSequenceForRegistration(
  reg: RegistrationDoc,
  key: EmailSequenceKey,
  opts?: {
    passPdfBuffer?: Buffer;
    passIcsBuffer?: Buffer;
  }
): Promise<boolean> {
  const passUrl = await buildPassUrl(reg.eventId, reg.uniqueCode);
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
    await sendWhatsAppSequenceForRegistration(reg, key, passUrl);

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

export async function sendTestEmailSequenceForRegistration(
  reg: RegistrationDoc,
  key: EmailSequenceKey
): Promise<{ ok: boolean; error?: string; sentTo?: string }> {
  const passUrl = await buildPassUrl(reg.eventId, reg.uniqueCode);
  const data = toPassEmailData(reg, passUrl);

  try {
    let emailAttachments: SequenceEmailAttachments | undefined;

    if (SEQUENCES_WITH_PASS_ATTACHMENTS.has(key)) {
      emailAttachments = await buildPassEmailAttachments(reg, passUrl);
    }

    const ok = await sendSequenceEmail(data, key, emailAttachments);
    if (!ok) {
      return { ok: false, error: "Email delivery failed. Check mail configuration." };
    }

    return { ok: true, sentTo: reg.email };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Send failed";
    return { ok: false, error: message };
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
    if (!isConfirmedRegistration(reg)) continue;

    for (const key of ["seq2", "seq3", "seq4"] as EmailSequenceKey[]) {
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
