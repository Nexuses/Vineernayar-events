import { NextResponse } from "next/server";
import type { AttendanceRsvpIntent } from "@/lib/attendance-rsvp";
import { getPublishedEventByParam } from "@/lib/models/Event";
import {
  getRegistrationByCode,
  isConfirmedRegistration,
  updateAttendanceRsvpStatus,
  type AttendanceRsvpStatus,
} from "@/lib/models/Registration";

export const dynamic = "force-dynamic";

function parseIntent(value: string | null): AttendanceRsvpIntent | null {
  if (value === "attending" || value === "declined") return value;
  return null;
}

function intentToStatus(intent: AttendanceRsvpIntent): AttendanceRsvpStatus {
  return intent === "attending" ? "reconfirmed" : "declined";
}

async function resolveRegistration(eventId: string, code: string) {
  const event = await getPublishedEventByParam(eventId);
  if (!event) return { error: "Event not found", status: 404 as const };

  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) return { error: "Registration code is required", status: 400 as const };

  const reg = await getRegistrationByCode(normalizedCode);
  if (!reg || reg.eventId !== event.eventId) {
    return { error: "Registration not found", status: 404 as const };
  }
  if (!isConfirmedRegistration(reg)) {
    return { error: "This registration is not confirmed for the event", status: 400 as const };
  }

  return { event, reg };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code")?.trim() ?? "";
    const intent = parseIntent(searchParams.get("intent"));

    const resolved = await resolveRegistration(eventId, code);
    if ("error" in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    }

    const { event, reg } = resolved;
    return NextResponse.json({
      eventId: event.eventId,
      eventName: event.eventName,
      firstName: reg.firstName,
      email: reg.email,
      attendanceRsvpStatus: reg.attendanceRsvpStatus ?? "pending",
      intent,
    });
  } catch (err) {
    console.error("Confirm attendance lookup error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const body = await request.json();
    const code = String(body.code ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const intent = parseIntent(String(body.intent ?? ""));

    if (!intent) {
      return NextResponse.json({ error: "Invalid confirmation action" }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const resolved = await resolveRegistration(eventId, code);
    if ("error" in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    }

    const { reg } = resolved;
    if (reg.email.trim().toLowerCase() !== email) {
      return NextResponse.json({ error: "Email does not match this registration" }, { status: 400 });
    }

    const nextStatus = intentToStatus(intent);
    if (reg.attendanceRsvpStatus === nextStatus) {
      return NextResponse.json({
        success: true,
        attendanceRsvpStatus: nextStatus,
        alreadySubmitted: true,
      });
    }

    const id = reg._id?.toString();
    if (!id) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    const ok = await updateAttendanceRsvpStatus(id, nextStatus);
    if (!ok) {
      return NextResponse.json({ error: "Unable to save your response" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      attendanceRsvpStatus: nextStatus,
    });
  } catch (err) {
    console.error("Confirm attendance submit error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
