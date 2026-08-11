import { NextResponse } from "next/server";
import { getEmailSequenceStats } from "@/lib/models/Registration";
import { getEventByEventId, normalizeEmailsEnabled } from "@/lib/models/Event";
import { getEventCountdownRange } from "@/lib/date-utils";
import type { EmailSequenceKey } from "@/lib/email-sequence";
import {
  assertEventAccess,
  getAdminSession,
  listEventsForAdmin,
  unauthorizedResponse,
} from "@/lib/admin-access";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Approximate scheduled send instant per email, from the event dates. */
function buildSchedule(event: {
  eventStartDate: Date;
  eventEndDate: Date;
  eventTime?: string;
}): Record<EmailSequenceKey, string | null> {
  const start = new Date(event.eventStartDate).getTime();
  const end = new Date(event.eventEndDate ?? event.eventStartDate).getTime();
  const range = getEventCountdownRange({
    eventStartDate: event.eventStartDate,
    eventEndDate: event.eventEndDate ?? event.eventStartDate,
    eventTime: event.eventTime,
  });
  return {
    seq1: null, // sent on registration/acceptance, not on a fixed date
    seq2: new Date(start - 2 * DAY_MS).toISOString(),
    seq3: range ? new Date(range.start.getTime() - DAY_MS).toISOString() : null,
    seq4: new Date(end + DAY_MS).toISOString(),
  };
}

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId")?.trim();

  try {
    if (eventId) {
      const denied = assertEventAccess(session, eventId);
      if (denied) return denied;
      const [stats, event] = await Promise.all([
        getEmailSequenceStats([eventId]),
        getEventByEventId(eventId),
      ]);
      const schedule = event ? buildSchedule(event) : null;
      const emailsEnabled = event ? normalizeEmailsEnabled(event.emailsEnabled) : null;
      return NextResponse.json({ ...stats, schedule, emailsEnabled });
    }

    // No event selected — aggregate across every event this admin can access.
    const events = await listEventsForAdmin(session);
    const eventIds = events.map((e) => e.eventId);
    const stats = await getEmailSequenceStats(eventIds);
    return NextResponse.json(stats);
  } catch (err) {
    console.error("Email stats error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
