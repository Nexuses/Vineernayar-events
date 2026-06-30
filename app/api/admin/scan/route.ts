import { NextResponse } from "next/server";
import {
  getAdmissionStatus,
  getRegistrationByCode,
  updateRegistrationParticipationStatus,
} from "@/lib/models/Registration";
import {
  assertEventAccess,
  getAdminSession,
  unauthorizedResponse,
} from "@/lib/admin-access";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();
  try {
    const body = await request.json();
    const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";
    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }
    const reg = await getRegistrationByCode(code);
    if (!reg) {
      return NextResponse.json({ error: "Pass not found" }, { status: 404 });
    }
    const denied = assertEventAccess(session, reg.eventId);
    if (denied) return denied;
    if (getAdmissionStatus(reg) !== "confirmed") {
      return NextResponse.json({ error: "Registration is not confirmed yet" }, { status: 403 });
    }
    let participationTimestamp: string | undefined;
    if (reg._id) {
      await updateRegistrationParticipationStatus(reg._id.toString(), "attended");
      participationTimestamp = new Date().toISOString();
    }
    return NextResponse.json({
      success: true,
      registration: {
        eventId: reg.eventId,
        firstName: reg.firstName,
        surname: reg.surname,
        email: reg.email,
        eventName: reg.eventName,
        uniqueCode: reg.uniqueCode,
        participationStatus: "attended",
        participationTimestamp,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
