import { getDb } from "../mongodb";
import { ObjectId, type Filter } from "mongodb";
import {
  createInitialEmailSequence,
  EMAIL_SEQUENCE_ORDER,
  type EmailSequenceKey,
  type EmailSequenceStatus,
} from "../email-sequence";
import {
  createInitialWhatsAppSequence,
  type WhatsAppSequenceStatus,
} from "../whatsapp-sequence";
import type { AttendeeCategory } from "../attendee-category";
import {
  FIRST_ROUND,
  type ConfirmationRound,
  type ConfirmationRoundStatus,
} from "../confirmation-rounds";

export type { ConfirmationRound, ConfirmationRoundStatus };

export type { AttendeeCategory };

export type ParticipationStatus = "registered" | "attended";
export type AdmissionStatus = "waitlisted" | "confirmed" | "rejected";
export type AttendanceRsvpStatus = "pending" | "reconfirmed" | "declined";
export type BlastAudience = "confirmed" | "waitlisted" | "all";
export type RegistrationSource = "manual" | "online";

export interface RegistrationDoc {
  _id?: ObjectId;
  uniqueCode: string;
  eventId: string;
  eventName: string;
  eventStartDate: Date;
  eventEndDate: Date;
  eventTime?: string;
  venue: string;
  firstName: string;
  surname: string;
  email: string;
  /** City (optional; collected on manual admin registration) */
  city?: string;
  /** How this registration was created */
  registrationSource?: RegistrationSource;
  /** Attendee category (VIP / HCL-Other); collected on manual admin registration only */
  attendeeCategory?: AttendeeCategory;
  organization?: string;
  currentDesignation?: string;
  designation?: string;
  whyAttend?: string;
  signedCopyInterested?: boolean;
  mobileNumber?: string;
  addToWhatsapp: boolean;
  whatsappNumber?: string;
  identityCardOrPassport?: string;
  specialComment?: string;
  /** Whether the attendee has worked with Vineet Nayar before */
  workedWithVineet?: boolean;
  /** Where / how they worked with Vineet Nayar (when workedWithVineet is true) */
  workedWithVineetDetails?: string;
  /** Question the attendee would like to ask at the event */
  questionForVineet?: string;
  agreedToPrivacy: boolean;
  /** Collected when event.collectApparelSize is true */
  apparelSize?: string;
  /** Collected when event.collectOvernightStay is true */
  overnightStay?: boolean;
  /** Collected when event.collectPassportNic is true */
  passportNic?: string;
  /** Collected when event.collectTransport is enabled and user opts-in */
  transportNeeded?: boolean;
  /** Selected transport location (only when transportNeeded is true) */
  transportLocation?: string;
  participationStatus?: ParticipationStatus;
  /** When the attendee was marked as attended (via scan or admin) */
  participationTimestamp?: Date;
  /** RSVP from 2-day reminder emails */
  attendanceRsvpStatus?: AttendanceRsvpStatus;
  attendanceRsvpAt?: Date;
  /** Waitlist workflow: new registrations start as waitlisted until admin accepts */
  admissionStatus?: AdmissionStatus;
  admissionUpdatedAt?: Date;
  /** Internal notes added by admin while reviewing waitlist */
  adminNotes?: string;
  /** Automated email communication sequence status */
  emailSequence?: EmailSequenceStatus;
  /** Automated WhatsApp communication sequence status */
  whatsappSequence?: WhatsAppSequenceStatus;
  /** Initial waitlist acknowledgement email status (on registration) */
  waitlistEmailStatus?: "pending" | "sent" | "failed";
  waitlistEmailSentAt?: Date;
  waitlistEmailError?: string;
  /** Initial waitlist acknowledgement WhatsApp status (on registration) */
  waitlistWhatsAppStatus?: "pending" | "sent" | "failed";
  waitlistWhatsAppSentAt?: Date;
  waitlistWhatsAppError?: string;
  /** Set when this registration receives an admin email blast */
  lastEmailBlastAt?: Date;
  /**
   * When the round-1 re-confirmation email was last sent to this attendee.
   * Rounds 2 and above are tracked in confirmationRounds.
   */
  confirmationEmailSentAt?: Date;
  /**
   * Confirmation rounds beyond the first (Reconfirm onwards). Round 1
   * remains in attendanceRsvpStatus / attendanceRsvpAt / confirmationEmailSentAt
   * for backward compatibility; read through lib/confirmation-rounds helpers.
   */
  confirmationRounds?: ConfirmationRound[];
  createdAt: Date;
}

