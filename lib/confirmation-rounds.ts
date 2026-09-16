/**
 * Confirmation rounds.
 *
 * An event can ask attendees to confirm more than once — typically after a date
 * change. Round 1 is "Reconfirm", round 2 is "Reconfirm 2", and further rounds
 * are supported without code changes.
 *
 * The timeline also opens with a "Confirm" entry for the registration itself,
 * so the history reads Confirm → Reconfirm → Reconfirm 2. Every round is kept:
 * a later one never replaces an earlier one.
 *
 * Round 1 predates this model, so it is still stored in the original
 * attendanceRsvpStatus / attendanceRsvpAt / confirmationEmailSentAt fields.
 * Rounds 2 and above live in the confirmationRounds array. Read through the
 * helpers here rather than touching either directly.
 */

import { formatEventDropdownLabel } from "@/lib/event-option-label";

export type ConfirmationRoundStatus = "pending" | "reconfirmed" | "declined";

export type ConfirmationRound = {
  round: number;
  status: ConfirmationRoundStatus;
  /** When the request email for this round was sent. */
  emailSentAt?: Date | string | null;
  /** When the attendee answered this round. */
  respondedAt?: Date | string | null;
};

/** Shape this module needs from a registration; keeps it client-safe. */
/**
 * One moment in the confirmation flow: an email going out, or an attendee
 * clicking a response button. The log is append-only — a resend or a changed
 * answer adds an entry rather than overwriting the earlier one.
 */
export type ConfirmationActivity = {
  type: "sent" | "response";
  round: number;
  at: Date | string;
  eventId: string;
  /** The event as it read at the time, e.g. "The Human Advantage (Mumbai)". */
  eventLabel: string;
  /** Response entries only: the button that was clicked. */
  status?: ConfirmationRoundStatus;
  /**
   * false when rebuilt from the summary fields kept before this log existed.
   * The timestamp is genuine, but earlier sends of that round may be missing.
   */
  recorded?: boolean;
};

export type RoundBearingRegistration = {
  /** When the person registered — the "Confirm" entry of the timeline. */
  createdAt?: Date | string | null;
  eventId?: string | null;
  eventName?: string | null;
  venue?: string | null;
  confirmationActivity?: ConfirmationActivity[] | null;
  attendanceRsvpStatus?: ConfirmationRoundStatus | null;
  attendanceRsvpAt?: Date | string | null;
  confirmationEmailSentAt?: Date | string | null;
  confirmationRounds?: ConfirmationRound[] | null;
};

export const FIRST_ROUND = 1;
export const SECONDARY_ROUND = 2;

/** "Reconfirm", "Reconfirm 2", "Reconfirm 3", … */
export function getRoundLabel(round: number): string {
  if (round <= 1) return "Reconfirm";
  return `Reconfirm ${round}`;
}

/** The registration itself, which opens the timeline before any round. */
export const REGISTRATION_LABEL = "Confirm";

/**
 * Slug used in the admin route for a round. These predate the Confirm /
 * Reconfirm naming and are kept so existing bookmarks keep working.
 */
export function getRoundSlug(round: number): string {
  if (round <= 1) return "reconfirm";
  if (round === 2) return "secondary-confirm";
  return `confirm-round-${round}`;
}

export function isConfirmationRound(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 10;
}

/** Read one round, falling back to the legacy fields for round 1. */
export function getRound(
  reg: RoundBearingRegistration,
  round: number
): ConfirmationRound {
  const stored = reg.confirmationRounds?.find((r) => r.round === round);
  if (stored) return stored;

  if (round === FIRST_ROUND) {
    return {
      round: FIRST_ROUND,
      status: reg.attendanceRsvpStatus ?? "pending",
      emailSentAt: reg.confirmationEmailSentAt ?? null,
      respondedAt: reg.attendanceRsvpAt ?? null,
    };
  }
  return { round, status: "pending", emailSentAt: null, respondedAt: null };
}

/** Highest round this attendee has actually been asked to confirm. */
export function getHighestAskedRound(reg: RoundBearingRegistration): number {
  let highest = reg.confirmationEmailSentAt ? FIRST_ROUND : 0;
  for (const r of reg.confirmationRounds ?? []) {
    if (r.emailSentAt && r.round > highest) highest = r.round;
  }
  return highest;
}

