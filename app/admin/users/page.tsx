import { getAdminSession, isSuperAdmin } from "@/lib/admin-access";
import { listEvents } from "@/lib/models/Event";
import { redirect } from "next/navigation";
import { UserManagementSection } from "./UserManagementSection";

export default async function UserManagementPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!isSuperAdmin(session)) redirect("/admin");

  const events = await listEvents();
  const eventList = events.map((e) => ({ eventId: e.eventId, eventName: e.eventName }));

  return (
    <div>
      <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">User Management</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Create admin users and assign them to events. Managers only see and manage data for their
        assigned events. Super Admin accounts cannot be deleted.
      </p>
      <UserManagementSection events={eventList} />
    </div>
  );
}