const COLLECTION = "registrations";

export function getAdmissionStatus(reg: RegistrationDoc): AdmissionStatus {
  return reg.admissionStatus ?? "confirmed";
}

export function isConfirmedRegistration(reg: RegistrationDoc): boolean {
  return getAdmissionStatus(reg) === "confirmed";
}

export function isActiveConfirmedRegistration(reg: RegistrationDoc): boolean {
  return isConfirmedRegistration(reg) && reg.attendanceRsvpStatus !== "declined";
}

function confirmedAdmissionFilter(): Filter<RegistrationDoc> {
  return {
    $or: [
      { admissionStatus: "confirmed" as const },
      { admissionStatus: { $exists: false } },
    ],
  };
}

function activeConfirmedAdmissionFilter(): Filter<RegistrationDoc> {
  return {
    $and: [
      confirmedAdmissionFilter(),
      {
        $or: [
          { attendanceRsvpStatus: { $exists: false } },
          { attendanceRsvpStatus: { $in: ["pending", "reconfirmed"] as AttendanceRsvpStatus[] } },
        ],
      },
    ],
  };
}

function waitlistedAdmissionFilter(): Filter<RegistrationDoc> {
  return { admissionStatus: "waitlisted" as const };
}

function generateUniqueCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function getRegistrationsCollection() {
  const db = await getDb();
  return db.collection<RegistrationDoc>(COLLECTION);
}

export async function listAllRegistrations(): Promise<RegistrationDoc[]> {
  const col = await getRegistrationsCollection();
  return col.find({}).sort({ createdAt: -1 }).toArray();
}

