import { notFound } from "next/navigation";
import { DashboardView } from "@/app/admin/components/DashboardView";
import {
  findCityDashboard,
  groupEventsByCity,
} from "@/lib/admin-city-dashboard";
import {
  getAdminSession,
  listEventsForAdmin,
} from "@/lib/admin-access";
import { listAllRegistrations } from "@/lib/models/Registration";
import { listAllEligible } from "@/lib/models/EligibleEmail";
import { listEmailBlastLogsByEventIds } from "@/lib/models/EmailBlastLog";

export default async function CityDashboardPage({
  params,
}: {
  params: Promise<{ citySlug: string }>;
}) {
  const session = await getAdminSession();
  if (!session) notFound();

  const { citySlug } = await params;
  const events = await listEventsForAdmin(session);
  const cities = groupEventsByCity(events);
  const city = findCityDashboard(cities, citySlug);
  if (!city) notFound();

  const eventIdSet = new Set(city.eventIds);
  const cityEvents = events.filter((e) => eventIdSet.has(e.eventId));

  const [allRegistrations, allEligible, blastLogs] = await Promise.all([
    listAllRegistrations(),
    listAllEligible(),
    listEmailBlastLogsByEventIds(city.eventIds),
  ]);

  const registrations = allRegistrations.filter((r) => eventIdSet.has(r.eventId));
  const eligibleClients = allEligible.filter((e) => eventIdSet.has(e.eventId));

  return (
    <DashboardView
      session={session}
      events={cityEvents}
      registrations={registrations}
      eligibleClients={eligibleClients}
      cityLabel={city.label}
      blastLogs={blastLogs}
    />
  );
}
