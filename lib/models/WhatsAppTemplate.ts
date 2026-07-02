import { getDb } from "../mongodb";
import type { ObjectId } from "mongodb";
import type { WhatsAppTemplateKey } from "../whatsapp-template-keys";

export interface WhatsAppTemplateDoc {
  _id?: ObjectId;
  templateKey: WhatsAppTemplateKey;
  eventId: string;
  text: string;
  updatedAt: Date;
}

const COLLECTION = "whatsapp_templates";

function eventTemplateFilter(key: WhatsAppTemplateKey, eventId: string) {
  return { templateKey: key, eventId };
}

export async function getWhatsAppTemplatesCollection() {
  const db = await getDb();
  return db.collection<WhatsAppTemplateDoc>(COLLECTION);
}

export async function getWhatsAppTemplateOverride(
  key: WhatsAppTemplateKey,
  eventId: string
): Promise<string | null> {
  const col = await getWhatsAppTemplatesCollection();
  const doc = await col.findOne(eventTemplateFilter(key, eventId));
  return doc?.text?.trim() || null;
}

export async function getEventWhatsAppTemplateOverride(
  key: WhatsAppTemplateKey,
  eventId: string
): Promise<string | null> {
  return getWhatsAppTemplateOverride(key, eventId);
}

export async function upsertWhatsAppTemplate(
  key: WhatsAppTemplateKey,
  text: string,
  eventId: string
): Promise<void> {
  const col = await getWhatsAppTemplatesCollection();
  await col.updateOne(
    eventTemplateFilter(key, eventId),
    {
      $set: {
        templateKey: key,
        eventId,
        text: text.trim(),
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
}

export async function deleteWhatsAppTemplate(
  key: WhatsAppTemplateKey,
  eventId: string
): Promise<void> {
  const col = await getWhatsAppTemplatesCollection();
  await col.deleteOne(eventTemplateFilter(key, eventId));
}
