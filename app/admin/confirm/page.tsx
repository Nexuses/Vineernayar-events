import { getAdminRole, getAdminSession, listEventsForAdmin } from "@/lib/admin-access";
import { redirect } from "next/navigation";
import { formatEventDropdownLabel } from "@/lib/event-option-label";
import { ConfirmSection } from "./ConfirmSection";

export default async function ConfirmPage() {
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
      <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">Confirm</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Upload an attendee list to register anyone missing and send them a confirmation email, then
        track who has confirmed.
      </p>
      <ConfirmSection events={eventList} readOnly={readOnly} />
    </div>
  );
}
