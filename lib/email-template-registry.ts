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
import { WAITLIST_REJECTED_HTML, WAITLIST_THANK_YOU_HTML } from "@/lib/waitlist-email-templates";
import { BRAND_LOGO_URL } from "@/lib/constants";
import { MARKETING_SITE_URL } from "@/lib/marketing-site";
import { getEventPassPath } from "@/lib/event-path";
import type { EmailTemplateKey } from "@/lib/email-template-keys";
import {
  applyEmailTemplate,
  getSampleJoinVars,
} from "@/lib/email-template-client";

export { applyEmailTemplate, getSampleJoinVars };

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
  {
    key: "waitlist_thank_you",
    label: "Waitlist — thank you",
    schedule: "When someone registers (waitlisted)",
    group: "Waitlist emails",
    placeholders: [...SEQUENCE_PLACEHOLDERS, "{{logoUrl}}"],
  },
  {
    key: "waitlist_rejected",
    label: "Waitlist — rejected",
    schedule: "When admin rejects a waitlisted registration",
    group: "Waitlist emails",
    placeholders: [...SEQUENCE_PLACEHOLDERS, "{{logoUrl}}"],
  },
];

export function getSampleSequenceContext(): SequenceRenderContext {
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(15);

  return buildSampleSequenceContextFromEvent({
    eventId: "sample-event",
    eventName: "The Humans First Series with Vineet Nayar",
    eventStartDate: nextMonth.toISOString(),
    eventEndDate: nextMonth.toISOString(),
    eventTime: "6:00 PM – 8:30 PM IST",
    venue: "Taj Lands End, Mumbai",
  });
}

export function buildSampleSequenceContextFromEvent(event: {
  eventId: string;
  slug?: string;
  eventName: string;
  eventStartDate: string | Date;
  eventEndDate: string | Date;
  eventTime?: string;
  venue: string;
}): SequenceRenderContext {
  const start =
    event.eventStartDate instanceof Date
      ? event.eventStartDate.toISOString()
      : String(event.eventStartDate);
  const end =
    event.eventEndDate instanceof Date
      ? event.eventEndDate.toISOString()
      : String(event.eventEndDate);

  return buildSequenceRenderContext({
    firstName: "Alex",
    eventName: event.eventName,
    eventStartDate: start,
    eventEndDate: end,
    eventTime: event.eventTime || "6:00 PM – 8:30 PM IST",
    venue: event.venue,
    passUrl: `${MARKETING_SITE_URL}${getEventPassPath(event, "SAMPLE01")}`,
  });
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

export function getDefaultTemplateHtml(key: EmailTemplateKey): string {
  if (key === "join_thank_you") return JOIN_THANK_YOU_HTML;
  if (key === "join_notify") return JOIN_NOTIFY_HTML;
  if (key === "waitlist_thank_you") return WAITLIST_THANK_YOU_HTML;
  if (key === "waitlist_rejected") return WAITLIST_REJECTED_HTML;
  return buildSequenceEmailHtml(key as EmailSequenceKey, getSampleSequenceContext());
}

export function getPreviewHtml(
  key: EmailTemplateKey,
  customHtml?: string | null,
  sampleContext?: SequenceRenderContext
): string {
  const ctx = sampleContext ?? getSampleSequenceContext();
  const html = customHtml?.trim();
  if (html) {
    if (key === "join_thank_you" || key === "join_notify") {
      return applyEmailTemplate(html, getSampleJoinVars());
    }
    if (key === "waitlist_thank_you" || key === "waitlist_rejected") {
      return applyEmailTemplate(html, {
        ...sequenceContextToVars(ctx),
        logoUrl: process.env.EMAIL_LOGO_URL || BRAND_LOGO_URL,
      });
    }
    return applyEmailTemplate(html, sequenceContextToVars(ctx));
  }
  if (key === "join_thank_you" || key === "join_notify") {
    return getDefaultTemplateHtml(key);
  }
  if (key === "waitlist_thank_you" || key === "waitlist_rejected") {
    return applyEmailTemplate(getDefaultTemplateHtml(key), {
      ...sequenceContextToVars(ctx),
      logoUrl: process.env.EMAIL_LOGO_URL || BRAND_LOGO_URL,
    });
  }
  return buildSequenceEmailHtml(key as EmailSequenceKey, ctx);
}
