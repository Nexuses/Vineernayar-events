"use client";

import {
  buildConfirmationTimeline,
  confirmationChipLabel,
  type RoundBearingRegistration,
} from "@/lib/confirmation-rounds";
import { attendanceRsvpBadgeClass } from "@/lib/attendance-rsvp";

function formatWhen(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export { formatWhen as formatConfirmationWhen };

/**
 * One chip per confirmation round the attendee has been through, oldest first.
 * A later round never hides an earlier one, so "confirmed, then declined the
 * reconfirm" reads as two chips rather than a single overwritten status.
 */
export function ConfirmationHistoryChips({
  registration,
  emptyLabel = "—",
}: {
  registration: RoundBearingRegistration;
  emptyLabel?: string;
}) {
  const timeline = buildConfirmationTimeline(registration);
  if (timeline.length === 0) return <span className="text-zinc-400">{emptyLabel}</span>;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {timeline.map((entry) => (
        <span
          key={entry.round}
          title={`${entry.roundLabel} — ${entry.statusLabel}\nEmail sent: ${formatWhen(
            entry.emailSentAt
          )}\nResponded: ${formatWhen(entry.respondedAt)}`}
          className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${attendanceRsvpBadgeClass(
            entry.status
          )}`}
        >
          {confirmationChipLabel(entry)}
        </span>
      ))}
    </div>
  );
}

/** Full dated timeline, for the expanded detail panel. */
export function ConfirmationHistoryTimeline({
  registration,
}: {
  registration: RoundBearingRegistration;
}) {
  const timeline = buildConfirmationTimeline(registration);
  if (timeline.length === 0) {
    return <p className="text-sm text-zinc-500">No confirmation request has been sent yet.</p>;
  }

  return (
    <ol className="space-y-2">
      {timeline.map((entry) => (
        <li key={entry.round} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${attendanceRsvpBadgeClass(
              entry.status
            )}`}
          >
            {entry.roundLabel}
          </span>
          <span className="font-medium text-zinc-900">{entry.statusLabel}</span>
          <span className="text-zinc-500">
            {entry.respondedAt ? `on ${formatWhen(entry.respondedAt)}` : "no response yet"}
            {" · asked "}
            {formatWhen(entry.emailSentAt)}
          </span>
        </li>
      ))}
    </ol>
  );
}
