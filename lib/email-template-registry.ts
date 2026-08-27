import {
  EMAIL_SEQUENCE_LABELS,
  EMAIL_SEQUENCE_ORDER,
  EMAIL_SEQUENCE_SCHEDULE,
  getSequenceSubject,
  type EmailSequenceKey,
  type SequenceRenderContext,
} from "@/lib/email-sequence";
import {
  buildSequenceEmailHtml,
  buildSequenceRenderContext,
} from "@/lib/email-sequence-template";
import { JOIN_NOTIFY_HTML, JOIN_THANK_YOU_HTML } from "@/lib/join-email-templates";
import { getEventPassPath } from "@/lib/event-path";
import { getPublicSiteUrl } from "@/lib/site-url";
import type { EmailTemplateKey } from "@/lib/email-template-keys";
import {
  RECONFIRM_PLACEHOLDERS,
  DEFAULT_RECONFIRM_BODY_HTML,
  buildReconfirmHtml,
} from "@/lib/reconfirm-template";
import {
  appendAttendanceRsvpToEmailHtml,
  isAttendanceRsvpSequenceKey,
} from "@/lib/attendance-rsvp";
import {
  applyEmailTemplate,
  getSampleJoinVars,
} from "@/lib/email-template-client";

export { applyEmailTemplate, getSampleJoinVars };

export type EmailTemplateDefinition = {
  key: EmailTemplateKey;
  label: string;
  schedule: string;
  subject: string;
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
  "{{confirmAttendingUrl}}",
  "{{confirmDeclinedUrl}}",
  "{{directionsUrl}}",
];

export const EMAIL_TEMPLATE_DEFINITIONS: EmailTemplateDefinition[] = [
  ...EMAIL_SEQUENCE_ORDER.map((key) => ({
    key: key as EmailTemplateKey,
    label: EMAIL_SEQUENCE_LABELS[key],
    schedule: EMAIL_SEQUENCE_SCHEDULE[key],
    subject: getSequenceSubject(key, { firstName: "", eventName: "" }),
    group: "Event registration emails",
    placeholders: SEQUENCE_PLACEHOLDERS,
  })),
  {
    key: "reconfirm",
    label: "Confirmation request",
    schedule: "When a list is uploaded in Confirm",
    subject: "Please confirm your attendance: {{eventName}}",
    group: "Event registration emails",
    placeholders: RECONFIRM_PLACEHOLDERS,
  },
  {
    key: "reconfirm_2",
    label: "Reconfirm request",
    schedule: "When a list is uploaded in Reconfirm",
    subject: "Please confirm again: {{eventName}}",
    group: "Event registration emails",
    placeholders: RECONFIRM_PLACEHOLDERS,
  },
  {
    key: "join_thank_you",
    label: "Join movement — thank you",
    schedule: "When someone reserves a seat",
    subject: "Thank you — your seat is reserved | Humans First",
    group: "Join movement emails",
    placeholders: JOIN_PLACEHOLDERS,
  },
  {
    key: "join_notify",
    label: "Join movement — admin notification",
    schedule: "When someone reserves a seat",
    subject: "New seat reservation — {{name}} ({{city}})",
    group: "Join movement emails",
    placeholders: JOIN_PLACEHOLDERS,
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
    passUrl: `${getPublicSiteUrl()}${getEventPassPath(event, "SAMPLE01")}`,
    uniqueCode: "SAMPLE01",
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
    confirmAttendingUrl: ctx.confirmAttendingUrl ?? "",
    confirmDeclinedUrl: ctx.confirmDeclinedUrl ?? "",
    directionsUrl: ctx.directionsUrl ?? "",
  };
}

export function getDefaultTemplateHtml(key: EmailTemplateKey): string {
  if (key === "join_thank_you") return JOIN_THANK_YOU_HTML;
  if (key === "join_notify") return JOIN_NOTIFY_HTML;
  // Only the message body is editable; the details block and the
  // "I'll be attending" button are always appended when the email is sent.
  if (key === "reconfirm" || key === "reconfirm_2") return DEFAULT_RECONFIRM_BODY_HTML;
  return buildSequenceEmailHtml(key as EmailSequenceKey, getSampleSequenceContext());
}

export function getDefaultTemplateSubject(key: EmailTemplateKey): string {
  const def = EMAIL_TEMPLATE_DEFINITIONS.find((item) => item.key === key);
  return def?.subject ?? "The Humans First Series";
}

export function getPreviewHtml(
  key: EmailTemplateKey,
  customHtml?: string | null,
  sampleContext?: SequenceRenderContext
): string {
  const ctx = sampleContext ?? getSampleSequenceContext();
  const html = customHtml?.trim();
  let rendered: string;

  // The re-confirmation preview always assembles the fixed details block and
  // the "I'll be attending" button around the edited body, so the editor shows
  // exactly what recipients get — including the parts that cannot be removed.
  if (key === "reconfirm" || key === "reconfirm_2") {
    return buildReconfirmHtml(
      {
        firstName: ctx.firstName,
        surname: "",
        eventName: ctx.eventName,
        eventDate: ctx.eventDateLong || ctx.eventDateDetail,
        eventTime: ctx.eventTime,
        venue: ctx.venue,
        directionsUrl: ctx.directionsUrl ?? "",
      },
      ctx.confirmAttendingUrl || "#",
      ctx.confirmDeclinedUrl || "#",
      html
    );
  }

  if (html) {
    if (key === "join_thank_you" || key === "join_notify") {
      rendered = applyEmailTemplate(html, getSampleJoinVars());
    } else {
      rendered = applyEmailTemplate(html, {
        ...sequenceContextToVars(ctx),
        confirmAttendingUrl: ctx.confirmAttendingUrl ?? "",
        confirmDeclinedUrl: ctx.confirmDeclinedUrl ?? "",
        directionsUrl: ctx.directionsUrl ?? "",
      });
    }
  } else if (key === "join_thank_you" || key === "join_notify") {
    rendered = getDefaultTemplateHtml(key);
  } else {
    rendered = buildSequenceEmailHtml(key as EmailSequenceKey, ctx);
  }

  if (isAttendanceRsvpSequenceKey(key as EmailSequenceKey)) {
    return appendAttendanceRsvpToEmailHtml(rendered, key as EmailSequenceKey, ctx);
  }
  return rendered;
}
