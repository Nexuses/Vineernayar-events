import { redirect } from "next/navigation";
import { DashboardView } from "@/app/admin/components/DashboardView";
import {
  getAdminSession,
  isSuperAdmin,
  listEventsForAdmin,
} from "@/lib/admin-access";
import { listAllRegistrations } from "@/lib/models/Registration";
import { listAllEligible } from "@/lib/models/EligibleEmail";
import { listEmailBlastLogsByEventIds } from "@/lib/models/EmailBlastLog";

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const superadmin = isSuperAdmin(session);
  const events = await listEventsForAdmin(session);
  const allowedEventIds = new Set(events.map((e) => e.eventId));

  const [allRegistrations, allEligible, blastLogs] = await Promise.all([
    listAllRegistrations(),
    listAllEligible(),
    listEmailBlastLogsByEventIds(events.map((e) => e.eventId)),
  ]);

  const registrations = superadmin
    ? allRegistrations
    : allRegistrations.filter((r) => allowedEventIds.has(r.eventId));
  const eligibleClients = superadmin
    ? allEligible
    : allEligible.filter((e) => allowedEventIds.has(e.eventId));

  return (
    <DashboardView
      session={session}
      events={events}
      registrations={registrations}
      eligibleClients={eligibleClients}
      blastLogs={blastLogs}
    />
  );
}
