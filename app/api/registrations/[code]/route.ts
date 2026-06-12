import { NextResponse } from "next/server";
import { getRegistrationByCode } from "@/lib/models/Registration";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const reg = await getRegistrationByCode(code);
    if (!reg) return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    const { _id, ...rest } = reg;
    return NextResponse.json({ ...rest, id: _id?.toString() });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
