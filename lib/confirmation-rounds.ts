/**
 * Confirmation rounds.
 *
 * An event can ask attendees to confirm more than once — typically after a date
 * change. Round 1 is "Reconfirm", round 2 is "Secondary Confirm", and further
 * rounds are supported without code changes.
 *
 * Round 1 predates this model, so it is still stored in the original
 * attendanceRsvpStatus / attendanceRsvpAt / confirmationEmailSentAt fields.
 * Rounds 2 and above live in the confirmationRounds array. Read through the
 * helpers here rather than touching either directly.
 */

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
export type RoundBearingRegistration = {
  attendanceRsvpStatus?: ConfirmationRoundStatus | null;
  attendanceRsvpAt?: Date | string | null;
  confirmationEmailSentAt?: Date | string | null;
  confirmationRounds?: ConfirmationRound[] | null;
};

export const FIRST_ROUND = 1;
export const SECONDARY_ROUND = 2;

/** "Reconfirm", "Secondary Confirm", "Third Confirm", … */
export function getRoundLabel(round: number): string {
  if (round <= 1) return "Reconfirm";
  if (round === 2) return "Secondary Confirm";
  const ordinals = ["", "", "Second", "Third", "Fourth", "Fifth", "Sixth"];
  const word = ordinals[round] ?? `Round ${round}`;
  return `${word} Confirm`;
}

/** Slug used in the admin route for a round, e.g. /admin/secondary-confirm. */
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
