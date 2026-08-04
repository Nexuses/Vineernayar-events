"use client";

import { useEffect, useState } from "react";
import {
  EMAIL_SEQUENCE_LABELS,
  EMAIL_SEQUENCE_ORDER,
  EMAIL_SEQUENCE_SCHEDULE,
  type EmailSequenceKey,
} from "@/lib/email-sequence";

type EventItem = {
  eventId: string;
  dropdownLabel: string;
};

type SeqStat = {
  triggered: number;
  sent: number;
  failed: number;
  pending: number;
  total: number;
};

type StatsResponse = {
  total: number;
  perSeq: Record<EmailSequenceKey, SeqStat>;
};

const selectClass =
  "w-full max-w-md rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

export function EmailStatsSection({ events }: { events: EventItem[] }) {
  const [selectedEventId, setSelectedEventId] = useState("");
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- show the loading state while the request is in flight
    setLoading(true);
    setError("");
    const qs = selectedEventId ? `?eventId=${encodeURIComponent(selectedEventId)}` : "";
    fetch(`/api/admin/email-stats${qs}`)
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        if (active) setStats(data);
      })
      .catch(() => {
        if (!active) return;
        setStats(null);
        setError("Could not load stats.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedEventId]);

  return (
    <div className="mt-6 space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700">Event</label>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className={selectClass}
        >
          <option value="">All events</option>
          {events.map((ev) => (
            <option key={ev.eventId} value={ev.eventId}>
              {ev.dropdownLabel}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-4 py-3">
          <p className="text-sm text-zinc-600">
            {loading
              ? "Loading…"
              : `${stats?.total ?? 0} confirmed ${
                  (stats?.total ?? 0) === 1 ? "registration" : "registrations"
                } in scope`}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-zinc-600">
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium text-right">Triggered</th>
                <th className="px-4 py-3 font-medium text-right">Sent</th>
                <th className="px-4 py-3 font-medium text-right">Failed</th>
                <th className="px-4 py-3 font-medium text-right">Pending</th>
                <th className="px-4 py-3 font-medium text-right">Opened</th>
                <th className="px-4 py-3 font-medium text-right">Clicks</th>
              </tr>
            </thead>
            <tbody>
              {EMAIL_SEQUENCE_ORDER.map((key) => {
                const s = stats?.perSeq?.[key];
                return (
                  <tr key={key} className="border-b border-zinc-100">
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {EMAIL_SEQUENCE_LABELS[key]}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">{EMAIL_SEQUENCE_SCHEDULE[key]}</td>
                    <td className="px-4 py-3 text-right text-zinc-900">{s?.triggered ?? 0}</td>
                    <td className="px-4 py-3 text-right font-medium text-green-700">{s?.sent ?? 0}</td>
                    <td className="px-4 py-3 text-right text-red-600">{s?.failed ?? 0}</td>
                    <td className="px-4 py-3 text-right text-amber-600">{s?.pending ?? 0}</td>
                    <td className="px-4 py-3 text-right text-zinc-400">—</td>
                    <td className="px-4 py-3 text-right text-zinc-400">—</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-zinc-200 px-4 py-3 text-xs text-zinc-500">
          <p>
            <span className="font-medium">Triggered</span> = the system attempted the send
            (delivered or failed). <span className="font-medium">Sent</span> = accepted by the mail
            provider. <span className="font-medium">Pending</span> = scheduled, not yet sent.
          </p>
          <p className="mt-1">Opened and Clicks tracking is coming soon.</p>
        </div>
      </div>
    </div>
  );
}
