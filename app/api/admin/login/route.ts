import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findAdminByEmail } from "@/lib/models/Admin";
import { createToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email?.trim() || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const admin = await findAdminByEmail(email);
    if (!admin) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = await createToken({
      id: admin._id!.toString(),
      email: admin.email,
    });
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      admin: { id: admin._id, email: admin.email, name: admin.name },
    });
  } catch (err) {
    console.error("Admin login error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
