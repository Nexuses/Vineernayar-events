import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { type WhatsAppSequenceKey } from "@/lib/whatsapp-sequence";
import { getEventByEventId } from "@/lib/models/Event";
import { getEventPassPath } from "@/lib/event-path";
import { getPublicSiteUrl } from "@/lib/site-url";
import { getRegistrationById, getRegistrationsCollection } from "@/lib/models/Registration";
import { sendEnablexWhatsAppText } from "@/lib/enablex-whatsapp";
import { buildSequenceRenderContext } from "@/lib/email-sequence-template";
import { resolveSequenceWhatsAppMessageText } from "@/lib/whatsapp-template-resolve";
import {
  assertEventAccess,
  getAdminSession,
  unauthorizedResponse,
} from "@/lib/admin-access";

const ALLOWED_SEQUENCE_KEYS = new Set<WhatsAppSequenceKey>([
  "seq1",
  "seq2",
  "seq3",
  "seq4",
  "seq5",
]);

function parseSequenceKey(value: unknown): WhatsAppSequenceKey {
  const key = String(value ?? "seq1") as WhatsAppSequenceKey;
  return ALLOWED_SEQUENCE_KEYS.has(key) ? key : "seq1";
}

async function buildPassUrl(eventId: string, uniqueCode: string): Promise<string> {
  const base = getPublicSiteUrl();
  const event = await getEventByEventId(eventId);
  if (event) return `${base}${getEventPassPath(event, uniqueCode)}`;
  return `${base}/events/${eventId}/pass/${uniqueCode}`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();

  try {
    const { id } = await params;
    const reg = await getRegistrationById(id);
    if (!reg) return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    const denied = assertEventAccess(session, reg.eventId);
    if (denied) return denied;

    const body = await request.json().catch(() => ({}));
    const key = parseSequenceKey((body as { sequenceKey?: unknown }).sequenceKey);
    const passUrl = await buildPassUrl(reg.eventId, reg.uniqueCode);
    const renderCtx = buildSequenceRenderContext({
      firstName: reg.firstName,
      eventName: reg.eventName,
      eventStartDate:
        reg.eventStartDate instanceof Date ? reg.eventStartDate.toISOString() : String(reg.eventStartDate),
      eventEndDate:
        reg.eventEndDate instanceof Date ? reg.eventEndDate.toISOString() : String(reg.eventEndDate),
      eventTime: reg.eventTime,
      venue: reg.venue,
      passUrl,
      priorityPass: reg.workedWithVineet === true,
    });
    const targetNumber = reg.whatsappNumber || reg.mobileNumber || "";
    const message = await resolveSequenceWhatsAppMessageText(key, renderCtx, reg.eventId);
    const sendResult = await sendEnablexWhatsAppText({
      to: targetNumber,
      message: message.slice(0, 3900),
    });
    const ok = sendResult.ok;

    if (reg._id && ObjectId.isValid(reg._id.toString())) {
      const col = await getRegistrationsCollection();
      const entry: { status: "sent" | "failed"; sentAt?: Date; error?: string } = {
        status: ok ? "sent" : "failed",
      };
      if (ok) entry.sentAt = new Date();
      else entry.error = sendResult.error || "WhatsApp delivery failed";
      await col.updateOne(
        { _id: new ObjectId(reg._id.toString()) },
        { $set: { [`whatsappSequence.${key}`]: entry } }
      );
    }

    return NextResponse.json({
      ok,
      sequenceKey: key,
      providerError: ok ? null : sendResult.error || null,
      message: ok
        ? "WhatsApp test message accepted by provider"
        : "WhatsApp test message failed. Check status/error in registration details.",
    });
  } catch (err) {
    console.error("WhatsApp test send failed:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
