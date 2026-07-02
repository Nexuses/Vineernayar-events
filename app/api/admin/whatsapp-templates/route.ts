import { NextResponse } from "next/server";
import {
  buildSampleSequenceContextFromEvent,
  getDefaultWhatsAppTemplateText,
  getSampleSequenceContext,
  getWhatsAppPreviewText,
  sequenceContextToVars,
  WHATSAPP_TEMPLATE_DEFINITIONS,
} from "@/lib/whatsapp-template-registry";
import type { SequenceRenderContext } from "@/lib/email-sequence";
import {
  deleteWhatsAppTemplate,
  getEventWhatsAppTemplateOverride,
  upsertWhatsAppTemplate,
} from "@/lib/models/WhatsAppTemplate";
import type { WhatsAppTemplateKey } from "@/lib/whatsapp-template-keys";
import { getPublishedEventByEventId } from "@/lib/models/Event";
import {
  forbiddenResponse,
  getAdminSession,
  isSuperAdmin,
  unauthorizedResponse,
} from "@/lib/admin-access";

export const dynamic = "force-dynamic";

const VALID_KEYS = new Set(WHATSAPP_TEMPLATE_DEFINITIONS.map((t) => t.key));

function isValidKey(key: string): key is WhatsAppTemplateKey {
  return VALID_KEYS.has(key as WhatsAppTemplateKey);
}

async function getPreviewContext(eventId?: string): Promise<SequenceRenderContext> {
  if (!eventId) return getSampleSequenceContext();
  const event = await getPublishedEventByEventId(eventId);
  if (!event) return getSampleSequenceContext();
  return buildSampleSequenceContextFromEvent({
    eventId: event.eventId,
    eventName: event.eventName,
    eventStartDate: event.eventStartDate,
    eventEndDate: event.eventEndDate,
    eventTime: event.eventTime,
    venue: event.venue,
  });
}

async function buildTemplateList(eventId: string) {
  const previewContext = await getPreviewContext(eventId);

  const templates = await Promise.all(
    WHATSAPP_TEMPLATE_DEFINITIONS.map(async (def) => {
      const customText = await getEventWhatsAppTemplateOverride(def.key, eventId);
      const defaultText = getDefaultWhatsAppTemplateText(def.key, previewContext);
      const editorText = customText ?? defaultText;

      return {
        ...def,
        eventScoped: true,
        defaultText,
        customText,
        hasCustom: Boolean(customText),
        previewText: getWhatsAppPreviewText(def.key, customText, previewContext),
        editorText,
      };
    })
  );

  return templates;
}

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();
  if (!isSuperAdmin(session)) return forbiddenResponse();

  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId")?.trim();

    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    const event = await getPublishedEventByEventId(eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const templates = await buildTemplateList(eventId);
    const previewContext = await getPreviewContext(eventId);
    return NextResponse.json({
      eventId,
      eventName: event.eventName,
      previewVars: sequenceContextToVars(previewContext),
      templates,
    });
  } catch (err) {
    console.error("List WhatsApp templates error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();
  if (!isSuperAdmin(session)) return forbiddenResponse();

  try {
    const body = await request.json();
    const { key, text, reset, eventId } = body as {
      key?: string;
      text?: string;
      reset?: boolean;
      eventId?: string;
    };

    if (!key || !isValidKey(key)) {
      return NextResponse.json({ error: "Invalid template key" }, { status: 400 });
    }

    const resolvedEventId = eventId?.trim();
    if (!resolvedEventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    const event = await getPublishedEventByEventId(resolvedEventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const ctx = await getPreviewContext(resolvedEventId);

    if (reset) {
      await deleteWhatsAppTemplate(key, resolvedEventId);
      const defaultText = getDefaultWhatsAppTemplateText(key, ctx);
      return NextResponse.json({
        success: true,
        key,
        eventId: resolvedEventId,
        customText: null,
        hasCustom: false,
        previewText: defaultText,
        editorText: defaultText,
      });
    }

    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Message text is required" }, { status: 400 });
    }

    const customText = text.trim();
    await upsertWhatsAppTemplate(key, customText, resolvedEventId);

    return NextResponse.json({
      success: true,
      key,
      eventId: resolvedEventId,
      customText,
      hasCustom: true,
      previewText: getWhatsAppPreviewText(key, customText, ctx),
      editorText: customText,
    });
  } catch (err) {
    console.error("Update WhatsApp template error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
