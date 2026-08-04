import { NextResponse } from "next/server";
import { getEmailSequenceStats } from "@/lib/models/Registration";
import {
  assertEventAccess,
  getAdminSession,
  listEventsForAdmin,
  unauthorizedResponse,
} from "@/lib/admin-access";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId")?.trim();

  try {
    if (eventId) {
      const denied = assertEventAccess(session, eventId);
      if (denied) return denied;
      const stats = await getEmailSequenceStats([eventId]);
      return NextResponse.json(stats);
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
