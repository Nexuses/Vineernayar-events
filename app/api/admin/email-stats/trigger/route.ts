import { NextResponse } from "next/server";
import { sendSequenceToPendingForEvent } from "@/lib/email-sequence-runner";
import { EMAIL_SEQUENCE_ORDER, type EmailSequenceKey } from "@/lib/email-sequence";
import {
  assertCanModifyAdminData,
  assertEventAccess,
  getAdminSession,
  unauthorizedResponse,
} from "@/lib/admin-access";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();
  const blocked = assertCanModifyAdminData(session);
  if (blocked) return blocked;

  try {
    const body = await request.json();
    const eventId = typeof body?.eventId === "string" ? body.eventId.trim() : "";
    const key = body?.key as EmailSequenceKey;

    if (!eventId) {
      return NextResponse.json({ error: "eventId required" }, { status: 400 });
    }
    if (!EMAIL_SEQUENCE_ORDER.includes(key)) {
      return NextResponse.json({ error: "Invalid email key" }, { status: 400 });
    }

    const denied = assertEventAccess(session, eventId);
    if (denied) return denied;

    const result = await sendSequenceToPendingForEvent(eventId, key);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Email trigger error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
