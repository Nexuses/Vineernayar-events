import { istCalendarDayDiff } from "./date-utils";
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
  seq1: "On registration",
  seq2: "7 days before event",
  seq3: "1 day before event",
  seq4: "1 day after event",
  seq5: "30 days after event",
};

const HUMAN_QUESTION =
  "What part of being human will you never give up?";

export type SequenceTemplateContext = {
  firstName: string;
  eventName: string;
};

function capitalizeFirst(s: string): string {
  const text = String(s || "").trim();
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function createInitialEmailSequence(): EmailSequenceStatus {
  return {
    seq1: { status: "pending" },
    seq2: { status: "pending" },
    seq3: { status: "pending" },
    seq4: { status: "pending" },
    seq5: { status: "pending" },
  };
}

export function getSequenceSubject(key: EmailSequenceKey, ctx: SequenceTemplateContext): string {
  const name = ctx.eventName.trim();
  switch (key) {
    case "seq1":
      return `You are registered for ${name}`;
    case "seq2":
      return `One week to go: ${name}`;
    case "seq3":
      return "Tomorrow: Stay Curious. Stay Inspired.";
    case "seq4":
      return `Thank you for being part of ${name}`;
    case "seq5":
      return "A small Humans First reminder";
    default:
      return name;
  }
}

export function getSequenceTextParagraphs(
  key: EmailSequenceKey,
  ctx: SequenceTemplateContext
): string[] {
  const first = capitalizeFirst(ctx.firstName);
  const event = ctx.eventName.trim();

  switch (key) {
    case "seq1":
      return [
        `Thank you for registering for ${event}. Before we meet, we invite you to think about one question:`,
        HUMAN_QUESTION,
        "You will see this question again when you arrive. We look forward to welcoming you.",
      ];
    case "seq2":
      return [
        "In one week, we gather for a conversation on winning in the age of AI without losing what makes us human.",
        "Please arrive 30 minutes early to participate in the Humans First Wall.",
        `Question to think about: ${HUMAN_QUESTION}`,
      ];
    case "seq3":
      return [
        `We look forward to seeing you tomorrow at ${event}.`,
        "Please bring your confirmation and arrive early. The event will begin on time.",
        `One question will guide the evening: ${HUMAN_QUESTION}`,
      ];
    case "seq4":
      return [
        `Thank you for joining ${event}.`,
        "Your answer on the Humans First Wall is now part of a growing national conversation about what we refuse to lose in the age of AI.",
        "We hope you left with one thought: humans matter more than ever.",
        "In the coming year, we invite you to help at least two people discover what they are capable of becoming.",
      ];
    case "seq5":
      return [
        `It has been a month since we met at ${event}. That evening, we asked one question:`,
        HUMAN_QUESTION,
        "We also made a simple promise:",
        "To help at least two people discover what they are capable of becoming.",
        "This is a gentle reminder to act on that promise.",
        "It could be a student, a colleague, a friend, a young professional, a family member or someone who simply needs belief at the right moment.",
        "You do not need to tell them about the event. You do not need to mention the book.",
        "Just help them believe in themselves a little more than they did before. That is how the Humans First movement grows.",
        "Stay curious. Stay inspired.",
        "Warm regards,",
        "Team Vineet Nayar",
      ];
    default:
      return [];
  }
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
