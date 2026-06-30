import Link from "next/link";
import { getEffectiveRegistrationStatus } from "@/lib/models/Event";
import { listAllRegistrations } from "@/lib/models/Registration";
import { listAllEligible } from "@/lib/models/EligibleEmail";
import { StatCards, BarChartCard, PieChartCard } from "./components/DashboardCharts";
import {
  getAdminSession,
  isSuperAdmin,
  listEventsForAdmin,
} from "@/lib/admin-access";

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  const superadmin = session ? isSuperAdmin(session) : false;

  const events = session ? await listEventsForAdmin(session) : [];
  const allowedEventIds = new Set(events.map((e) => e.eventId));

  const [allRegistrations, allEligible] = await Promise.all([
    listAllRegistrations(),
    listAllEligible(),
  ]);

  const registrations = superadmin
    ? allRegistrations
    : allRegistrations.filter((r) => allowedEventIds.has(r.eventId));
  const eligibleClients = superadmin
    ? allEligible
    : allEligible.filter((e) => allowedEventIds.has(e.eventId));

  const now = new Date();
  const totalEvents = events.length;
  const upcomingEvents = events.filter((e) => e.eventEndDate >= now).length;
  const pastEvents = events.filter((e) => e.eventEndDate < now).length;
  const openEvents = events.filter((e) => getEffectiveRegistrationStatus(e) === "open").length;
  const closedEvents = events.filter((e) => getEffectiveRegistrationStatus(e) === "closed").length;

  const totalRegistrations = registrations.length;
  const attendedRegistrations = registrations.filter(
    (r) => r.participationStatus === "attended"
  ).length;
  const attendanceRate =
    totalRegistrations === 0 ? 0 : Math.round((attendedRegistrations / totalRegistrations) * 100);

  const eligibleCount = eligibleClients.length;

  const registrationsByEventMap = new Map<string, number>();
  for (const r of registrations) {
    registrationsByEventMap.set(r.eventName, (registrationsByEventMap.get(r.eventName) || 0) + 1);
  }
  const registrationsByEvent = Array.from(registrationsByEventMap.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const statusCounts: Record<string, number> = { Registered: 0, Attended: 0, Unknown: 0 };
  for (const r of registrations) {
    if (r.participationStatus === "attended") statusCounts.Attended += 1;
    else if (r.participationStatus === "registered" || !r.participationStatus)
      statusCounts.Registered += 1;
    else statusCounts.Unknown += 1;
  }
  const statusData = Object.entries(statusCounts)
    .filter(([, v]) => v > 0)
    .map(([label, value]) => ({ label, value }));

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-zinc-600 sm:text-base">
          Welcome back, {session?.name ?? session?.email ?? "Admin"}.
          {superadmin
            ? " Here is how your events are performing."
            : " You are viewing data for your assigned events only."}
        </p>
      </div>

      <StatCards
        items={[
          {
            label: "Total events",
            value: totalEvents,
            helper: `${upcomingEvents} upcoming · ${pastEvents} past`,
          },
          {
            label: "Registrations",
            value: totalRegistrations,
            helper: `${openEvents} open · ${closedEvents} closed events`,
          },
          {
            label: "Attendance",
            value: `${attendanceRate}%`,
            helper: `${attendedRegistrations} attended`,
          },
          {
            label: "Eligible clients",
            value: eligibleCount,
            helper:
              totalRegistrations === 0
                ? undefined
                : `${Math.round((totalRegistrations / Math.max(1, eligibleCount)) * 100) / 100} registrations per eligible`,
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <BarChartCard
          title="Registrations by event"
          description="Top events by total registrations"
          data={registrationsByEvent}
        />
        <PieChartCard
          title="Participation status"
          description="Registered vs attended"
          data={statusData}
        />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
            Quick links
          </h2>
          <p className="text-xs text-zinc-500 sm:text-sm">
            Jump straight to common admin tasks.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {superadmin ? (
            <Link
              href="/admin/create-event"
              className="group flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-md"
            >
              <div>
                <p className="text-sm font-semibold text-zinc-900">Create event</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Set up a new event, time, and venue.
                </p>
              </div>
              <span className="mt-3 text-xs font-medium text-brand-600 group-hover:underline">
                Go to create event →
              </span>
            </Link>
          ) : null}
          <Link
            href="/admin/registrations"
            className="group flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-md"
          >
            <div>
              <p className="text-sm font-semibold text-zinc-900">
                Registered clients
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                View, export, or update registrations.
              </p>
            </div>
            <span className="mt-3 text-xs font-medium text-brand-600 group-hover:underline">
              Open registrations →
            </span>
          </Link>
          <Link
            href="/admin/eligible"
            className="group flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-md"
          >
            <div>
              <p className="text-sm font-semibold text-zinc-900">
                Eligible client list
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Manage and bulk upload eligible emails.
              </p>
            </div>
            <span className="mt-3 text-xs font-medium text-brand-600 group-hover:underline">
              Manage eligible clients →
            </span>
          </Link>
          <Link
            href="/admin/scan"
            className="group flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-md"
          >
            <div>
              <p className="text-sm font-semibold text-zinc-900">
                QR scanning & check-in
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Scan passes and mark attendance live.
              </p>
            </div>
            <span className="mt-3 text-xs font-medium text-brand-600 group-hover:underline">
              Open scanner →
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
