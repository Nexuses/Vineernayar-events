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
];

export function getDefaultWhatsAppTemplateText(
  key: WhatsAppTemplateKey,
  sampleContext?: SequenceRenderContext
): string {
  const ctx = sampleContext ?? getSampleSequenceContext();
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
