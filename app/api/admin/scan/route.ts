import { NextResponse } from "next/server";
import { getAdminFromCookie } from "@/lib/auth";
import {
  getRegistrationByCode,
  updateRegistrationParticipationStatus,
} from "@/lib/models/Registration";

export async function POST(request: Request) {
  const admin = await getAdminFromCookie();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
