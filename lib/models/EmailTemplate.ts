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
  /** Optional custom subject override. */
  subject?: string | null;
  updatedAt: Date;
}

export type EmailTemplateOverride = {
  html: string | null;
  subject: string | null;
};

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

function toOverride(doc: EmailTemplateDoc | null): EmailTemplateOverride | null {
  if (!doc) return null;
  const html = doc.html?.trim() || null;
  const subject = doc.subject?.trim() || null;
  if (!html && !subject) return null;
  return { html, subject };
}

export async function getEmailTemplatesCollection() {
  const db = await getDb();
  return db.collection<EmailTemplateDoc>(COLLECTION);
}

export async function getEmailTemplateOverride(
  key: EmailTemplateKey,
  eventId?: string
): Promise<EmailTemplateOverride | null> {
  const col = await getEmailTemplatesCollection();

  if (eventId && isEventScopedEmailTemplate(key)) {
    const eventDoc = await col.findOne(eventTemplateFilter(key, eventId));
    const eventOverride = toOverride(eventDoc);
    if (eventOverride) return eventOverride;
  }

  const globalDoc = await col.findOne(globalTemplateFilter(key));
  return toOverride(globalDoc);
}

export async function getEventEmailTemplateOverride(
  key: EmailTemplateKey,
  eventId: string
): Promise<EmailTemplateOverride | null> {
  const col = await getEmailTemplatesCollection();
  const doc = await col.findOne(eventTemplateFilter(key, eventId));
  return toOverride(doc);
}

export async function getGlobalEmailTemplateOverride(
  key: EmailTemplateKey
): Promise<EmailTemplateOverride | null> {
  const col = await getEmailTemplatesCollection();
  const doc = await col.findOne(globalTemplateFilter(key));
  return toOverride(doc);
}

export async function upsertEmailTemplate(
  key: EmailTemplateKey,
  html: string,
  eventId?: string | null,
  subject?: string | null
): Promise<void> {
  const col = await getEmailTemplatesCollection();
  const filter =
    eventId && isEventScopedEmailTemplate(key)
      ? eventTemplateFilter(key, eventId)
      : globalTemplateFilter(key);

  const trimmedSubject = typeof subject === "string" ? subject.trim() : "";

  await col.updateOne(
    filter,
    {
      $set: {
        templateKey: key,
        html: html.trim(),
        subject: trimmedSubject || null,
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
