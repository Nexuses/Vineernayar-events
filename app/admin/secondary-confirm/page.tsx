import { getAdminRole, getAdminSession, listEventsForAdmin } from "@/lib/admin-access";
import { redirect } from "next/navigation";
import { formatEventDropdownLabel } from "@/lib/event-option-label";
import { ReconfirmSection } from "@/app/admin/reconfirm/ReconfirmSection";
import { SECONDARY_ROUND } from "@/lib/confirmation-rounds";

export default async function SecondaryConfirmPage() {
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
      <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">Secondary Confirm</h1>
      <p className="mt-1 text-sm text-zinc-600">
        A second round of confirmation, for when the date or venue has changed. Upload a list to ask
        again — including people who already confirmed the first time — and track the new responses
        separately.
      </p>
      <ReconfirmSection events={eventList} readOnly={readOnly} round={SECONDARY_ROUND} />
    </div>
  );
}
