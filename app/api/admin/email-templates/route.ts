import { NextResponse } from "next/server";
import { getAdminFromCookie } from "@/lib/auth";
import {
  EMAIL_TEMPLATE_DEFINITIONS,
  getDefaultTemplateHtml,
  getPreviewHtml,
} from "@/lib/email-template-registry";
import {
  deleteEmailTemplate,
  listEmailTemplateOverrides,
  upsertEmailTemplate,
  type EmailTemplateKey,
} from "@/lib/models/EmailTemplate";

export const dynamic = "force-dynamic";

const VALID_KEYS = new Set(EMAIL_TEMPLATE_DEFINITIONS.map((t) => t.key));

function isValidKey(key: string): key is EmailTemplateKey {
  return VALID_KEYS.has(key as EmailTemplateKey);
}

export async function GET() {
  const admin = await getAdminFromCookie();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const overrides = await listEmailTemplateOverrides();
    const templates = EMAIL_TEMPLATE_DEFINITIONS.map((def) => {
      const customHtml = overrides[def.key] ?? null;
      const defaultHtml = getDefaultTemplateHtml(def.key);
      return {
        ...def,
        defaultHtml,
        customHtml,
        hasCustom: Boolean(customHtml),
        previewHtml: getPreviewHtml(def.key, customHtml),
        editorHtml: customHtml ?? defaultHtml,
      };
    });

    return NextResponse.json({ templates });
  } catch (err) {
    console.error("List email templates error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const admin = await getAdminFromCookie();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { key, html, reset } = body as {
      key?: string;
      html?: string;
      reset?: boolean;
    };

    if (!key || !isValidKey(key)) {
      return NextResponse.json({ error: "Invalid template key" }, { status: 400 });
    }

    if (reset) {
      await deleteEmailTemplate(key);
      return NextResponse.json({
        success: true,
        key,
        customHtml: null,
        previewHtml: getPreviewHtml(key, null),
        editorHtml: getDefaultTemplateHtml(key),
      });
    }

    if (typeof html !== "string" || !html.trim()) {
      return NextResponse.json({ error: "HTML is required" }, { status: 400 });
    }

    await upsertEmailTemplate(key, html);
    const customHtml = html.trim();

    return NextResponse.json({
      success: true,
      key,
      customHtml,
      previewHtml: getPreviewHtml(key, customHtml),
      editorHtml: customHtml,
    });
  } catch (err) {
    console.error("Update email template error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