export async function createRegistration(data: Omit<RegistrationDoc, "_id" | "uniqueCode" | "createdAt">): Promise<RegistrationDoc> {
  const col = await getRegistrationsCollection();
  let uniqueCode = generateUniqueCode();
  while (await col.findOne({ uniqueCode })) {
    uniqueCode = generateUniqueCode();
  }
  const doc: RegistrationDoc = {
    ...data,
    uniqueCode,
    participationStatus: "registered",
    admissionStatus: data.admissionStatus ?? "waitlisted",
    emailSequence: createInitialEmailSequence(),
    whatsappSequence: createInitialWhatsAppSequence(),
    createdAt: new Date(),
  };
  const result = await col.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function findRegistrationByEventAndEmail(
  eventId: string,
  email: string
): Promise<RegistrationDoc | null> {
  const col = await getRegistrationsCollection();
  return col.findOne({ eventId, email: email.trim().toLowerCase() });
}

export async function findActiveRegistrationByEventAndMobile(
  eventId: string,
  mobileNumber: string
): Promise<RegistrationDoc | null> {
  const col = await getRegistrationsCollection();
  const normalized = mobileNumber.trim();
  if (!normalized) return null;

  return col.findOne({
    eventId,
    mobileNumber: normalized,
    $or: [
      { admissionStatus: { $exists: false } },
      { admissionStatus: { $in: ["confirmed", "waitlisted"] as AdmissionStatus[] } },
    ],
  });
}

/**
 * Fields an admin may edit on an existing registration from the guest list.
 *
 * The event fields (eventId + denormalized event details) are only set when an
 * attendee is transferred to a different event.
 */
export type EditableRegistrationFields = Partial<
  Pick<
    RegistrationDoc,
    | "firstName"
    | "surname"
    | "email"
    | "mobileNumber"
    | "city"
    | "organization"
    | "currentDesignation"
    | "designation"
    | "attendeeCategory"
    | "adminNotes"
    | "eventId"
    | "eventName"
    | "eventStartDate"
    | "eventEndDate"
    | "eventTime"
    | "venue"
  >
>;

/**
 * Copy an event's current details onto every registration for that event.
 *
 * Registrations denormalize the event name/date/time/venue at creation time, so
 * rescheduling an event would otherwise leave existing registrations (and their
 * passes and email scheduling) pinned to the old date. Called whenever an event
 * update changes one of these fields.
 *
 * Returns the number of registrations updated.
 */
export async function syncEventDetailsToRegistrations(
  eventId: string,
  details: {
    eventName?: string;
    eventStartDate?: Date;
    eventEndDate?: Date;
    eventTime?: string;
    venue?: string;
  }
): Promise<number> {
  const col = await getRegistrationsCollection();

  const set: Record<string, unknown> = {};
  const unset: Record<string, ""> = {};
  if (details.eventName !== undefined) set.eventName = details.eventName;
  if (details.eventStartDate !== undefined) set.eventStartDate = details.eventStartDate;
  if (details.eventEndDate !== undefined) set.eventEndDate = details.eventEndDate;
  if (details.venue !== undefined) set.venue = details.venue;
  if (details.eventTime !== undefined) {
    if (details.eventTime) set.eventTime = details.eventTime;
    else unset.eventTime = "";
  }

  const ops: Record<string, unknown> = {};
  if (Object.keys(set).length > 0) ops.$set = set;
  if (Object.keys(unset).length > 0) ops.$unset = unset;
  if (Object.keys(ops).length === 0) return 0;

  const result = await col.updateMany({ eventId }, ops);
  return result.modifiedCount;
}

/**
 * Record that the confirmation email for a round was sent.
 * Round 1 keeps using the legacy field; later rounds go in confirmationRounds.
 */
export async function markConfirmationEmailSent(
  id: ObjectId,
  round: number
): Promise<void> {
  const col = await getRegistrationsCollection();
  const now = new Date();

  if (round === FIRST_ROUND) {
    await col.updateOne({ _id: id }, { $set: { confirmationEmailSentAt: now } });
    return;
  }

  // Update the round in place when present, otherwise append it.
  const updated = await col.updateOne(
    { _id: id, "confirmationRounds.round": round },
    { $set: { "confirmationRounds.$.emailSentAt": now } }
  );
  if (updated.matchedCount === 0) {
    await col.updateOne(
      { _id: id },
      { $push: { confirmationRounds: { round, status: "pending", emailSentAt: now } } }
    );
  }
}

/** Record an attendee's answer for a round. */
export async function setConfirmationRoundStatus(
  id: string,
  round: number,
  status: ConfirmationRoundStatus
): Promise<boolean> {
  const col = await getRegistrationsCollection();
  if (!ObjectId.isValid(id)) return false;
  const _id = new ObjectId(id);
  const now = new Date();

  if (round === FIRST_ROUND) {
    const r = await col.updateOne(
      { _id },
      { $set: { attendanceRsvpStatus: status, attendanceRsvpAt: now } }
    );
    return r.matchedCount > 0;
  }

  const updated = await col.updateOne(
    { _id, "confirmationRounds.round": round },
    { $set: { "confirmationRounds.$.status": status, "confirmationRounds.$.respondedAt": now } }
  );
  if (updated.matchedCount > 0) return true;

  const pushed = await col.updateOne(
    { _id },
    { $push: { confirmationRounds: { round, status, respondedAt: now } } }
  );
  return pushed.matchedCount > 0;
}

/** The date-driven emails: the two reminders and the post-event thank you. */
const DATE_BASED_SEQUENCE_KEYS: EmailSequenceKey[] = ["seq2", "seq3", "seq4"];

/**
 * Re-arm the date-driven emails for an event after it has been rescheduled.
 *
 * The reminders and thank-you are scheduled relative to the event date, so once
 * the date moves, any that already went out for the old date are reset to
 * pending and will fire again at the correct time relative to the new date.
 * Nothing is sent here — this only re-arms the schedule.
 *
 * The registration confirmation (seq1) is deliberately untouched: it confirms a
 * registration rather than announcing a date.
 *
 * Returns the number of registrations re-armed.
 */
export async function reArmDateBasedSequencesForEvent(eventId: string): Promise<number> {
  const col = await getRegistrationsCollection();
  const set: Record<string, unknown> = {};
  for (const key of DATE_BASED_SEQUENCE_KEYS) {
    // Reset both channels so their reported status matches what will be sent.
    set[`emailSequence.${key}`] = { status: "pending" };
    set[`whatsappSequence.${key}`] = { status: "pending" };
  }
  const result = await col.updateMany({ eventId }, { $set: set });
  return result.modifiedCount;
}

/**
 * Update the editable contact/profile fields of a registration.
 *
 * Keys present in `patch` are set; keys explicitly set to undefined are unset
 * (removed from the document), so clearing an optional field works.
 */
export async function updateRegistrationFields(
  id: string,
  patch: EditableRegistrationFields
): Promise<boolean> {
  const col = await getRegistrationsCollection();
  if (!ObjectId.isValid(id)) return false;

  const set: Record<string, unknown> = {};
  const unset: Record<string, ""> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) {
      unset[key] = "";
    } else {
      set[key] = value;
    }
  }

  const update: Record<string, unknown> = {};
  if (Object.keys(set).length > 0) update.$set = set;
  if (Object.keys(unset).length > 0) update.$unset = unset;
  if (Object.keys(update).length === 0) return false;

  const result = await col.updateOne({ _id: new ObjectId(id) }, update);
  return result.matchedCount > 0;
}

