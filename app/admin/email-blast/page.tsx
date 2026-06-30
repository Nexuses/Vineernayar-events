import { getAdminSession, listEventsForAdmin } from "@/lib/admin-access";
import { redirect } from "next/navigation";
import { EmailBlastSection } from "./EmailBlastSection";

export default async function EmailBlastPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const events = await listEventsForAdmin(session);
  const eventList = events.map((e) => ({ eventId: e.eventId, eventName: e.eventName }));

  return (
    <div>
      <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">Email Blast</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Select an event and recipient group, compose your HTML email, send a test, then blast the
        campaign to all matching registrants.
      </p>
      <EmailBlastSection events={eventList} adminEmail={session.email} />
    </div>
  );
}
