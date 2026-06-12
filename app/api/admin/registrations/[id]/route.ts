import { NextResponse } from "next/server";
import { getAdminFromCookie } from "@/lib/auth";
import {
  updateRegistrationParticipationStatus,
  deleteRegistrationById,
} from "@/lib/models/Registration";
import type { ParticipationStatus } from "@/lib/models/Registration";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromCookie();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json();
    const { participationStatus } = body as { participationStatus?: string };
    if (participationStatus !== "registered" && participationStatus !== "attended") {
      return NextResponse.json({ error: "participationStatus must be 'registered' or 'attended'" }, { status: 400 });
    }
    const ok = await updateRegistrationParticipationStatus(id, participationStatus as ParticipationStatus);
    if (!ok) return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    return NextResponse.json({
      success: true,
      participationStatus,
      participationTimestamp: participationStatus === "attended" ? new Date().toISOString() : null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromCookie();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const ok = await deleteRegistrationById(id);
    if (!ok) return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
