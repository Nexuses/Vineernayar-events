import { getAdminSession, listEventsForAdmin } from "@/lib/admin-access";
import { redirect } from "next/navigation";
import { WaitlistClientSection } from "./WaitlistClientSection";

export default async function WaitlistPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const events = await listEventsForAdmin(session);
  const eventList = events.map((e) => ({ eventId: e.eventId, eventName: e.eventName }));

  return (
    <div>
      <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">Waitlist Client</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Review waitlisted registrations by event. Accept to send the confirmation email with event pass and move
        the attendee to Registered Client. Reject to notify them by email.
      </p>
      <WaitlistClientSection events={eventList} />
    </div>
  );
}
