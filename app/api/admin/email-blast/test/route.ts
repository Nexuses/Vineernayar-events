import { NextResponse } from "next/server";
import {
  assertEventAccess,
  getAdminSession,
  unauthorizedResponse,
} from "@/lib/admin-access";
import {
  applyBlastTemplate,
  buildBlastVars,
  getSampleBlastVars,
  sendBlastEmail,
} from "@/lib/email-blast";
import { isMailConfigured } from "@/lib/mail";
import type { BlastAudience } from "@/lib/models/Registration";
import { listRegistrationsForEmailBlast } from "@/lib/models/Registration";

function parseAudience(value: unknown): BlastAudience {
  if (value === "waitlisted" || value === "all") return value;
  return "confirmed";
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();

  if (!isMailConfigured()) {
    return NextResponse.json({ error: "Email is not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const eventId = typeof body?.eventId === "string" ? body.eventId.trim() : "";
    const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
    const html = typeof body?.html === "string" ? body.html.trim() : "";
    const testEmail = typeof body?.testEmail === "string" ? body.testEmail.trim() : "";
    const audience = parseAudience(body?.audience);

    if (!eventId) {
      return NextResponse.json({ error: "eventId required" }, { status: 400 });
    }
    if (!subject) {
      return NextResponse.json({ error: "Subject is required" }, { status: 400 });
    }
    if (!html) {
      return NextResponse.json({ error: "HTML body is required" }, { status: 400 });
    }
    if (!testEmail || !testEmail.includes("@")) {
      return NextResponse.json({ error: "A valid test email is required" }, { status: 400 });
    }

    const denied = assertEventAccess(session, eventId);
    if (denied) return denied;

    const recipients = await listRegistrationsForEmailBlast(eventId, audience);
    const sampleReg = recipients[0];
    const vars = sampleReg ? buildBlastVars(sampleReg) : getSampleBlastVars();

    await sendBlastEmail({
      to: testEmail,
      toName: session.name,
      subject: applyBlastTemplate(subject, vars),
      html: applyBlastTemplate(html, vars),
    });

    return NextResponse.json({ ok: true, sentTo: testEmail });
  } catch (err) {
    console.error("Email blast test error:", err);
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
