import {
  EMAIL_SEQUENCE_LABELS,
  EMAIL_SEQUENCE_ORDER,
  EMAIL_SEQUENCE_SCHEDULE,
  type EmailSequenceEntry,
  type EmailSequenceKey,
} from "@/lib/email-sequence";

export type WhatsAppSequenceKey = EmailSequenceKey;
export type WhatsAppSequenceEntry = EmailSequenceEntry;
export type WhatsAppSequenceStatus = Partial<Record<WhatsAppSequenceKey, WhatsAppSequenceEntry>>;

export const WHATSAPP_SEQUENCE_ORDER = EMAIL_SEQUENCE_ORDER;
export const WHATSAPP_SEQUENCE_LABELS = EMAIL_SEQUENCE_LABELS;
export const WHATSAPP_SEQUENCE_SCHEDULE = EMAIL_SEQUENCE_SCHEDULE;

export function createInitialWhatsAppSequence(): WhatsAppSequenceStatus {
  return {
    seq1: { status: "pending" },
    seq2: { status: "pending" },
    seq3: { status: "pending" },
    seq4: { status: "pending" },
  };
}

export function serializeWhatsAppSequence(
  seq?: WhatsAppSequenceStatus
): Record<WhatsAppSequenceKey, { status: string; sentAt: string | null; error: string | null }> {
  const out = {} as Record<
    WhatsAppSequenceKey,
    { status: string; sentAt: string | null; error: string | null }
  >;
  for (const key of WHATSAPP_SEQUENCE_ORDER) {
    const entry = seq?.[key];
    out[key] = {
      status: entry?.status ?? "pending",
      sentAt: entry?.sentAt instanceof Date ? entry.sentAt.toISOString() : entry?.sentAt ?? null,
      error: entry?.error ?? null,
    };
  }
  return out;
}