/**
 * The attendee's real status: the most recent round they answered wins, so a
 * later decline overrides an earlier confirmation.
 */
export function getEffectiveConfirmation(reg: RoundBearingRegistration): {
  round: number;
  status: ConfirmationRoundStatus;
  respondedAt: Date | string | null;
} {
  let best = { round: FIRST_ROUND, status: "pending" as ConfirmationRoundStatus, respondedAt: null as Date | string | null };
  let bestRound = 0;

  const consider = (round: number, r: ConfirmationRound) => {
    if (r.status === "pending" || !r.respondedAt) return;
    if (round >= bestRound) {
      bestRound = round;
      best = { round, status: r.status, respondedAt: r.respondedAt ?? null };
    }
  };

  consider(FIRST_ROUND, getRound(reg, FIRST_ROUND));
  for (const r of reg.confirmationRounds ?? []) consider(r.round, r);

  return best;
}

export function confirmationStatusLabel(status?: ConfirmationRoundStatus | null): string {
  if (status === "reconfirmed") return "Confirmed";
  if (status === "declined") return "Not Attending";
  return "Pending";
}

function toIso(value?: Date | string | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

export type ConfirmationTimelineEntry = {
  /** "registration" is the opening Confirm entry; the rest are ask/answer rounds. */
  kind: "registration" | "round";
  /** 0 for the registration entry, then 1, 2, … */
  round: number;
  /** "Confirm", "Reconfirm", "Reconfirm 2", … */
  roundLabel: string;
  status: ConfirmationRoundStatus;
  /** "Registered", "Confirmed", "Not Attending", "Pending" */
  statusLabel: string;
  emailSentAt: string | null;
  respondedAt: string | null;
};

/**
 * Every round this attendee has actually been through, oldest first.
 *
 * A round appears as soon as its request email goes out, so a round that is
 * still awaiting an answer is part of the history too. Earlier rounds are never
 * replaced by later ones — a person who confirmed and then declined the
 * reconfirm keeps both entries.
 */
export function buildConfirmationTimeline(
  reg: RoundBearingRegistration
): ConfirmationTimelineEntry[] {
  const entries: ConfirmationTimelineEntry[] = [];

  const registeredAt = toIso(reg.createdAt);
  if (registeredAt) {
    entries.push({
      kind: "registration",
      round: 0,
      roundLabel: REGISTRATION_LABEL,
      status: "reconfirmed",
      statusLabel: "Registered",
      emailSentAt: null,
      respondedAt: registeredAt,
    });
  }

  const rounds = new Set<number>();
  if (reg.confirmationEmailSentAt || reg.attendanceRsvpAt) rounds.add(FIRST_ROUND);
  for (const r of reg.confirmationRounds ?? []) {
    if (r.emailSentAt || r.respondedAt) rounds.add(r.round);
  }

  for (const round of [...rounds].sort((a, b) => a - b)) {
    const r = getRound(reg, round);
    entries.push({
      kind: "round",
      round,
      roundLabel: getRoundLabel(round),
      status: r.status,
      statusLabel: confirmationStatusLabel(r.status),
      emailSentAt: toIso(r.emailSentAt),
      respondedAt: toIso(r.respondedAt),
    });
  }

  return entries;
}

/** Short chip text, e.g. "Confirm", "Reconfirm · Yes", "Reconfirm 2 · No". */
export function confirmationChipLabel(entry: ConfirmationTimelineEntry): string {
  if (entry.kind === "registration") return entry.roundLabel;
  if (entry.status === "reconfirmed") return `${entry.roundLabel} · Yes`;
  if (entry.status === "declined") return `${entry.roundLabel} · No`;
  return `${entry.roundLabel} · Pending`;
}

/**
 * The whole history as one line, for a CSV cell or a tooltip. `formatWhen`
 * decides the date style so callers stay consistent with their own table.
 */
export function formatConfirmationTimeline(
  reg: RoundBearingRegistration,
  formatWhen: (value: string | null) => string
): string {
  return buildConfirmationTimeline(reg)
    .map((e) => {
      if (e.kind === "registration") {
        return `${e.roundLabel}: Registered ${formatWhen(e.respondedAt)}`;
      }
      const asked = e.emailSentAt ? `asked ${formatWhen(e.emailSentAt)}` : "not asked";
      const answer = e.respondedAt
        ? `${e.statusLabel} ${formatWhen(e.respondedAt)}`
        : e.statusLabel;
      return `${e.roundLabel}: ${answer} (${asked})`;
    })
    .join(" | ");
}

/** Exact wording of the buttons in the confirmation email. */
export const RESPONSE_BUTTON_LABELS: Record<Exclude<ConfirmationRoundStatus, "pending">, string> = {
  reconfirmed: "Yes, I'll be attending",
  declined: "No, I won't attend",
};

/**
 * True when this answer is already on record for this round.
 *
 * Must compare against the round being answered: comparing against round 1
 * silently dropped every Reconfirm 2 "Yes" from people who had already said
 * yes to Reconfirm.
 */
export function isRepeatAnswer(
  reg: RoundBearingRegistration,
  round: number,
  status: ConfirmationRoundStatus
): boolean {
  return getRound(reg, round).status === status;
}

/** The registration's event, labelled the way the admin dropdowns show it. */
export function registrationEventLabel(reg: RoundBearingRegistration): string {
  const name = reg.eventName?.trim();
  if (!name) return reg.eventId ?? "";
  return formatEventDropdownLabel({ eventName: name, venue: reg.venue ?? undefined });
}

/**
 * Activity for one round rebuilt from the summary fields, for data recorded
 * before the log existed. Those fields keep only the latest send, so an answer
 * can appear to predate its email — the log is what fixes that going forward.
 */
export function legacyActivityForRound(
  reg: RoundBearingRegistration,
  round: number
): ConfirmationActivity[] {
  const r = getRound(reg, round);
  const base = {
    round,
    eventId: reg.eventId ?? "",
    eventLabel: registrationEventLabel(reg),
    recorded: false,
  };
  const out: ConfirmationActivity[] = [];
  if (r.emailSentAt) out.push({ ...base, type: "sent", at: r.emailSentAt });
  if (r.respondedAt && r.status !== "pending") {
    out.push({ ...base, type: "response", at: r.respondedAt, status: r.status });
  }
  return out;
}

export type ConfirmationActivityEntry = {
  kind: "registered" | "sent" | "response";
  at: string;
  /** 0 for the registration entry. */
  round: number;
  /** "Confirm", "Reconfirm", "Reconfirm 2", … */
  roundLabel: string;
  eventLabel: string | null;
  status?: ConfirmationRoundStatus;
  /** Sent entries: 1 for the first send of this round, 2 for a resend, … */
  sendNumber?: number;
  /**
   * False when pre-log data proves an earlier send happened but not how many,
   * so the number is a minimum and should not be shown as an exact ordinal.
   */
  sendNumberExact?: boolean;
  /** Response entries: when the email that was answered went out, if known. */
  answeredEmailSentAt?: string | null;
  /** Response entries: which send of the round was answered (1, 2, …). */
  answeredSendNumber?: number | null;
  answeredSendNumberExact?: boolean;
  recorded: boolean;
};

function roundsOnRecord(reg: RoundBearingRegistration): number[] {
  const rounds = new Set<number>();
  if (reg.confirmationEmailSentAt || reg.attendanceRsvpAt) rounds.add(FIRST_ROUND);
  for (const r of reg.confirmationRounds ?? []) {
    if (r.emailSentAt || r.respondedAt) rounds.add(r.round);
  }
  for (const a of reg.confirmationActivity ?? []) rounds.add(a.round);
  return [...rounds].sort((a, b) => a - b);
}

/**
 * Every send and every click, oldest first, opening with the registration.
 *
 * Each click is tied to the email it came from: the latest send of the same
 * round at or before the click. A click with no earlier send on record can
 * only happen on pre-log data, where a later upload overwrote the send time.
 */
export function buildConfirmationActivity(
  reg: RoundBearingRegistration
): ConfirmationActivityEntry[] {
  const log = reg.confirmationActivity ?? [];
  const loggedRounds = new Set(log.map((a) => a.round));
  const all: ConfirmationActivity[] = [...log];
  for (const round of roundsOnRecord(reg)) {
    if (!loggedRounds.has(round)) all.push(...legacyActivityForRound(reg, round));
  }

  all.sort((a, b) => {
    const diff = new Date(a.at).getTime() - new Date(b.at).getTime();
    if (diff !== 0) return diff;
    return a.type === b.type ? 0 : a.type === "sent" ? -1 : 1;
  });

  const sends = new Map<number, number>();
  const lastSend = new Map<number, { at: string; n: number; exact: boolean }>();
  // Rounds where a click arrived with no send on record: an earlier send
  // existed but its time was overwritten, so counts from here are minimums.
  const unknownEarlierSend = new Set<number>();
  const entries: ConfirmationActivityEntry[] = [];

  const registeredAt = toIso(reg.createdAt);
  if (registeredAt) {
    entries.push({
      kind: "registered",
      at: registeredAt,
      round: 0,
      roundLabel: REGISTRATION_LABEL,
      eventLabel: registrationEventLabel(reg) || null,
      recorded: true,
    });
  }

  for (const a of all) {
    const at = toIso(a.at) as string;
    const common = {
      at,
      round: a.round,
      roundLabel: getRoundLabel(a.round),
      eventLabel: a.eventLabel || null,
      recorded: a.recorded !== false,
    };
    if (a.type === "sent") {
      let n = (sends.get(a.round) ?? 0) + 1;
      const exact = !unknownEarlierSend.has(a.round);
      // A send following a click with no send on record cannot be the first.
      if (!exact && n === 1) n = 2;
      sends.set(a.round, n);
      lastSend.set(a.round, { at, n, exact });
      entries.push({ ...common, kind: "sent", sendNumber: n, sendNumberExact: exact });
    } else {
      const answered = lastSend.get(a.round) ?? null;
      if (!answered) unknownEarlierSend.add(a.round);
      entries.push({
        ...common,
        kind: "response",
        status: a.status,
        answeredEmailSentAt: answered?.at ?? null,
        answeredSendNumber: answered?.n ?? null,
        answeredSendNumberExact: answered?.exact ?? false,
      });
    }
  }

  return entries;
}

/** Send times of one round, oldest first. */
export function getRoundSendTimes(reg: RoundBearingRegistration, round: number): string[] {
  return buildConfirmationActivity(reg)
    .filter((e) => e.kind === "sent" && e.round === round)
    .map((e) => e.at);
}

/** The latest click on one round, tied to the email it came from. */
export function getRoundLatestResponse(
  reg: RoundBearingRegistration,
  round: number
): ConfirmationActivityEntry | null {
  const responses = buildConfirmationActivity(reg).filter(
    (e) => e.kind === "response" && e.round === round
  );
  return responses[responses.length - 1] ?? null;
}

function ordinal(n: number): string {
  const tail = n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
  return `${n}${tail}`;
}

/** Plain-English sentence for one activity entry — shared by the UI and CSV. */
export function describeConfirmationActivity(
  e: ConfirmationActivityEntry,
  formatWhen: (value: string | null) => string
): string {
  const forEvent = e.eventLabel ? ` for ${e.eventLabel}` : "";
  if (e.kind === "registered") return `Registered${forEvent}`;

  if (e.kind === "sent") {
    // Pre-log data can prove a resend happened but not how many sends there were.
    const again =
      (e.sendNumber ?? 1) > 1
        ? e.sendNumberExact
          ? ` again (${ordinal(e.sendNumber ?? 2)} send)`
          : " again"
        : "";
    return `${e.roundLabel} email sent${again}${forEvent}`;
  }

  const button =
    e.status && e.status !== "pending" ? `"${RESPONSE_BUTTON_LABELS[e.status]}"` : "a response";
  const which = e.answeredEmailSentAt
    ? ` — on the ${e.roundLabel} email sent ${formatWhen(e.answeredEmailSentAt)}`
    : e.recorded
      ? ""
      : ` — on an earlier ${e.roundLabel} email whose send time was later overwritten`;
  return `Clicked ${button} in the ${e.roundLabel} email${forEvent}${which}`;
}

/** The whole activity history as one line, for a CSV cell. */
export function formatConfirmationActivity(
  reg: RoundBearingRegistration,
  formatWhen: (value: string | null) => string
): string {
  return buildConfirmationActivity(reg)
    .map((e) => `${formatWhen(e.at)}: ${describeConfirmationActivity(e, formatWhen)}`)
    .join(" | ");
}
