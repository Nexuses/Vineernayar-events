import { redirect } from "next/navigation";
import { canEditEvents, getAdminSession } from "@/lib/admin-access";

export default async function EditEventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!canEditEvents(session)) redirect("/admin/events");
  return children;
}
