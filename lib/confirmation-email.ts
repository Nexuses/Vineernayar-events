import "server-only";

import { randomBytes } from "crypto";

import { sendBlastEmail } from "@/lib/email-blast";
import { isMailConfigured } from "@/lib/mail";
import { getEventPublicPath } from "@/lib/event-path";
import { toAbsolutePublicUrl } from "@/lib/site-url";
import { applyEmailTemplate } from "@/lib/email-template-client";
import { getEmailTemplateOverride } from "@/lib/models/EmailTemplate";
import { buildReconfirmVars, buildReconfirmHtml } from "@/lib/reconfirm-template";
import { FIRST_ROUND } from "@/lib/confirmation-rounds";
import type { EmailTemplateKey } from "@/lib/email-template-keys";
import type { EventDoc } from "@/lib/models/Event";
import type { RegistrationDoc } from "@/lib/models/Registration";

/** Absolute URL of the confirmation landing page for one attendee. */
function buildRsvpUrl(
  event: EventDoc,
  uniqueCode: string,
  intent: "attending" | "declined",
  round: number,
  sendId?: string
): string {
  const base = toAbsolutePublicUrl(getEventPublicPath(event));
  const params = new URLSearchParams({ code: uniqueCode, intent });
  // Round 1 links stay clean, so existing links keep working unchanged.
  if (round !== FIRST_ROUND) params.set("round", String(round));
  // Identifies this particular email, so a click after a resend is credited
  // to the email that was actually clicked.
  if (sendId) params.set("s", sendId);
  return `${base}/confirm-attendance?${params.toString()}`;
}

/** A fresh ID for one confirmation email; it goes in that email's links. */
export function newConfirmationSendId(): string {
  return randomBytes(9).toString("base64url");
}

export function buildConfirmAttendingUrl(
  event: EventDoc,
  uniqueCode: string,
  round: number = FIRST_ROUND,
  sendId?: string
): string {
  return buildRsvpUrl(event, uniqueCode, "attending", round, sendId);
}

export function buildConfirmDeclinedUrl(
  event: EventDoc,
  uniqueCode: string,
  round: number = FIRST_ROUND,
  sendId?: string
): string {
  return buildRsvpUrl(event, uniqueCode, "declined", round, sendId);
}

/** Template key for a round: round 1 uses "reconfirm", later rounds "reconfirm_N". */
export function templateKeyForRound(round: number): EmailTemplateKey {
  return (round === FIRST_ROUND ? "reconfirm" : `reconfirm_${round}`) as EmailTemplateKey;
}

export function buildConfirmationSubject(
  event: Pick<EventDoc, "eventName">,
  round: number = FIRST_ROUND
): string {
  return round === FIRST_ROUND
    ? `Please confirm your attendance: ${event.eventName}`
    : `Please confirm again: ${event.eventName}`;
}

/** Full email HTML for one attendee, with the admin-edited body when set. */
export function buildConfirmationHtml(
  event: EventDoc,
  reg: Pick<RegistrationDoc, "firstName" | "surname" | "uniqueCode">,
  bodyHtml?: string | null,
  round: number = FIRST_ROUND,
  sendId?: string
): string {
  const vars = buildReconfirmVars(event, reg);
  return buildReconfirmHtml(
    vars,
    buildConfirmAttendingUrl(event, reg.uniqueCode, round, sendId),
    buildConfirmDeclinedUrl(event, reg.uniqueCode, round, sendId),
    bodyHtml
  );
}

/** Send the re-confirmation email carrying the "I'll be attending" button. */
export async function sendConfirmationEmail(
  event: EventDoc,
  reg: RegistrationDoc,
  round: number = FIRST_ROUND,
  sendId?: string
): Promise<void> {
  if (!isMailConfigured()) {
    throw new Error("Email is not configured");
  }

  // Per-event copy falls back to the global template, then to the default body.
  const override = await getEmailTemplateOverride(templateKeyForRound(round), event.eventId);
  const vars = buildReconfirmVars(event, reg);
  const subject = override?.subject?.trim()
    ? applyEmailTemplate(override.subject, vars as unknown as Record<string, string>)
    : buildConfirmationSubject(event, round);

  await sendBlastEmail({
    to: reg.email,
    toName: `${reg.firstName} ${reg.surname}`.trim(),
    subject,
    html: buildConfirmationHtml(event, reg, override?.html, round, sendId),
  });
}
