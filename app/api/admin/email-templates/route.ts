import { NextResponse } from "next/server";
import {
  buildSampleSequenceContextFromEvent,
  EMAIL_TEMPLATE_DEFINITIONS,
  getDefaultTemplateHtml,
  getDefaultTemplateSubject,
  getPreviewHtml,
  getSampleSequenceContext,
  sequenceContextToVars,
} from "@/lib/email-template-registry";
import type { SequenceRenderContext } from "@/lib/email-sequence";
import { BRAND_LOGO_URL } from "@/lib/constants";
import {
  deleteEmailTemplate,
  getEventEmailTemplateOverride,
  getGlobalEmailTemplateOverride,
  upsertEmailTemplate,
  type EmailTemplateOverride,
} from "@/lib/models/EmailTemplate";
import { isEventScopedEmailTemplate } from "@/lib/email-template-keys";
import type { EmailTemplateKey } from "@/lib/email-template-keys";
import { getPublishedEventByEventId } from "@/lib/models/Event";
import {
  forbiddenResponse,
  getAdminSession,
  isSuperAdmin,
  unauthorizedResponse,
} from "@/lib/admin-access";

export const dynamic = "force-dynamic";

const VALID_KEYS = new Set(EMAIL_TEMPLATE_DEFINITIONS.map((t) => t.key));

function isValidKey(key: string): key is EmailTemplateKey {
  return VALID_KEYS.has(key as EmailTemplateKey);
}

function resolveEffective(
  scoped: boolean,
  eventOverride: EmailTemplateOverride | null,
  globalOverride: EmailTemplateOverride | null
) {
  if (scoped) {
    return {
      html: eventOverride?.html ?? globalOverride?.html ?? null,
      subject: eventOverride?.subject ?? globalOverride?.subject ?? null,
      hasCustom: Boolean(eventOverride),
    };
  }
  return {
    html: globalOverride?.html ?? null,
    subject: globalOverride?.subject ?? null,
    hasCustom: Boolean(globalOverride),
  };
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
    EMAIL_TEMPLATE_DEFINITIONS.map(async (def) => {
      const scoped = isEventScopedEmailTemplate(def.key);
      const eventOverride = scoped ? await getEventEmailTemplateOverride(def.key, eventId) : null;
      const globalOverride = await getGlobalEmailTemplateOverride(def.key);
      const effective = resolveEffective(scoped, eventOverride, scoped ? globalOverride : globalOverride);
      const defaultHtml = getDefaultTemplateHtml(def.key);
      const defaultSubject = getDefaultTemplateSubject(def.key);
      const editorHtml = effective.html ?? defaultHtml;
      const subject = effective.subject ?? defaultSubject;

      return {
        ...def,
        defaultSubject,
        subject,
        eventScoped: scoped,
        defaultHtml,
        customHtml: effective.html,
        hasCustom: effective.hasCustom,
        previewHtml: getPreviewHtml(def.key, effective.html, previewContext),
        editorHtml,
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
      previewVars: {
        ...sequenceContextToVars(previewContext),
        logoUrl: process.env.EMAIL_LOGO_URL || BRAND_LOGO_URL,
      },
      templates,
    });
  } catch (err) {
    console.error("List email templates error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();
  if (!isSuperAdmin(session)) return forbiddenResponse();

  try {
    const body = await request.json();
    const { key, html, subject, reset, eventId } = body as {
      key?: string;
      html?: string;
      subject?: string;
      reset?: boolean;
      eventId?: string;
    };

    if (!key || !isValidKey(key)) {
      return NextResponse.json({ error: "Invalid template key" }, { status: 400 });
    }

    const scoped = isEventScopedEmailTemplate(key);
    const resolvedEventId = eventId?.trim() || undefined;
    const defaultSubject = getDefaultTemplateSubject(key);

    if (scoped && !resolvedEventId) {
      return NextResponse.json({ error: "eventId is required for this template" }, { status: 400 });
    }

    if (scoped) {
      const event = await getPublishedEventByEventId(resolvedEventId!);
      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }
    }

    const ctx = scoped && resolvedEventId
      ? await getPreviewContext(resolvedEventId)
      : getSampleSequenceContext();

    if (reset) {
      await deleteEmailTemplate(key, scoped ? resolvedEventId : null);
      const eventOverride =
        scoped && resolvedEventId
          ? await getEventEmailTemplateOverride(key, resolvedEventId)
          : null;
      const globalOverride = await getGlobalEmailTemplateOverride(key);
      const effective = resolveEffective(scoped, eventOverride, globalOverride);
      const defaultHtml = getDefaultTemplateHtml(key);
      const editorHtml = effective.html ?? defaultHtml;
      const resolvedSubject = effective.subject ?? defaultSubject;

      return NextResponse.json({
        success: true,
        key,
        eventId: scoped ? resolvedEventId : null,
        customHtml: effective.html,
        subject: resolvedSubject,
        defaultSubject,
        hasCustom: effective.hasCustom,
        previewHtml: getPreviewHtml(
          key,
          editorHtml === defaultHtml ? null : editorHtml,
          ctx
        ),
        editorHtml,
      });
    }

    if (typeof html !== "string" || !html.trim()) {
      return NextResponse.json({ error: "HTML is required" }, { status: 400 });
    }

    if (typeof subject !== "string" || !subject.trim()) {
      return NextResponse.json({ error: "Subject line is required" }, { status: 400 });
    }

    const customHtml = html.trim();
    const customSubject = subject.trim();
    await upsertEmailTemplate(key, customHtml, scoped ? resolvedEventId : null, customSubject);

    return NextResponse.json({
      success: true,
      key,
      eventId: scoped ? resolvedEventId : null,
      customHtml,
      subject: customSubject,
      defaultSubject,
      hasCustom: true,
      previewHtml: getPreviewHtml(key, customHtml, ctx),
      editorHtml: customHtml,
    });
  } catch (err) {
    console.error("Update email template error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
