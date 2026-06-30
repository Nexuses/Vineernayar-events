import { redirect } from "next/navigation";
import { getAdminSession, isSuperAdmin } from "@/lib/admin-access";

export default async function CreateEventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!isSuperAdmin(session)) redirect("/admin");
  return children;
}
