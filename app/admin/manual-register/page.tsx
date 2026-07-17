import { canManualRegister, getAdminSession, listEventsForAdmin } from "@/lib/admin-access";
import { redirect } from "next/navigation";
import { formatEventDropdownLabel } from "@/lib/event-option-label";
import { ManualRegisterSection } from "./ManualRegisterSection";

export default async function ManualRegisterPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!canManualRegister(session)) redirect("/admin");

  const events = await listEventsForAdmin(session);
  const eventList = events.map((e) => ({
    eventId: e.eventId,
    eventName: e.eventName,
    dropdownLabel: formatEventDropdownLabel(e),
  }));

  return (
    <div>
      <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">Manual Register</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Select an event and add a client manually. Confirmed entries appear in Registered Client.
      </p>
      <ManualRegisterSection events={eventList} readOnly={false} />
    </div>
  );
}
