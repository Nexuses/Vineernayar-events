import { sendSequenceEmail, type PassEmailData, type SequenceEmailAttachments } from "./email";
import { type EmailSequenceKey, isSequenceDue } from "./email-sequence";
import { buildSequenceRenderContext } from "./email-sequence-template";
import { resolveSequenceWhatsAppMessageText } from "./whatsapp-template-resolve";
import { sendEnablexWhatsAppText } from "./enablex-whatsapp";
import { generateIcs } from "./ics";
import { generateFullPassPdf } from "./pass-pdf";
import { getEventByEventId, type EventDoc } from "./models/Event";
import { getEventPassPath } from "./event-path";
import { getPublicSiteUrl } from "./site-url";
import {
  getRegistrationsCollection,
  listAllRegistrations,
  listRegistrationsByEventId,
  isConfirmedRegistration,
  type RegistrationDoc,
} from "./models/Registration";
import type { WhatsAppSequenceKey } from "./whatsapp-sequence";
import { ObjectId } from "mongodb";

const SEQUENCES_WITH_PASS_ATTACHMENTS = new Set<EmailSequenceKey>(["seq1", "seq2", "seq3"]);

/**
 * Whether emails for this event should carry the pass PDF (default yes).
 * When the event's attachPassToConfirmation flag is false, the pass PDF is
 * omitted from every email — the confirmation and both reminders.
 */
async function shouldAttachPassPdf(eventId: string): Promise<boolean> {
  const event = await getEventByEventId(eventId);
  return event?.attachPassToConfirmation !== false;
}

/** Whether a given automated email is turned on for this event (default yes). */
export function isEmailSequenceEnabled(
  event: EventDoc | null | undefined,
  key: EmailSequenceKey
): boolean {
  return event?.emailsEnabled?.[key] !== false;
}

/** Loads the event and reports whether the given automated email is enabled. */
export async function isEmailEnabledForEvent(
  eventId: string,
  key: EmailSequenceKey
): Promise<boolean> {
  const event = await getEventByEventId(eventId);
  return isEmailSequenceEnabled(event, key);
}

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
  passUrl: string,
  includePdf = true
): Promise<SequenceEmailAttachments> {
  let passPdfBuffer: Buffer | undefined;
  let passIcsBuffer: Buffer | undefined;

  const event = await getEventByEventId(reg.eventId);

  try {
    if (includePdf) {
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
    }
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
        attendeeName: `${reg.firstName} ${reg.surname}`.trim(),
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
      // Per-event: emails can omit the pass PDF (confirmation and both
      // reminders) while still sending the calendar invite and the pass link.
      const includePdf = await shouldAttachPassPdf(reg.eventId);
      emailAttachments =
        opts?.passPdfBuffer || opts?.passIcsBuffer
          ? {
              passPdfBuffer: includePdf ? opts.passPdfBuffer : undefined,
              passIcsBuffer: opts.passIcsBuffer,
            }
          : await buildPassEmailAttachments(reg, passUrl, includePdf);
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
      const includePdf = await shouldAttachPassPdf(reg.eventId);
      emailAttachments = await buildPassEmailAttachments(reg, passUrl, includePdf);
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

/**
 * Manually send one sequence email to every confirmed registration of an event
 * that has not already received it — regardless of the schedule window. Used by
 * the admin "Send now" trigger.
 */
export async function sendSequenceToPendingForEvent(
  eventId: string,
  key: EmailSequenceKey
): Promise<{ attempted: number; sent: number; failed: number }> {
  const registrations = await listRegistrationsByEventId(eventId);
  let attempted = 0;
  let sent = 0;
  let failed = 0;

  for (const reg of registrations) {
    if (reg.emailSequence?.[key]?.status === "sent") continue;
    attempted += 1;
    const ok = await sendEmailSequenceForRegistration(reg, key);
    if (ok) sent += 1;
    else failed += 1;
  }

  return { attempted, sent, failed };
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

  // Cache events so each is loaded once per run, not once per registration.
  const eventCache = new Map<string, EventDoc | null>();
  const getEvent = async (eventId: string) => {
    if (!eventCache.has(eventId)) eventCache.set(eventId, await getEventByEventId(eventId));
    return eventCache.get(eventId) ?? null;
  };

  for (const reg of registrations) {
    if (!isConfirmedRegistration(reg)) continue;

    const event = await getEvent(reg.eventId);

    // Schedule against the event's CURRENT dates, not the copy stored on the
    // registration when it was created. Otherwise rescheduling an event leaves
    // existing registrations scheduled off the old date — which would fire a
    // reminder or the post-event thank-you at the wrong time.
    const scheduleReg: RegistrationDoc = event
      ? {
          ...reg,
          eventStartDate: event.eventStartDate,
          eventEndDate: event.eventEndDate,
          eventTime: event.eventTime,
        }
      : reg;

    for (const key of ["seq2", "seq3", "seq4"] as EmailSequenceKey[]) {
      const current = reg.emailSequence?.[key];
      if (current?.status === "sent") continue;
      // Skip emails the event has turned off.
      if (!isEmailSequenceEnabled(event, key)) continue;
      if (!isSequenceDue(key, scheduleReg, now)) continue;

      processed += 1;
      const ok = await sendEmailSequenceForRegistration(reg, key);
      if (ok) sent += 1;
      else failed += 1;
    }
  }

  return { processed, sent, failed };
}
