import { NextResponse } from "next/server";
import { type EmailSequenceKey } from "@/lib/email-sequence";
import { sendTestEmailSequenceForRegistration } from "@/lib/email-sequence-runner";
import { getRegistrationById } from "@/lib/models/Registration";
import {
  assertEventAccess,
  getAdminSession,
  unauthorizedResponse,
} from "@/lib/admin-access";

const ALLOWED_SEQUENCE_KEYS = new Set<EmailSequenceKey>(["seq1", "seq2", "seq3", "seq4"]);

function parseSequenceKey(value: unknown): EmailSequenceKey | null {
  const key = String(value ?? "") as EmailSequenceKey;
  return ALLOWED_SEQUENCE_KEYS.has(key) ? key : null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();

  try {
    const { id } = await params;
    const reg = await getRegistrationById(id);
    if (!reg) return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    const denied = assertEventAccess(session, reg.eventId);
    if (denied) return denied;

    const body = await request.json().catch(() => ({}));
    const key = parseSequenceKey((body as { sequenceKey?: unknown }).sequenceKey);
    if (!key) {
      return NextResponse.json({ error: "A valid sequence email is required" }, { status: 400 });
    }

    const result = await sendTestEmailSequenceForRegistration(reg, key);
    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          sequenceKey: key,
          error: result.error || "Email test failed",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      sequenceKey: key,
      sentTo: result.sentTo,
      message: `Test email sent to ${result.sentTo}`,
    });
  } catch (err) {
    console.error("Email test send failed:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
