import { NextResponse } from "next/server";
import {
  assertEventAccess,
  getAdminSession,
  unauthorizedResponse,
} from "@/lib/admin-access";
import type { BlastAudience } from "@/lib/models/Registration";
import {
  countRegistrationsForEmailBlast,
  listRegistrationsForEmailBlast,
} from "@/lib/models/Registration";
import { getEventByEventId } from "@/lib/models/Event";

function parseAudience(value: string | null): BlastAudience {
  if (value === "waitlisted" || value === "all") return value;
  return "confirmed";
}

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId")?.trim();
  if (!eventId) {
    return NextResponse.json({ error: "eventId required" }, { status: 400 });
  }

  const denied = assertEventAccess(session, eventId);
  if (denied) return denied;

  try {
    const audience = parseAudience(searchParams.get("audience"));
    const event = await getEventByEventId(eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const [count, recipients] = await Promise.all([
      countRegistrationsForEmailBlast(eventId, audience),
      listRegistrationsForEmailBlast(eventId, audience),
    ]);

    return NextResponse.json({
      eventId,
      eventName: event.eventName,
      audience,
      count,
      preview: recipients.slice(0, 8).map((r) => ({
        firstName: r.firstName,
        surname: r.surname,
        email: r.email,
      })),
    });
  } catch (err) {
    console.error("Email blast recipients error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
