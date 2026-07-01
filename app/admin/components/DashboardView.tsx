import Link from "next/link";
import type { EventDoc } from "@/lib/models/Event";
import type { RegistrationDoc } from "@/lib/models/Registration";
import type { EligibleEmailDoc } from "@/lib/models/EligibleEmail";
import type { EmailBlastLogDoc } from "@/lib/models/EmailBlastLog";
import {
  BarChartCard,
  DashboardSection,
  PieChartCard,
  StatCards,
} from "./DashboardCharts";
import { EventAnalyticsTable } from "./EventAnalyticsTable";
import { computeDashboardAnalytics, computeEmailBlastStats } from "@/lib/dashboard-analytics";
import { isSuperAdmin, type AdminSession } from "@/lib/admin-access";

type DashboardViewProps = {
  session: AdminSession;
  events: EventDoc[];
  registrations: RegistrationDoc[];
  eligibleClients: EligibleEmailDoc[];
  cityLabel?: string;
  blastLogs?: EmailBlastLogDoc[];
};

export function DashboardView({
  session,
  events,
  registrations,
  eligibleClients,
  cityLabel,
  blastLogs = [],
}: DashboardViewProps) {
  const superadmin = isSuperAdmin(session);
  const analytics = computeDashboardAnalytics(events, registrations, eligibleClients);
  const blast = computeEmailBlastStats(registrations, blastLogs);
  const { registrations: reg, charts } = analytics;
  const displayCity = cityLabel ?? "All cities";

  const updatedAt = new Date().toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-8 sm:space-y-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">{displayCity}</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600 sm:text-base">
            {cityLabel ? (
              <>Registration, waitlist, and attendance for {cityLabel}.</>
            ) : superadmin ? (
              "Overview across all cities."
            ) : (
              "Overview for your assigned events."
            )}
          </p>
        </div>
        <p className="text-xs text-zinc-400">Updated {updatedAt}</p>
      </div>

      <StatCards
        items={[
          {
            label: "All registrations",
            value: reg.total,
            helper: `${reg.last7Days} in last 7 days`,
            accent: "blue",
          },
          {
            label: "Confirmed seats",
            value: reg.confirmed,
            helper: `${reg.rejected} rejected`,
            accent: "green",
          },
          {
            label: "In waitlist pending",
            value: reg.waitlisted,
            helper: "Awaiting accept or reject",
            accent: "amber",
          },
          {
            label: "Priority passes",
            value: reg.priority,
            helper: `${reg.nonPriority} standard registrations`,
          },
        ]}
      />

      <DashboardSection title="Charts" description="Visual breakdown of registrations and status.">
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <BarChartCard
              title="Registrations (last 14 days)"
              description="Daily sign-ups"
              data={charts.registrationTrend}
            />
            <BarChartCard
              title="Registration pace"
              description="Sign-ups in recent periods"
              data={[
                { label: "Last 7 days", value: reg.last7Days },
                { label: "Last 30 days", value: reg.last30Days },
              ]}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <PieChartCard
              title="Waitlist"
              description="Pending, approved, and rejected"
              data={[
                { label: "Pending", value: reg.waitlisted },
                { label: "Approved", value: reg.confirmed },
                { label: "Rejected", value: reg.rejected },
              ].filter((d) => d.value > 0)}
            />
            <PieChartCard
              title="Priority passes"
              description="Priority vs standard registrations"
              data={charts.priority}
            />
          </div>
        </div>
      </DashboardSection>

      <DashboardSection
        title="Event breakdown"
        description="Per-event registration, waitlist, attendance, and seat capacity."
      >
        <EventAnalyticsTable rows={analytics.eventRows} />
      </DashboardSection>

      <DashboardSection
        title="Email blast"
        description={
          cityLabel
            ? `Blast delivery for recipients in ${cityLabel}.`
            : "Blast delivery across events in this view."
        }
      >
        <StatCards
          items={[
            {
              label: "Blasts sent",
              value: blast.campaignCount,
              helper: `${blast.totalSent} emails delivered`,
              accent: blast.campaignCount > 0 ? "blue" : "default",
            },
            {
              label: "Recipients blasted",
              value: blast.recipientsBlasted,
              helper: `of ${registrations.length} registrations`,
              accent: "green",
            },
            {
              label: "Not blasted yet",
              value: blast.recipientsNotBlasted,
              helper: "No email blast received",
              accent: blast.recipientsNotBlasted > 0 ? "amber" : "default",
            },
            {
              label: "Last blast",
              value: blast.lastBlastAt
                ? blast.lastBlastAt.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "—",
              helper: blast.lastBlastAt
                ? blast.lastBlastAt.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "No blasts for this city yet",
            },
          ]}
        />

        {blast.recentBlasts.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Audience</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3 text-right">Sent</th>
                  <th className="px-4 py-3 text-right">Failed</th>
                  <th className="px-4 py-3">When</th>
                </tr>
              </thead>
              <tbody>
                {blast.recentBlasts.map((row, i) => (
                  <tr key={i} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-zinc-900">{row.eventName}</td>
                    <td className="px-4 py-3 text-zinc-600">{row.audience}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-zinc-600" title={row.subject}>
                      {row.subject}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-700">{row.sent}</td>
                    <td className="px-4 py-3 text-right text-red-700">{row.failed}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                      {row.sentAt.toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-zinc-100 px-4 py-2 text-right">
              <Link
                href="/admin/email-blast"
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                Send email blast →
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-4 py-6 text-center text-sm text-zinc-500">
            No email blasts sent{cityLabel ? ` for ${cityLabel}` : ""} yet.{" "}
            <Link href="/admin/email-blast" className="font-medium text-brand-600 hover:underline">
              Send a blast
            </Link>
          </div>
        )}
      </DashboardSection>

      <DashboardSection title="Quick actions" description="Jump to admin tools.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {superadmin ? (
            <Link
              href="/admin/create-event"
              className="group rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-brand-500 hover:shadow-md"
            >
              <p className="text-sm font-semibold text-zinc-900">Create event</p>
              <p className="mt-1 text-xs text-zinc-500">Set up a new city event</p>
            </Link>
          ) : null}
          <Link
            href="/admin/waitlist"
            className="group rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-brand-500 hover:shadow-md"
          >
            <p className="text-sm font-semibold text-zinc-900">Waitlist</p>
            <p className="mt-1 text-xs text-zinc-500">{reg.waitlisted} pending review</p>
          </Link>
          <Link
            href="/admin/registrations"
            className="group rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-brand-500 hover:shadow-md"
          >
            <p className="text-sm font-semibold text-zinc-900">Registered clients</p>
            <p className="mt-1 text-xs text-zinc-500">{reg.confirmed} confirmed guests</p>
          </Link>
          <Link
            href="/admin/scan"
            className="group rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-brand-500 hover:shadow-md"
          >
            <p className="text-sm font-semibold text-zinc-900">QR scanning</p>
            <p className="mt-1 text-xs text-zinc-500">Check in attendees on site</p>
          </Link>
        </div>
      </DashboardSection>
    </div>
  );
}
