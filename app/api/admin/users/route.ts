import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  createAdmin,
  findAdminByEmail,
  listAdmins,
  type AdminRole,
} from "@/lib/models/Admin";
import {
  forbiddenResponse,
  getAdminSession,
  isSuperAdmin,
  serializeAdminPublic,
  unauthorizedResponse,
} from "@/lib/admin-access";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();
  if (!isSuperAdmin(session)) return forbiddenResponse();

  try {
    const admins = await listAdmins();
    return NextResponse.json(admins.map(serializeAdminPublic));
  } catch (err) {
    console.error("List admin users error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();
  if (!isSuperAdmin(session)) return forbiddenResponse();

  try {
    const body = await request.json();
    const { email, password, name, role, assignedEventIds } = body as {
      email?: string;
      password?: string;
      name?: string;
      role?: AdminRole;
      assignedEventIds?: string[];
    };

    if (!email?.trim() || !password || !name?.trim()) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const adminRole: AdminRole = role === "superadmin" ? "superadmin" : "manager";
    const events =
      adminRole === "manager"
        ? (assignedEventIds ?? []).map((id) => String(id).trim()).filter(Boolean)
        : [];

    if (adminRole === "manager" && events.length === 0) {
      return NextResponse.json(
        { error: "Assign at least one event for managers" },
        { status: 400 }
      );
    }

    const existing = await findAdminByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await createAdmin({
      email,
      passwordHash,
      name,
      role: adminRole,
      assignedEventIds: events,
      createdBy: session._id,
    });

    return NextResponse.json(serializeAdminPublic(admin));
  } catch (err) {
    console.error("Create admin user error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