export async function updateAdmissionStatus(
  id: string,
  admissionStatus: AdmissionStatus
): Promise<boolean> {
  const col = await getRegistrationsCollection();
  if (!ObjectId.isValid(id)) return false;
  const result = await col.updateOne(
    { _id: new ObjectId(id) },
    { $set: { admissionStatus, admissionUpdatedAt: new Date() } }
  );
  return result.modifiedCount > 0;
}

export async function updateRegistrationAdminNotes(
  id: string,
  adminNotes: string
): Promise<boolean> {
  const col = await getRegistrationsCollection();
  if (!ObjectId.isValid(id)) return false;
  const trimmed = adminNotes.trim();
  const result = await col.updateOne(
    { _id: new ObjectId(id) },
    { $set: { adminNotes: trimmed } }
  );
  return result.matchedCount > 0;
}

export async function updateWaitlistNotificationStatus(
  id: string,
  patch: Partial<
    Pick<
      RegistrationDoc,
      | "waitlistEmailStatus"
      | "waitlistEmailSentAt"
      | "waitlistEmailError"
      | "waitlistWhatsAppStatus"
      | "waitlistWhatsAppSentAt"
      | "waitlistWhatsAppError"
    >
  >
): Promise<boolean> {
  const col = await getRegistrationsCollection();
  if (!ObjectId.isValid(id)) return false;
  const result = await col.updateOne({ _id: new ObjectId(id) }, { $set: patch });
  return result.matchedCount > 0;
}

export async function updateAttendanceRsvpStatus(
  id: string,
  attendanceRsvpStatus: AttendanceRsvpStatus
): Promise<boolean> {
  const col = await getRegistrationsCollection();
  if (!ObjectId.isValid(id)) return false;
  const result = await col.updateOne(
    { _id: new ObjectId(id) },
    { $set: { attendanceRsvpStatus, attendanceRsvpAt: new Date() } }
  );
  return result.modifiedCount > 0;
}

export async function updateRegistrationParticipationStatus(
  id: string,
  participationStatus: ParticipationStatus
): Promise<boolean> {
  const col = await getRegistrationsCollection();
  if (!ObjectId.isValid(id)) return false;
  const set: Partial<RegistrationDoc> =
    participationStatus === "attended"
      ? { participationStatus, participationTimestamp: new Date() }
      : { participationStatus, participationTimestamp: undefined };
  const result = await col.updateOne(
    { _id: new ObjectId(id) },
    { $set: set }
  );
  return result.modifiedCount > 0;
}

