import { getAdminSession, listEventsForAdmin } from "@/lib/admin-access";
import { redirect } from "next/navigation";
import { formatEventDropdownLabel } from "@/lib/event-option-label";
import { WaitlistClientSection } from "./WaitlistClientSection";

export default async function WaitlistPage() {
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
      <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">Waitlist Client</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Review waitlist registrations by event. Accept or reject pending entries — they stay in this list with
        their status. Accepted attendees also appear in Registered Client.
      </p>
      <WaitlistClientSection events={eventList} />
    </div>
  );
}
