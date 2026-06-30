import { istCalendarDayDiff } from "./date-utils";
import { getBannerHighlightLabel } from "./banner-label";
import type { RegistrationDoc } from "./models/Registration";

export type EmailSequenceKey = "seq1" | "seq2" | "seq3" | "seq4" | "seq5";

export type EmailSequenceEntry = {
  status: "pending" | "sent" | "failed";
  sentAt?: Date;
  error?: string;
};

export type EmailSequenceStatus = Partial<Record<EmailSequenceKey, EmailSequenceEntry>>;

export const EMAIL_SEQUENCE_ORDER: EmailSequenceKey[] = [
  "seq1",
  "seq2",
  "seq3",
  "seq4",
  "seq5",
];

export const EMAIL_SEQUENCE_LABELS: Record<EmailSequenceKey, string> = {
  seq1: "Registration confirmation",
  seq2: "7-day reminder",
  seq3: "1-day reminder",
  seq4: "Post-event thank you",
  seq5: "30-day follow-up",
};

export const EMAIL_SEQUENCE_SCHEDULE: Record<EmailSequenceKey, string> = {
  seq1: "On admin acceptance (confirmation + pass)",
  seq2: "7 days before event",
  seq3: "1 day before event",
  seq4: "1 day after event",
  seq5: "30 days after event",
};

export const SERIES_TITLE = "The Humans First Series with Vineet Nayar";

const HUMAN_QUESTION = "What part of being human will you never give up?";

export type SequenceRenderContext = {
  firstName: string;
  eventName: string;
  eventDateDetail: string;
  eventDateLong: string;
  eventTime: string;
  venue: string;
  eventCity: string;
  eventLocationFull: string;
  eventPageUrl: string;
  preOrderUrl: string;
  websiteUrl: string;
  calendar: { month: string; day: string; weekday: string };
  isPriorityPass?: boolean;
};

export type SequenceContent = {
  greeting: string;
  headerSubtitle?: string;
  headerTitle: string;
  showEventSummary: boolean;
  paragraphs: string[];
  humanQuestion?: string;
  showEventDetails: boolean;
  preOrderVariant?: "default" | "tomorrow";
  signOffLine: string;
  signOffTeam: string;
  cta?: { label: string; href: string };
};

export type SequenceTemplateContext = {
  firstName: string;
  eventName: string;
};

export function createInitialEmailSequence(): EmailSequenceStatus {
  return {
    seq1: { status: "pending" },
    seq2: { status: "pending" },
    seq3: { status: "pending" },
    seq4: { status: "pending" },
    seq5: { status: "pending" },
  };
}

export function getSequenceSubject(key: EmailSequenceKey, _ctx: SequenceTemplateContext): string {
  switch (key) {
    case "seq1":
      return "You’re In! Registration Confirmed: Humans First, Machine Second";
    case "seq2":
      return "One week to go: The Humans First Series";
    case "seq3":
      return "Tomorrow: Stay Curious. Stay Inspired.";
    case "seq4":
      return "Thank you for being part of The Humans First Series";
    case "seq5":
      return "A small Humans First reminder";
    default:
      return "The Humans First Series";
  }
}

const PRIORITY_PASS_LINE =
  "As a friend of Vineet Nayar, we are reserving your seat on a priority basis.";

