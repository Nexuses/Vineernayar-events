import { NextResponse } from "next/server";
import {
  assertEventAccess,
  getAdminSession,
  isSubManager,
  forbiddenResponse,
  unauthorizedResponse,
} from "@/lib/admin-access";
import { listEmailBlastLogsByEventIds } from "@/lib/models/EmailBlastLog";
import {
  countRegistrationsForEmailBlast,
  listRegistrationsForEmailBlast,
  type BlastAudience,
} from "@/lib/models/Registration";

function parseAudience(value: string | null): BlastAudience {
  if (value === "waitlisted" || value === "all") return value;
  return "confirmed";
}

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();
  if (isSubManager(session)) return forbiddenResponse("Sub managers cannot access email blast");

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId")?.trim();
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  const denied = assertEventAccess(session, eventId);
  if (denied) return denied;

  const audience = parseAudience(searchParams.get("audience"));

  try {
    const [logs, audienceTotal, recipients] = await Promise.all([
      listEmailBlastLogsByEventIds([eventId]),
      countRegistrationsForEmailBlast(eventId, audience),
      listRegistrationsForEmailBlast(eventId, audience),
    ]);

    // "Pending" for a blast = recipients in the selected audience who have never
    // received any blast yet.
    const notBlasted = recipients.filter((r) => !r.lastEmailBlastAt).length;

    const totals = logs.reduce(
      (acc, log) => {
        acc.sent += log.sent;
        acc.failed += log.failed;
        return acc;
      },
      { sent: 0, failed: 0 }
    );

    return NextResponse.json({
      campaigns: logs.map((log) => ({
        subject: log.subject,
        audience: log.audience,
        total: log.total,
        sent: log.sent,
        failed: log.failed,
        sentBy: log.sentBy,
        sentAt: log.sentAt instanceof Date ? log.sentAt.toISOString() : log.sentAt,
      })),
      campaignCount: logs.length,
      totalSent: totals.sent,
      totalFailed: totals.failed,
      audience,
      audienceTotal,
      pending: notBlasted,
    });
  } catch (err) {
    console.error("Email blast logs error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
