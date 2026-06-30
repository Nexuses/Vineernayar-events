import { NextResponse } from "next/server";
import {
  listEligibleByEvent,
  addEligibleEmail,
  addEligibleEmailsBulk,
  removeEligibleEmail,
} from "@/lib/models/EligibleEmail";
import {
  assertEventAccess,
  getAdminSession,
  unauthorizedResponse,
} from "@/lib/admin-access";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    if (!eventId?.trim()) {
      return NextResponse.json({ error: "eventId required" }, { status: 400 });
    }
    const eid = eventId.trim();
    const denied = assertEventAccess(session, eid);
    if (denied) return denied;
    const list = await listEligibleByEvent(eid);
    return NextResponse.json(list);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();
  try {
    const body = await request.json();
    const { eventId, email, emails: emailsBulk } = body as {
      eventId?: string;
      email?: string;
      emails?: string[];
    };
    if (!eventId?.trim()) {
      return NextResponse.json({ error: "eventId required" }, { status: 400 });
    }
    const eid = eventId.trim();
    const denied = assertEventAccess(session, eid);
    if (denied) return denied;
    if (Array.isArray(emailsBulk)) {
      const strings = emailsBulk
        .filter((e): e is string => typeof e === "string")
        .map((e) => e.trim())
        .filter(Boolean);
      const { added, skipped } = await addEligibleEmailsBulk(eid, strings);
      return NextResponse.json({ added, skipped });
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }
    const doc = await addEligibleEmail(eid, email.trim());
    return NextResponse.json(doc);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const email = searchParams.get("email");
    if (!eventId?.trim()) {
      return NextResponse.json({ error: "eventId required" }, { status: 400 });
    }
    const eid = eventId.trim();
    const denied = assertEventAccess(session, eid);
    if (denied) return denied;
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }
    await removeEligibleEmail(eid, email);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
