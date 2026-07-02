import type { EmailSequenceKey, SequenceRenderContext } from "@/lib/email-sequence";
import {
  applyEmailTemplate,
  sequenceContextToVars,
} from "@/lib/email-template-registry";
import {
  getDefaultWhatsAppTemplateText,
  getWhatsAppPreviewText,
} from "@/lib/whatsapp-template-registry";
import type { WhatsAppTemplateKey } from "@/lib/whatsapp-template-keys";
import { getWhatsAppTemplateOverride } from "@/lib/models/WhatsAppTemplate";

export async function resolveWhatsAppMessageText(
  key: WhatsAppTemplateKey,
  ctx: SequenceRenderContext,
  eventId: string
): Promise<string> {
  const custom = await getWhatsAppTemplateOverride(key, eventId);
  return getWhatsAppPreviewText(key, custom, ctx);
}

export async function resolveSequenceWhatsAppMessageText(
  key: EmailSequenceKey,
  ctx: SequenceRenderContext,
  eventId: string
): Promise<string> {
  return resolveWhatsAppMessageText(key as WhatsAppTemplateKey, ctx, eventId);
}

export function renderWhatsAppTemplateText(
  template: string,
  ctx: SequenceRenderContext
): string {
  if (/\{\{\w+\}\}/.test(template)) {
    return applyEmailTemplate(template, sequenceContextToVars(ctx));
  }
  return template;
}

export function getDefaultSequenceWhatsAppText(
  key: WhatsAppTemplateKey,
  ctx: SequenceRenderContext
): string {
  return getDefaultWhatsAppTemplateText(key, ctx);
}
