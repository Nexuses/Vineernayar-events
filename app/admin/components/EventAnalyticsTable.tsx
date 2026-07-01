import Link from "next/link";
import type { EventAnalyticsRow } from "@/lib/dashboard-analytics";
import { formatEventDate } from "@/lib/date-utils";
import {
  getRegistrationWindowBadgeClass,
  getRegistrationWindowLabel,
} from "@/lib/registration-window";

export function EventAnalyticsTable({ rows }: { rows: EventAnalyticsRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 shadow-sm">
        No events in this view yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <th className="px-4 py-3">Event</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Reg. window</th>
            <th className="px-4 py-3 text-right">Total</th>
            <th className="px-4 py-3 text-right">Confirmed</th>
            <th className="px-4 py-3 text-right">Waitlist</th>
            <th className="px-4 py-3 text-right">Rejected</th>
            <th className="px-4 py-3 text-right">Attended</th>
            <th className="px-4 py-3 text-right">Priority</th>
            <th className="px-4 py-3 text-right">Blasted</th>
            <th className="px-4 py-3 text-right">Capacity</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.eventId} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/80">
              <td className="px-4 py-3">
                <p className="font-medium text-zinc-900">{row.eventName}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{row.venue || "—"}</p>
                <p className="mt-0.5 text-xs text-zinc-400">{row.registrationType}</p>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-zinc-700">
                {formatEventDate(row.eventDate)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getRegistrationWindowBadgeClass(row.windowStatus)}`}
                >
                  {getRegistrationWindowLabel(row.windowStatus)}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-semibold text-zinc-900">{row.total}</td>
              <td className="px-4 py-3 text-right text-emerald-700">{row.confirmed}</td>
              <td className="px-4 py-3 text-right text-amber-700">{row.waitlisted}</td>
              <td className="px-4 py-3 text-right text-red-700">{row.rejected}</td>
              <td className="px-4 py-3 text-right text-zinc-800">{row.attended}</td>
              <td className="px-4 py-3 text-right text-zinc-800">{row.priority}</td>
              <td className="px-4 py-3 text-right text-zinc-600">
                {row.blastedCount > 0 ? (
                  <span className="text-emerald-700">
                    {row.blastedCount}/{row.total}
                  </span>
                ) : (
                  <span className="text-zinc-400">0/{row.total}</span>
                )}
              </td>
              <td className="px-4 py-3 text-right text-zinc-600">
                {row.seatLimit ? (
                  <span>
                    {row.confirmed}/{row.seatLimit}
                    {row.fillPct != null ? (
                      <span className="ml-1 text-xs text-zinc-400">({row.fillPct}%)</span>
                    ) : null}
                  </span>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-zinc-100 px-4 py-2 text-right">
        <Link href="/admin/events" className="text-xs font-medium text-brand-600 hover:underline">
          View all events →
        </Link>
      </div>
    </div>
  );
}
