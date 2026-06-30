import { BRAND_LOGO_URL } from "@/lib/constants";
import {
  applyEmailTemplate,
  sequenceContextToVars,
} from "@/lib/email-template-registry";
import { buildSequenceRenderContext } from "@/lib/email-sequence-template";
import { getEmailTemplateOverride } from "@/lib/models/EmailTemplate";
import type { RegistrationDoc } from "@/lib/models/Registration";
import { isMailConfigured, sendAppMail } from "@/lib/mail";
import { SMTP_REPLY_EMAIL } from "@/lib/smtp";
import {
  WAITLIST_REJECTED_HTML,
  WAITLIST_THANK_YOU_HTML,
} from "@/lib/waitlist-email-templates";

const LOGO_URL = process.env.EMAIL_LOGO_URL || BRAND_LOGO_URL;

function buildPassUrl(eventId: string, uniqueCode: string): string {
  const base = process.env.SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
  return `${base}/events/${eventId}/pass/${uniqueCode}`;
}

function buildTemplateVars(reg: RegistrationDoc): Record<string, string> {
  const passUrl = buildPassUrl(reg.eventId, reg.uniqueCode);
  const ctx = buildSequenceRenderContext({
    firstName: reg.firstName,
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
    passUrl,
    priorityPass: reg.workedWithVineet === true,
  });

  return {
    ...sequenceContextToVars(ctx),
    logoUrl: LOGO_URL,
  };
}

export async function sendWaitlistThankYouEmail(reg: RegistrationDoc): Promise<boolean> {
  if (!isMailConfigured()) return false;

  const vars = buildTemplateVars(reg);
  const customHtml = await getEmailTemplateOverride("waitlist_thank_you", reg.eventId);
  const html = applyEmailTemplate(customHtml || WAITLIST_THANK_YOU_HTML, vars);
  const text = [
    `Hi ${vars.firstName},`,
    "",
    `Thank you for registering for ${vars.eventName}.`,
    "",
    "You are on the waitlist. We will email you as soon as your seat is confirmed with your event pass and details.",
    "",
    "Event Details:",
    `Date: ${vars.eventDateLong}`,
    `Time: ${vars.eventTime}`,
    `Location: ${vars.eventLocationFull}`,
    "",
    "Warm regards,",
    "Team HFMS",
  ].join("\n");

  try {
    await sendAppMail({
      to: reg.email,
      toName: `${reg.firstName} ${reg.surname}`.trim(),
      replyTo: SMTP_REPLY_EMAIL,
      subject: `Thank you for registering — you're on the waitlist | ${reg.eventName}`,
      html,
      text,
    });
    return true;
  } catch (err) {
    console.error("Waitlist thank-you email failed:", err);
    return false;
  }
}

export async function sendWaitlistRejectedEmail(reg: RegistrationDoc): Promise<boolean> {
  if (!isMailConfigured()) return false;

  const vars = buildTemplateVars(reg);
  const customHtml = await getEmailTemplateOverride("waitlist_rejected", reg.eventId);
  const html = applyEmailTemplate(customHtml || WAITLIST_REJECTED_HTML, vars);
  const text = [
    `Hi ${vars.firstName},`,
    "",
    `Thank you for your interest in ${vars.eventName}.`,
    "",
    "Unfortunately, we are unable to confirm your seat for this event at this time.",
    "",
    "Warm regards,",
    "Team HFMS",
  ].join("\n");

  try {
    await sendAppMail({
      to: reg.email,
      toName: `${reg.firstName} ${reg.surname}`.trim(),
      replyTo: SMTP_REPLY_EMAIL,
      subject: `Update on your registration | ${reg.eventName}`,
      html,
      text,
    });
    return true;
  } catch (err) {
    console.error("Waitlist rejected email failed:", err);
    return false;
  }
}
