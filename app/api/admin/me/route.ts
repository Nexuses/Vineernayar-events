import { NextResponse } from "next/server";
import {
  getAdminSession,
  serializeAdminPublic,
  unauthorizedResponse,
} from "@/lib/admin-access";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();

  return NextResponse.json(serializeAdminPublic(session));
}
