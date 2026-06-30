import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  deleteAdmin,
  findAdminById,
  getAdminRole,
  isSuperAdmin as isSuperAdminUser,
  normalizeAdminRole,
  updateAdmin,
  type AdminRole,
} from "@/lib/models/Admin";
import {
  forbiddenResponse,
  getAdminSession,
  isSuperAdmin,
  serializeAdminPublic,
  unauthorizedResponse,
} from "@/lib/admin-access";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();
  if (!isSuperAdmin(session)) return forbiddenResponse();

  try {
    const { id } = await params;
    const target = await findAdminById(id);
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, role, assignedEventIds, password } = body as {
      name?: string;
      role?: AdminRole;
      assignedEventIds?: string[];
      password?: string;
    };

    const nextRole: AdminRole | undefined =
      role === "superadmin" || role === "manager" ? role : undefined;
    const events =
      assignedEventIds !== undefined
        ? assignedEventIds.map((eid) => String(eid).trim()).filter(Boolean)
        : undefined;

    if (nextRole === "manager" && events && events.length === 0) {
      return NextResponse.json(
        { error: "Assign at least one event for managers" },
        { status: 400 }
      );
    }

    if (
      getEffectiveRole(target, nextRole) === "manager" &&
      events === undefined &&
      (target.assignedEventIds ?? []).length === 0
    ) {
      return NextResponse.json(
        { error: "Assign at least one event for managers" },
        { status: 400 }
      );
    }

    let passwordHash: string | undefined;
    if (password !== undefined && password !== "") {
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }
      passwordHash = await bcrypt.hash(password, 10);
    }

    const ok = await updateAdmin(id, {
      name,
      role: nextRole,
      assignedEventIds: events,
      passwordHash,
    });
    if (!ok) {
      return NextResponse.json({ error: "Unable to update user" }, { status: 500 });
    }

    const updated = await findAdminById(id);
    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(serializeAdminPublic(updated));
  } catch (err) {
    console.error("Update admin user error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();
  if (!isSuperAdmin(session)) return forbiddenResponse();

  try {
    const { id } = await params;
    if (session._id.toString() === id) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }

    const target = await findAdminById(id);
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (isSuperAdminUser(target)) {
      return NextResponse.json(
        { error: "Super admin accounts cannot be deleted" },
        { status: 400 }
      );
    }

    const ok = await deleteAdmin(id);
    if (!ok) {
      return NextResponse.json({ error: "Unable to delete user" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete admin user error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

function getEffectiveRole(
  admin: { role?: string },
  nextRole?: AdminRole
): AdminRole {
  return nextRole ?? normalizeAdminRole(admin.role);
}