export async function deleteRegistrationById(id: string): Promise<boolean> {
  const col = await getRegistrationsCollection();
  if (!ObjectId.isValid(id)) return false;
  const result = await col.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

export async function getRegistrationByCode(code: string): Promise<RegistrationDoc | null> {
  const col = await getRegistrationsCollection();
  return col.findOne({ uniqueCode: code.toUpperCase() });
}

export async function getRegistrationById(id: string): Promise<RegistrationDoc | null> {
  const col = await getRegistrationsCollection();
  if (!ObjectId.isValid(id)) return null;
  return col.findOne({ _id: new ObjectId(id) });
}

function nonRejectedAdmissionFilter(): Filter<RegistrationDoc> {
  return {
    $or: [
      { admissionStatus: { $exists: false } },
      { admissionStatus: { $in: ["confirmed", "waitlisted"] as AdmissionStatus[] } },
    ],
  };
}

function audienceFilter(audience: BlastAudience): Filter<RegistrationDoc> {
  if (audience === "confirmed") return activeConfirmedAdmissionFilter();
  if (audience === "waitlisted") return waitlistedAdmissionFilter();
  return nonRejectedAdmissionFilter();
}

export async function listRegistrationsForEmailBlast(
  eventId: string,
  audience: BlastAudience
): Promise<RegistrationDoc[]> {
  const col = await getRegistrationsCollection();
  return col
    .find({ eventId, ...audienceFilter(audience) })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function countRegistrationsForEmailBlast(
  eventId: string,
  audience: BlastAudience
): Promise<number> {
  const col = await getRegistrationsCollection();
  return col.countDocuments({ eventId, ...audienceFilter(audience) });
}

export async function markRegistrationsBlasted(registrationIds: ObjectId[]): Promise<void> {
  if (registrationIds.length === 0) return;
  const col = await getRegistrationsCollection();
  const now = new Date();
  await col.updateMany(
    { _id: { $in: registrationIds } },
    { $set: { lastEmailBlastAt: now } }
  );
}

export async function listRegistrationsByEventId(eventId: string): Promise<RegistrationDoc[]> {
  const col = await getRegistrationsCollection();
  return col
    .find({ eventId, ...confirmedAdmissionFilter() })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function listWaitlistedByEventId(eventId: string): Promise<RegistrationDoc[]> {
  const col = await getRegistrationsCollection();
  return col.find({ eventId, ...waitlistedAdmissionFilter() }).sort({ createdAt: -1 }).toArray();
}

/** Waitlisted plus accepted/rejected entries for the admin waitlist review table. */
export async function listWaitlistReviewByEventId(eventId: string): Promise<RegistrationDoc[]> {
  const col = await getRegistrationsCollection();
  return col
    .find({
      eventId,
      admissionStatus: { $in: ["waitlisted", "confirmed", "rejected"] as AdmissionStatus[] },
    })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function countRegistrationsByEventId(eventId: string): Promise<number> {
  const col = await getRegistrationsCollection();
  return col.countDocuments({ eventId, ...activeConfirmedAdmissionFilter() });
}

export async function countWaitlistedByEventId(eventId: string): Promise<number> {
  const col = await getRegistrationsCollection();
  return col.countDocuments({ eventId, ...waitlistedAdmissionFilter() });
}

export type EmailSequenceStat = {
  /** Send was attempted (delivered or failed). */
  triggered: number;
  sent: number;
  failed: number;
  /** Scheduled but not yet attempted. */
  pending: number;
  total: number;
};

/**
 * Per-email-type delivery stats over confirmed registrations. When eventIds is
 * given, stats are limited to those events; otherwise all confirmed
 * registrations are counted.
 */
export async function getEmailSequenceStats(
  eventIds?: string[]
): Promise<{ total: number; perSeq: Record<EmailSequenceKey, EmailSequenceStat> }> {
  const col = await getRegistrationsCollection();
  const filter: Filter<RegistrationDoc> = eventIds
    ? { eventId: { $in: eventIds }, ...confirmedAdmissionFilter() }
    : confirmedAdmissionFilter();

  const regs = await col.find(filter, { projection: { emailSequence: 1 } }).toArray();

  const perSeq = {} as Record<EmailSequenceKey, EmailSequenceStat>;
  for (const key of EMAIL_SEQUENCE_ORDER) {
    perSeq[key] = { triggered: 0, sent: 0, failed: 0, pending: 0, total: 0 };
  }

  for (const reg of regs) {
    for (const key of EMAIL_SEQUENCE_ORDER) {
      const status = reg.emailSequence?.[key]?.status ?? "pending";
      const stat = perSeq[key];
      stat.total += 1;
      if (status === "sent") {
        stat.sent += 1;
        stat.triggered += 1;
      } else if (status === "failed") {
        stat.failed += 1;
        stat.triggered += 1;
      } else {
        stat.pending += 1;
      }
    }
  }

  return { total: regs.length, perSeq };
}

export async function getRegistrationCountsByEventIds(
  eventIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (eventIds.length === 0) return counts;

  const col = await getRegistrationsCollection();
  const rows = await col
    .aggregate<{ _id: string; count: number }>([
      { $match: { eventId: { $in: eventIds }, ...activeConfirmedAdmissionFilter() } },
      { $group: { _id: "$eventId", count: { $sum: 1 } } },
    ])
    .toArray();

  for (const id of eventIds) counts.set(id, 0);
  for (const row of rows) counts.set(row._id, row.count);
  return counts;
}
