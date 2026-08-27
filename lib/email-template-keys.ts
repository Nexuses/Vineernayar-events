export type EmailTemplateKey =
  | "seq1"
  | "seq2"
  | "seq3"
  | "seq4"
  | "reconfirm"
  | "reconfirm_2"
  | "join_thank_you"
  | "join_notify";

export const GLOBAL_EMAIL_TEMPLATE_KEYS = new Set<EmailTemplateKey>([
  "join_thank_you",
  "join_notify",
]);

export function isEventScopedEmailTemplate(key: EmailTemplateKey): boolean {
  return !GLOBAL_EMAIL_TEMPLATE_KEYS.has(key);
}
