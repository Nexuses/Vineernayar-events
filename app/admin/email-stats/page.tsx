import { getAdminSession, listEventsForAdmin } from "@/lib/admin-access";
import { redirect } from "next/navigation";
import { formatEventDropdownLabel } from "@/lib/event-option-label";
import { EmailStatsSection } from "./EmailStatsSection";

export default async function EmailStatsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const events = await listEventsForAdmin(session);
  const eventList = events.map((e) => ({
    eventId: e.eventId,
    dropdownLabel: formatEventDropdownLabel(e),
  }));

  return (
    <div>
      <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">Email Stats</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Delivery stats for each automated email, per event. Select an event or view all events
        together.
      </p>
      <EmailStatsSection events={eventList} />
    </div>
  );
}
