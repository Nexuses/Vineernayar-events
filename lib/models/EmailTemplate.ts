import { getDb } from "../mongodb";
import type { ObjectId } from "mongodb";
import {
  type EmailTemplateKey,
  isEventScopedEmailTemplate,
} from "../email-template-keys";

export type { EmailTemplateKey } from "../email-template-keys";
export { isEventScopedEmailTemplate, GLOBAL_EMAIL_TEMPLATE_KEYS } from "../email-template-keys";

export interface EmailTemplateDoc {
  _id?: ObjectId;
  templateKey: EmailTemplateKey;
  /** Omitted or null for global templates (e.g. join movement). */
  eventId?: string | null;
  html: string;
  updatedAt: Date;
}

const COLLECTION = "email_templates";

function globalTemplateFilter(key: EmailTemplateKey) {
  return {
    templateKey: key,
    $or: [{ eventId: { $exists: false } }, { eventId: null }],
  };
}

function eventTemplateFilter(key: EmailTemplateKey, eventId: string) {
  return { templateKey: key, eventId };
}

export async function getEmailTemplatesCollection() {
  const db = await getDb();
  return db.collection<EmailTemplateDoc>(COLLECTION);
}

export async function getEmailTemplateOverride(
  key: EmailTemplateKey,
  eventId?: string
): Promise<string | null> {
  const col = await getEmailTemplatesCollection();

  if (eventId && isEventScopedEmailTemplate(key)) {
    const eventDoc = await col.findOne(eventTemplateFilter(key, eventId));
    if (eventDoc?.html?.trim()) return eventDoc.html.trim();
  }

  const globalDoc = await col.findOne(globalTemplateFilter(key));
  return globalDoc?.html?.trim() || null;
}

export async function getEventEmailTemplateOverride(
  key: EmailTemplateKey,
  eventId: string
): Promise<string | null> {
  const col = await getEmailTemplatesCollection();
  const doc = await col.findOne(eventTemplateFilter(key, eventId));
  return doc?.html?.trim() || null;
}

export async function getGlobalEmailTemplateOverride(
  key: EmailTemplateKey
): Promise<string | null> {
  const col = await getEmailTemplatesCollection();
  const doc = await col.findOne(globalTemplateFilter(key));
  return doc?.html?.trim() || null;
}

export async function upsertEmailTemplate(
  key: EmailTemplateKey,
  html: string,
  eventId?: string | null
): Promise<void> {
  const col = await getEmailTemplatesCollection();
  const filter =
    eventId && isEventScopedEmailTemplate(key)
      ? eventTemplateFilter(key, eventId)
      : globalTemplateFilter(key);

  await col.updateOne(
    filter,
    {
      $set: {
        templateKey: key,
        html: html.trim(),
        updatedAt: new Date(),
        ...(eventId && isEventScopedEmailTemplate(key) ? { eventId } : { eventId: null }),
      },
    },
    { upsert: true }
  );
}

export async function deleteEmailTemplate(
  key: EmailTemplateKey,
  eventId?: string | null
): Promise<void> {
  const col = await getEmailTemplatesCollection();
  const filter =
    eventId && isEventScopedEmailTemplate(key)
      ? eventTemplateFilter(key, eventId)
      : globalTemplateFilter(key);
  await col.deleteOne(filter);
}
