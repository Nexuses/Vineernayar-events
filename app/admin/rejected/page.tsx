import { getAdminRole, getAdminSession, listEventsForAdmin } from "@/lib/admin-access";
import { redirect } from "next/navigation";
import { formatEventDropdownLabel } from "@/lib/event-option-label";
import { WaitlistClientSection } from "../waitlist/WaitlistClientSection";

export default async function RejectedClientPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const readOnly = getAdminRole(session) === "sub_manager";

  const events = await listEventsForAdmin(session);
  const eventList = events.map((e) => ({
    eventId: e.eventId,
    eventName: e.eventName,
    dropdownLabel: formatEventDropdownLabel(e),
  }));

  return (
    <div>
      <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">Rejected Client</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Review rejected waitlist registrations by event. Re-accept a client to move them to Registered
        Client and send the confirmation email.
      </p>
      <WaitlistClientSection events={eventList} readOnly={readOnly} mode="rejected" />
    </div>
  );
}
