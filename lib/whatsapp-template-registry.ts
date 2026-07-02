import {
  EMAIL_SEQUENCE_LABELS,
  EMAIL_SEQUENCE_ORDER,
  EMAIL_SEQUENCE_SCHEDULE,
  type EmailSequenceKey,
  type SequenceRenderContext,
} from "@/lib/email-sequence";
import { buildSequenceEmailText } from "@/lib/email-sequence-template";
import {
  applyEmailTemplate,
  buildSampleSequenceContextFromEvent,
  getSampleSequenceContext,
  sequenceContextToVars,
} from "@/lib/email-template-registry";
import type { WhatsAppTemplateKey } from "@/lib/whatsapp-template-keys";

export type WhatsAppTemplateDefinition = {
  key: WhatsAppTemplateKey;
  label: string;
  schedule: string;
  group: string;
  placeholders: string[];
};

const SEQUENCE_PLACEHOLDERS = [
  "{{firstName}}",
  "{{eventName}}",
  "{{eventDateDetail}}",
  "{{eventDateLong}}",
  "{{eventTime}}",
  "{{venue}}",
  "{{eventCity}}",
  "{{eventLocationFull}}",
  "{{eventPageUrl}}",
  "{{preOrderUrl}}",
  "{{websiteUrl}}",
  "{{calendarMonth}}",
  "{{calendarDay}}",
  "{{calendarWeekday}}",
];

export const WHATSAPP_TEMPLATE_DEFINITIONS: WhatsAppTemplateDefinition[] = [
  ...EMAIL_SEQUENCE_ORDER.map((key) => ({
    key: key as WhatsAppTemplateKey,
    label: EMAIL_SEQUENCE_LABELS[key],
    schedule: EMAIL_SEQUENCE_SCHEDULE[key],
    group: "Event registration messages",
    placeholders: SEQUENCE_PLACEHOLDERS,
  })),
  {
    key: "waitlist_thank_you",
    label: "Waitlist acknowledgement",
    schedule: "When someone registers (waitlisted)",
    group: "Waitlist messages",
    placeholders: SEQUENCE_PLACEHOLDERS,
  },
  {
    key: "waitlist_rejected",
    label: "Waitlist rejected",
    schedule: "When admin rejects a waitlisted registration",
    group: "Waitlist messages",
    placeholders: SEQUENCE_PLACEHOLDERS,
  },
];

function defaultWaitlistThankYouText(ctx: SequenceRenderContext): string {
  return [
    `Hi ${ctx.firstName},`,
    "",
    `Thank you for registering for ${ctx.eventName}.`,
    "You are currently on the waitlist.",
    "We will notify you as soon as your seat is confirmed.",
    "",
    `Date: ${ctx.eventDateLong}`,
    `Time: ${ctx.eventTime}`,
    `Location: ${ctx.eventLocationFull}`,
    "",
    "Team HFMS",
  ].join("\n");
}

function defaultWaitlistRejectedText(ctx: SequenceRenderContext): string {
  return [
    `Hi ${ctx.firstName},`,
    "",
    `Thank you for your interest in ${ctx.eventName}.`,
    "",
    "Unfortunately, we are unable to confirm your seat for this event at this time.",
    "",
    "Warm regards,",
    "Team HFMS",
  ].join("\n");
}

export function getDefaultWhatsAppTemplateText(
  key: WhatsAppTemplateKey,
  sampleContext?: SequenceRenderContext
): string {
  const ctx = sampleContext ?? getSampleSequenceContext();
  if (key === "waitlist_thank_you") return defaultWaitlistThankYouText(ctx);
  if (key === "waitlist_rejected") return defaultWaitlistRejectedText(ctx);
  return buildSequenceEmailText(key as EmailSequenceKey, ctx);
}

export function getWhatsAppPreviewText(
  key: WhatsAppTemplateKey,
  customText?: string | null,
  sampleContext?: SequenceRenderContext
): string {
  const ctx = sampleContext ?? getSampleSequenceContext();
  const text = customText?.trim();
  if (text) {
    if (/\{\{\w+\}\}/.test(text)) {
      return applyEmailTemplate(text, sequenceContextToVars(ctx));
    }
    return text;
  }
  return getDefaultWhatsAppTemplateText(key, ctx);
}

export {
  buildSampleSequenceContextFromEvent,
  getSampleSequenceContext,
  sequenceContextToVars,
};
