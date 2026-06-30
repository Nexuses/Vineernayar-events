import { NextResponse } from "next/server";
import {
  assertEventAccess,
  getAdminSession,
  unauthorizedResponse,
} from "@/lib/admin-access";
import { applyBlastTemplate, buildBlastVars, sendBlastEmail } from "@/lib/email-blast";
import { isMailConfigured } from "@/lib/mail";
import type { BlastAudience } from "@/lib/models/Registration";
import { listRegistrationsForEmailBlast } from "@/lib/models/Registration";
import { getEventByEventId } from "@/lib/models/Event";

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

    const denied = assertEventAccess(session, eventId);
    if (denied) return denied;

    const event = await getEventByEventId(eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const recipients = await listRegistrationsForEmailBlast(eventId, audience);
    if (recipients.length === 0) {
      return NextResponse.json({ error: "No recipients found for this selection" }, { status: 400 });
    }

    let sent = 0;
    const failures: { email: string; error: string }[] = [];

    for (const reg of recipients) {
      const vars = buildBlastVars(reg);
      try {
        await sendBlastEmail({
          to: reg.email,
          toName: `${reg.firstName} ${reg.surname}`.trim(),
          subject: applyBlastTemplate(subject, vars),
          html: applyBlastTemplate(html, vars),
        });
        sent += 1;
      } catch (err) {
        failures.push({
          email: reg.email,
          error: err instanceof Error ? err.message : "Send failed",
        });
      }
    }

    return NextResponse.json({
      ok: failures.length === 0,
      eventName: event.eventName,
      audience,
      total: recipients.length,
      sent,
      failed: failures.length,
      failures: failures.slice(0, 10),
    });
  } catch (err) {
    console.error("Email blast send error:", err);
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
