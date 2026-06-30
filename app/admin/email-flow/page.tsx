import { getAdminSession, isSuperAdmin, listEventsForAdmin } from "@/lib/admin-access";
import { redirect } from "next/navigation";
import { EmailFlowSection } from "./EmailFlowSection";

export default async function EmailFlowPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!isSuperAdmin(session)) redirect("/admin");

  const events = await listEventsForAdmin(session);
  const eventList = events.map((e) => ({ eventId: e.eventId, eventName: e.eventName }));

  return (
    <div>
      <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">Email Flow</h1>
      <p className="mt-1 text-sm text-zinc-600">
        View and edit automated email templates event-wise. Select an event to manage its email flow.
      </p>
      <EmailFlowSection events={eventList} />
    </div>
  );
}
