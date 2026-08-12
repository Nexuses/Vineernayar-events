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
  schedule?: Record<EmailSequenceKey, string | null> | null;
  emailsEnabled?: Record<EmailSequenceKey, boolean> | null;
};

function formatSchedule(iso: string | null | undefined): { text: string; past: boolean } {
  if (!iso) return { text: "On registration", past: false };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { text: "—", past: false };
  const text = d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return { text, past: d.getTime() < Date.now() };
}

const selectClass =
  "w-full max-w-md rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

export function EmailStatsSection({
  events,
  canTrigger = false,
}: {
  events: EventItem[];
  canTrigger?: boolean;
}) {
  const [selectedEventId, setSelectedEventId] = useState("");
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [triggeringKey, setTriggeringKey] = useState<EmailSequenceKey | null>(null);
  const [triggerMsg, setTriggerMsg] = useState("");

  useEffect(() => {
    let active = true;
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

  async function refreshStats() {
    if (!selectedEventId) return;
    try {
      const res = await fetch(`/api/admin/email-stats?eventId=${encodeURIComponent(selectedEventId)}`);
      if (res.ok) setStats(await res.json());
    } catch {
      /* keep previous stats on refresh failure */
    }
  }

  async function handleTrigger(key: EmailSequenceKey) {
    if (!canTrigger || !selectedEventId) return;
    const stat = stats?.perSeq?.[key];
    const pending = stat?.pending ?? 0;
    const label = EMAIL_SEQUENCE_LABELS[key];
    if (pending === 0) {
      setTriggerMsg(`Every confirmed attendee has already received "${label}".`);
      return;
    }
    const sched = formatSchedule(stats?.schedule?.[key]);
    const pastNote = sched.past
      ? `\n\nNote: this email was scheduled for ${sched.text}, which has already passed.`
      : "";
    if (
      !confirm(
        `Send "${label}" now to ${pending} attendee${pending === 1 ? "" : "s"} who haven't received it?${pastNote}`
      )
    ) {
      return;
    }

    setTriggeringKey(key);
    setTriggerMsg("");
    setError("");
    try {
      const res = await fetch("/api/admin/email-stats/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: selectedEventId, key }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not send.");
        return;
      }
      setTriggerMsg(
        `"${label}": ${data.sent} sent${data.failed ? `, ${data.failed} failed` : ""} (of ${data.attempted} attempted).`
      );
      await refreshStats();
    } catch {
      setError("Could not send.");
    } finally {
      setTriggeringKey(null);
    }
  }

  const showActions = canTrigger && Boolean(selectedEventId);

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
      {triggerMsg ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{triggerMsg}</p>
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
                <th className="px-4 py-3 font-medium">Scheduled</th>
                <th className="px-4 py-3 font-medium text-right">Triggered</th>
                <th className="px-4 py-3 font-medium text-right">Sent</th>
                <th className="px-4 py-3 font-medium text-right">Failed</th>
                <th className="px-4 py-3 font-medium text-right">Pending</th>
                <th className="px-4 py-3 font-medium text-right">Opened</th>
                <th className="px-4 py-3 font-medium text-right">Clicks</th>
                {showActions ? <th className="px-4 py-3 font-medium text-right">Action</th> : null}
              </tr>
            </thead>
            <tbody>
              {EMAIL_SEQUENCE_ORDER.map((key) => {
                const s = stats?.perSeq?.[key];
                const sched = stats?.schedule
                  ? formatSchedule(stats.schedule[key])
                  : { text: EMAIL_SEQUENCE_SCHEDULE[key], past: false };
                const pending = s?.pending ?? 0;
                const emailOff = stats?.emailsEnabled ? stats.emailsEnabled[key] === false : false;
                return (
                  <tr key={key} className="border-b border-zinc-100">
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {EMAIL_SEQUENCE_LABELS[key]}
                      {emailOff ? (
                        <span className="ml-2 rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600">
                          Off
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {sched.text}
                      {sched.past ? <span className="ml-1 text-amber-600">(passed)</span> : null}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-900">{s?.triggered ?? 0}</td>
                    <td className="px-4 py-3 text-right font-medium text-green-700">{s?.sent ?? 0}</td>
                    <td className="px-4 py-3 text-right text-red-600">{s?.failed ?? 0}</td>
                    <td className="px-4 py-3 text-right text-amber-600">{pending}</td>
                    <td className="px-4 py-3 text-right text-zinc-400">—</td>
                    <td className="px-4 py-3 text-right text-zinc-400">—</td>
                    {showActions ? (
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleTrigger(key)}
                          disabled={triggeringKey !== null || pending === 0}
                          className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                          title={pending === 0 ? "Nothing pending" : "Send now to pending attendees"}
                        >
                          {triggeringKey === key ? "Sending…" : "Send now"}
                        </button>
                      </td>
                    ) : null}
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
          <p className="mt-1">
            Opened and Clicks tracking is coming soon. An <span className="font-medium">Off</span>{" "}
            email will not send automatically for this event (turn it on in the event settings);
            &ldquo;Send now&rdquo; still works.
          </p>
          {showActions ? (
            <p className="mt-1">
              <span className="font-medium">Send now</span> sends that email to confirmed attendees
              who haven&rsquo;t received it yet, regardless of the schedule (email + WhatsApp for
              that step).
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
