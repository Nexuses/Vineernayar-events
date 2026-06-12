import { NextResponse } from "next/server";
import { getAdminFromCookie } from "@/lib/auth";
import { getAdminsCollection } from "@/lib/models/Admin";
import { ObjectId } from "mongodb";

export async function GET() {
  const payload = await getAdminFromCookie();
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const col = await getAdminsCollection();
    const admin = await col.findOne({ _id: new ObjectId(payload.id) });
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }
    return NextResponse.json({
      id: admin._id,
      email: admin.email,
      name: admin.name,
    });
  } catch (err) {
    console.error("Admin me error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