export function getSequenceContent(
  key: EmailSequenceKey,
  ctx: SequenceRenderContext
): SequenceContent {
  const signOffLine = key === "seq5" ? "Warm regards," : "Best regards,";
  const signOffTeam = "Team Vineet Nayar";

  switch (key) {
    case "seq1":
      return {
        greeting: `Hi ${ctx.firstName},`,
        headerSubtitle: undefined,
        headerTitle: SERIES_TITLE,
        showEventSummary: false,
        paragraphs: [
          `Your seat for Humans First, Machines Second in ${ctx.eventCity} is confirmed.`,
          ...(ctx.isPriorityPass ? [PRIORITY_PASS_LINE] : []),
          "We're looking forward to welcoming you to join a movement with Vineet Nayar and a community of leaders, thinkers, and lifelong learners as we explore the human potential in the age of AI.",
          "Looking for a memorable keepsake from the evening?",
          "Bring your copy of Humans First, Machines Second - 30 Sparks to Reimagine Winning in the Age of AI to the event to get it signed by Vineet Nayar, and the chance to capture a photograph together.",
          "At a time when everyone is asking what AI can do, we're gathering to explore a different question:",
        ],
        humanQuestion: HUMAN_QUESTION,
        showEventDetails: false,
        preOrderVariant: undefined,
        signOffLine: "We can't wait to continue that conversation with you.",
        signOffTeam: "Team HFMS",
      };
    case "seq2":
      return {
        greeting: "Greetings,",
        headerSubtitle: "One week to go",
        headerTitle: SERIES_TITLE,
        showEventSummary: true,
        paragraphs: [
          `In one week, we gather for ${SERIES_TITLE}, a conversation about winning in the age of AI without losing what makes us human.`,
          "Please plan to arrive 30 minutes early to take part in the Humans First Wall. A question to carry with you until then:",
        ],
        humanQuestion: HUMAN_QUESTION,
        showEventDetails: false,
        preOrderVariant: "default",
        signOffLine,
        signOffTeam,
        cta: { label: "Event Page", href: ctx.eventPageUrl },
      };
    case "seq3":
      return {
        greeting: "Greetings,",
        headerSubtitle: "Tomorrow",
        headerTitle: SERIES_TITLE,
        showEventSummary: true,
        paragraphs: [
          `We look forward to seeing you tomorrow at ${SERIES_TITLE}.`,
          "Please bring your confirmation and arrive early. The Humans First Wall opens 30 minutes before we begin, and the evening will start on time.",
          "One question will guide the evening:",
        ],
        humanQuestion: HUMAN_QUESTION,
        showEventDetails: false,
        preOrderVariant: "tomorrow",
        signOffLine,
        signOffTeam,
        cta: { label: "Event Page", href: ctx.eventPageUrl },
      };
    case "seq4":
      return {
        greeting: "Greetings,",
        headerTitle: "Thank you for being part of The Humans First Series",
        showEventSummary: false,
        paragraphs: [
          `Thank you for joining ${SERIES_TITLE}.`,
          "Your answer on the Humans First Wall is now part of a growing national conversation about what we refuse to lose in the age of AI. We hope you left with one thought worth holding on to: humans matter more than ever.",
          "In the year ahead, we invite you to carry the promise forward and help at least two people discover what they are capable of becoming.",
        ],
        showEventDetails: false,
        signOffLine,
        signOffTeam,
        cta: { label: "Visit Website", href: ctx.websiteUrl },
      };
    case "seq5":
      return {
        greeting: `Dear ${ctx.firstName},`,
        headerTitle: "A small Humans First reminder",
        showEventSummary: false,
        paragraphs: [
          `It has been a month since we met at ${SERIES_TITLE}. That evening, we asked one question:`,
          HUMAN_QUESTION,
          "We also made a simple promise:",
          "To help at least two people discover what they are capable of becoming.",
          "This is a gentle reminder to act on that promise.",
          "It could be a student, a colleague, a friend, a young professional, a family member or someone who simply needs belief at the right moment.",
          "You do not need to tell them about the event. You do not need to mention the book.",
          "Just help them believe in themselves a little more than they did before. That is how the Humans First movement grows.",
        ],
        showEventDetails: false,
        signOffLine,
        signOffTeam,
      };
    default:
      return {
        greeting: "Greetings,",
        headerTitle: ctx.eventName,
        showEventSummary: false,
        paragraphs: [],
        showEventDetails: false,
        signOffLine,
        signOffTeam,
      };
  }
}

/** @deprecated Use buildSequenceEmailText from email-sequence-template.ts */
export function getSequenceTextParagraphs(
  key: EmailSequenceKey,
  ctx: SequenceTemplateContext
): string[] {
  return getSequenceContent(key, {
    firstName: ctx.firstName,
    eventName: ctx.eventName,
    eventDateDetail: "",
    eventDateLong: "",
    eventTime: "",
    venue: "",
    eventCity: "",
    eventLocationFull: "",
    eventPageUrl: "",
    preOrderUrl: "",
    websiteUrl: "",
    calendar: { month: "", day: "", weekday: "" },
  }).paragraphs;
}

export function isSequenceDue(
  key: EmailSequenceKey,
  reg: RegistrationDoc,
  now: Date = new Date()
): boolean {
  const eventEnd = reg.eventEndDate ?? reg.eventStartDate;
  const daysUntilStart = istCalendarDayDiff(now, reg.eventStartDate);
  const daysSinceEnd = istCalendarDayDiff(eventEnd, now);

  switch (key) {
    case "seq1":
      return true;
    case "seq2":
      return daysUntilStart === 7;
    case "seq3":
      return daysUntilStart === 1;
    case "seq4":
      return daysSinceEnd === 1;
    case "seq5":
      return daysSinceEnd === 30;
    default:
      return false;
  }
}

export function serializeEmailSequence(
  seq?: EmailSequenceStatus
): Record<EmailSequenceKey, { status: string; sentAt: string | null; error: string | null }> {
  const out = {} as Record<
    EmailSequenceKey,
    { status: string; sentAt: string | null; error: string | null }
  >;
  for (const key of EMAIL_SEQUENCE_ORDER) {
    const entry = seq?.[key];
    out[key] = {
      status: entry?.status ?? "pending",
      sentAt: entry?.sentAt instanceof Date ? entry.sentAt.toISOString() : entry?.sentAt ?? null,
      error: entry?.error ?? null,
    };
  }
  return out;
}
