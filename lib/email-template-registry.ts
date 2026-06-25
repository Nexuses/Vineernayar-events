import {
  EMAIL_SEQUENCE_LABELS,
  EMAIL_SEQUENCE_ORDER,
  EMAIL_SEQUENCE_SCHEDULE,
  type EmailSequenceKey,
  type SequenceRenderContext,
} from "@/lib/email-sequence";
import {
  buildSequenceEmailHtml,
  buildSequenceRenderContext,
} from "@/lib/email-sequence-template";
import { JOIN_NOTIFY_HTML, JOIN_THANK_YOU_HTML } from "@/lib/join-email-templates";
import { BRAND_LOGO_URL } from "@/lib/constants";
import { MARKETING_SITE_URL } from "@/lib/marketing-site";
import type { EmailTemplateKey } from "@/lib/models/EmailTemplate";

export type EmailTemplateDefinition = {
  key: EmailTemplateKey;
  label: string;
  schedule: string;
  group: string;
  placeholders: string[];
};

const JOIN_PLACEHOLDERS = [
  "{{name}}",
  "{{email}}",
  "{{city}}",
  "{{logoUrl}}",
  "{{navLogoUrl}}",
  "{{homeUrl}}",
  "{{bookUrl}}",
  "{{citiesUrl}}",
  "{{watchUrl}}",
  "{{wallUrl}}",
  "{{submittedAt}}",
];

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

export const EMAIL_TEMPLATE_DEFINITIONS: EmailTemplateDefinition[] = [
  ...EMAIL_SEQUENCE_ORDER.map((key) => ({
    key: key as EmailTemplateKey,
    label: EMAIL_SEQUENCE_LABELS[key],
    schedule: EMAIL_SEQUENCE_SCHEDULE[key],
    group: "Event registration emails",
    placeholders: SEQUENCE_PLACEHOLDERS,
  })),
  {
    key: "join_thank_you",
    label: "Join movement — thank you",
    schedule: "When someone reserves a seat",
    group: "Join movement emails",
    placeholders: JOIN_PLACEHOLDERS,
  },
  {
    key: "join_notify",
    label: "Join movement — admin notification",
    schedule: "When someone reserves a seat",
    group: "Join movement emails",
    placeholders: JOIN_PLACEHOLDERS,
  },
];

const SAMPLE_PASS_URL = `${MARKETING_SITE_URL}/events/sample-event/pass/SAMPLE01`;

export function getSampleSequenceContext(): SequenceRenderContext {
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(15);

  return buildSequenceRenderContext({
    firstName: "Alex",
    eventName: "The Humans First Series with Vineet Nayar",
    eventStartDate: nextMonth.toISOString(),
    eventEndDate: nextMonth.toISOString(),
    eventTime: "6:00 PM – 8:30 PM IST",
    venue: "Taj Lands End, Mumbai",
    passUrl: SAMPLE_PASS_URL,
  });
}

export function getSampleJoinVars(): Record<string, string> {
  return {
    name: "Alex",
    email: "alex@example.com",
    city: "Mumbai",
    logoUrl: process.env.EMAIL_LOGO_URL || BRAND_LOGO_URL,
    navLogoUrl: process.env.EMAIL_LOGO_URL || BRAND_LOGO_URL,
    homeUrl: MARKETING_SITE_URL,
    bookUrl: `${MARKETING_SITE_URL}/book`,
    citiesUrl: `${MARKETING_SITE_URL}/#cities-cards`,
    watchUrl: `${MARKETING_SITE_URL}/#mosaic`,
    wallUrl: `${MARKETING_SITE_URL}/#wall`,
    submittedAt: "15 June 2026, 10:30 am",
  };
}

export function sequenceContextToVars(ctx: SequenceRenderContext): Record<string, string> {
  return {
    firstName: ctx.firstName,
    eventName: ctx.eventName,
    eventDateDetail: ctx.eventDateDetail,
    eventDateLong: ctx.eventDateLong,
    eventTime: ctx.eventTime,
    venue: ctx.venue,
    eventCity: ctx.eventCity,
    eventLocationFull: ctx.eventLocationFull,
    eventPageUrl: ctx.eventPageUrl,
    preOrderUrl: ctx.preOrderUrl,
    websiteUrl: ctx.websiteUrl,
    calendarMonth: ctx.calendar.month,
    calendarDay: ctx.calendar.day,
    calendarWeekday: ctx.calendar.weekday,
  };
}

export function applyEmailTemplate(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

export function getDefaultTemplateHtml(key: EmailTemplateKey): string {
  if (key === "join_thank_you") return JOIN_THANK_YOU_HTML;
  if (key === "join_notify") return JOIN_NOTIFY_HTML;
  return buildSequenceEmailHtml(key as EmailSequenceKey, getSampleSequenceContext());
}

export function getPreviewHtml(
  key: EmailTemplateKey,
  customHtml?: string | null
): string {
  if (customHtml?.trim()) {
    if (key === "join_thank_you" || key === "join_notify") {
      return applyEmailTemplate(customHtml, getSampleJoinVars());
    }
    return applyEmailTemplate(customHtml, sequenceContextToVars(getSampleSequenceContext()));
  }
  return getDefaultTemplateHtml(key);
}
