import { getDb } from "../mongodb";
import type { ObjectId } from "mongodb";

export type EmailTemplateKey =
  | "seq1"
  | "seq2"
  | "seq3"
  | "seq4"
  | "seq5"
  | "join_thank_you"
  | "join_notify";

export interface EmailTemplateDoc {
  _id?: ObjectId;
  templateKey: EmailTemplateKey;
  html: string;
  updatedAt: Date;
}

const COLLECTION = "email_templates";

export async function getEmailTemplatesCollection() {
  const db = await getDb();
  return db.collection<EmailTemplateDoc>(COLLECTION);
}

export async function getEmailTemplateOverride(
  key: EmailTemplateKey
): Promise<string | null> {
  const col = await getEmailTemplatesCollection();
  const doc = await col.findOne({ templateKey: key });
  return doc?.html?.trim() || null;
}

export async function listEmailTemplateOverrides(): Promise<
  Record<EmailTemplateKey, string>
> {
  const col = await getEmailTemplatesCollection();
  const docs = await col.find({}).toArray();
  const out = {} as Record<EmailTemplateKey, string>;
  for (const doc of docs) {
    if (doc.html?.trim()) {
      out[doc.templateKey] = doc.html;
    }
  }
  return out;
}

export async function upsertEmailTemplate(
  key: EmailTemplateKey,
  html: string
): Promise<void> {
  const col = await getEmailTemplatesCollection();
  await col.updateOne(
    { templateKey: key },
    {
      $set: {
        templateKey: key,
        html: html.trim(),
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
}

export async function deleteEmailTemplate(key: EmailTemplateKey): Promise<void> {
  const col = await getEmailTemplatesCollection();
  await col.deleteOne({ templateKey: key });
}
