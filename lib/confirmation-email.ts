import "server-only";

import { sendBlastEmail } from "@/lib/email-blast";
import { isMailConfigured } from "@/lib/mail";
import { getEventPublicPath } from "@/lib/event-path";
import { toAbsolutePublicUrl } from "@/lib/site-url";
import { applyEmailTemplate } from "@/lib/email-template-client";
import { getEmailTemplateOverride } from "@/lib/models/EmailTemplate";
import { buildReconfirmVars, buildReconfirmHtml } from "@/lib/reconfirm-template";
import type { EventDoc } from "@/lib/models/Event";
import type { RegistrationDoc } from "@/lib/models/Registration";

/** Absolute URL of the confirmation landing page for one attendee. */
function buildRsvpUrl(
  event: EventDoc,
  uniqueCode: string,
  intent: "attending" | "declined"
): string {
  const base = toAbsolutePublicUrl(getEventPublicPath(event));
  const params = new URLSearchParams({ code: uniqueCode, intent });
  return `${base}/confirm-attendance?${params.toString()}`;
}

export function buildConfirmAttendingUrl(event: EventDoc, uniqueCode: string): string {
  return buildRsvpUrl(event, uniqueCode, "attending");
}

export function buildConfirmDeclinedUrl(event: EventDoc, uniqueCode: string): string {
  return buildRsvpUrl(event, uniqueCode, "declined");
}

export function buildConfirmationSubject(event: Pick<EventDoc, "eventName">): string {
  return `Please confirm your attendance: ${event.eventName}`;
}

/** Full email HTML for one attendee, with the admin-edited body when set. */
export function buildConfirmationHtml(
  event: EventDoc,
  reg: Pick<RegistrationDoc, "firstName" | "surname" | "uniqueCode">,
  bodyHtml?: string | null
): string {
  const vars = buildReconfirmVars(event, reg);
  return buildReconfirmHtml(
    vars,
    buildConfirmAttendingUrl(event, reg.uniqueCode),
    buildConfirmDeclinedUrl(event, reg.uniqueCode),
    bodyHtml
  );
}

/** Send the re-confirmation email carrying the "I'll be attending" button. */
export async function sendConfirmationEmail(
  event: EventDoc,
  reg: RegistrationDoc
): Promise<void> {
  if (!isMailConfigured()) {
    throw new Error("Email is not configured");
  }

  // Per-event copy falls back to the global template, then to the default body.
  const override = await getEmailTemplateOverride("reconfirm", event.eventId);
  const vars = buildReconfirmVars(event, reg);
  const subject = override?.subject?.trim()
    ? applyEmailTemplate(override.subject, vars as unknown as Record<string, string>)
    : buildConfirmationSubject(event);

  await sendBlastEmail({
    to: reg.email,
    toName: `${reg.firstName} ${reg.surname}`.trim(),
    subject,
    html: buildConfirmationHtml(event, reg, override?.html),
  });
}
