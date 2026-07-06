export type WhatsAppTemplateKey =
  | "seq1"
  | "seq2"
  | "seq3"
  | "seq4";

export const WHATSAPP_TEMPLATE_KEYS: WhatsAppTemplateKey[] = [
  "seq1",
  "seq2",
  "seq3",
  "seq4",
];

export function isEventScopedWhatsAppTemplate(_key: WhatsAppTemplateKey): boolean {
  return true;
}
