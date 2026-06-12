import { getAdminFromCookie } from "@/lib/auth";
import { listEvents } from "@/lib/models/Event";
import { redirect } from "next/navigation";
import { RegisteredClientSection } from "./RegisteredClientSection";

export default async function RegisteredClientPage() {
  const admin = await getAdminFromCookie();
  if (!admin) redirect("/admin/login");

  const events = await listEvents();
  const eventList = events.map((e) => ({ eventId: e.eventId, eventName: e.eventName }));

  return (
    <div>
      <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">
        Registered Client
      </h1>
      <p className="mt-1 text-sm text-zinc-600">
        View registrations event-wise. Select an event to see all registered clients and their details.
      </p>
      <RegisteredClientSection events={eventList} />
    </div>
  );
}
