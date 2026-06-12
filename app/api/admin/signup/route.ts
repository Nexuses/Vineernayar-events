import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findAdminByEmail, createAdmin } from "@/lib/models/Admin";
import { createToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email?.trim() || !password || !name?.trim()) {
      return NextResponse.json(
        { error: "Email, password and name are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const existing = await findAdminByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "An admin with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await createAdmin({
      email,
      passwordHash,
      name,
    });

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
    console.error("Admin signup error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
