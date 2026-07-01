import { getAdminSession, listEventsForAdmin } from "@/lib/admin-access";
import { redirect } from "next/navigation";
import { formatEventDropdownLabel } from "@/lib/event-option-label";
import { RegisteredClientSection } from "./RegisteredClientSection";

export default async function RegisteredClientPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const events = await listEventsForAdmin(session);
  const eventList = events.map((e) => ({
    eventId: e.eventId,
    eventName: e.eventName,
    dropdownLabel: formatEventDropdownLabel(e),
  }));

  return (
    <div>
      <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">
        Registered Client
      </h1>
      <p className="mt-1 text-sm text-zinc-600">
        View confirmed registrations event-wise. Select an event to see accepted attendees and their details.
      </p>
      <RegisteredClientSection events={eventList} />
    </div>
  );
}
