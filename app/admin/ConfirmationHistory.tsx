"use client";

import {
  RESPONSE_BUTTON_LABELS,
  buildConfirmationActivity,
  buildConfirmationTimeline,
  confirmationChipLabel,
  type ConfirmationActivityEntry,
  type ConfirmationTimelineEntry,
  type RoundBearingRegistration,
} from "@/lib/confirmation-rounds";
import { attendanceRsvpBadgeClass } from "@/lib/attendance-rsvp";

/**
 * The opening Confirm entry is kept visually quiet — it records that the person
 * registered, not a yes/no, so the colour is reserved for the answer chips.
 */
function badgeClass(entry: ConfirmationTimelineEntry): string {
  if (entry.kind === "registration") return "bg-zinc-100 text-zinc-700";
  return attendanceRsvpBadgeClass(entry.status);
}

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
          title={
            entry.kind === "registration"
              ? `${entry.roundLabel} — registered ${formatWhen(entry.respondedAt)}`
              : `${entry.roundLabel} — ${entry.statusLabel}\nEmail sent: ${formatWhen(
                  entry.emailSentAt
                )}\nResponded: ${formatWhen(entry.respondedAt)}`
          }
          className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass(
            entry
          )}`}
        >
          {confirmationChipLabel(entry)}
        </span>
      ))}
    </div>
  );
}

function activityChipClass(entry: ConfirmationActivityEntry): string {
  if (entry.kind === "response") return attendanceRsvpBadgeClass(entry.status);
  return "bg-zinc-100 text-zinc-700";
}

function ordinal(n: number): string {
  const tail = n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
  return `${n}${tail}`;
}

function minutesBetween(fromIso: string, toIso: string): string {
  const mins = Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 60000);
  if (mins < 1) return "under a minute";
  if (mins < 60) return `${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours} hr`;
  return `${Math.round(hours / 24)} days`;
}

/**
 * Every send and every click, oldest first. Each click names the button, the
 * email it came from and that email's event — so a click can never appear to
 * come before the email it answered.
 */
export function ConfirmationHistoryTimeline({
  registration,
}: {
  registration: RoundBearingRegistration;
}) {
  const activity = buildConfirmationActivity(registration);
  if (activity.length === 0) {
    return <p className="text-sm text-zinc-500">No confirmation activity yet.</p>;
  }

  return (
    <ol className="relative space-y-3 border-l border-zinc-200 pl-5">
      {activity.map((entry, i) => (
        <li key={`${entry.kind}-${entry.round}-${entry.at}-${i}`} className="relative">
          <span
            aria-hidden
            className={`absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${
              entry.kind === "response"
                ? entry.status === "declined"
                  ? "bg-red-500"
                  : "bg-emerald-500"
                : entry.kind === "sent"
                  ? "bg-sky-500"
                  : "bg-zinc-400"
            }`}
          />
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
            <time className="whitespace-nowrap text-xs font-medium tabular-nums text-zinc-500">
              {formatWhen(entry.at)}
            </time>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${activityChipClass(
                entry
              )}`}
            >
              {entry.roundLabel}
            </span>
          </div>

          {entry.kind === "registered" ? (
            <p className="mt-0.5 text-sm text-zinc-900">
              <span className="font-medium">Registered</span>
              {entry.eventLabel ? <span className="text-zinc-600"> for {entry.eventLabel}</span> : null}
            </p>
          ) : null}

          {entry.kind === "sent" ? (
            <p className="mt-0.5 text-sm text-zinc-900">
              <span className="font-medium">
                {entry.roundLabel} email sent
                {(entry.sendNumber ?? 1) > 1
                  ? entry.sendNumberExact
                    ? ` again · ${ordinal(entry.sendNumber ?? 2)} send`
                    : " again"
                  : ""}
              </span>
              {entry.eventLabel ? <span className="text-zinc-600"> for {entry.eventLabel}</span> : null}
            </p>
          ) : null}

          {entry.kind === "response" ? (
            <div className="mt-0.5 text-sm">
              <p className="text-zinc-900">
                <span className="font-medium">
                  Clicked &ldquo;
                  {entry.status && entry.status !== "pending"
                    ? RESPONSE_BUTTON_LABELS[entry.status]
                    : "a response"}
                  &rdquo;
                </span>
              </p>
              <p className="text-zinc-600">
                in the <span className="font-medium text-zinc-800">{entry.roundLabel}</span> email
                {entry.eventLabel ? (
                  <>
                    {" "}for <span className="font-medium text-zinc-800">{entry.eventLabel}</span>
                  </>
                ) : null}
                {entry.answeredEmailSentAt ? (
                  <>
                    {" "}sent {formatWhen(entry.answeredEmailSentAt)}
                    {(entry.answeredSendNumber ?? 1) > 1 && entry.answeredSendNumberExact
                      ? ` (${ordinal(entry.answeredSendNumber ?? 2)} send)`
                      : ""}
                    <span className="text-zinc-400">
                      {" "}· {minutesBetween(entry.answeredEmailSentAt, entry.at)} after it went out
                    </span>
                  </>
                ) : null}
              </p>
              {!entry.answeredEmailSentAt && !entry.recorded ? (
                <p className="mt-1 rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">
                  This click came from an earlier {entry.roundLabel} email. That send&rsquo;s time was
                  overwritten when the contact was uploaded again, before send history was kept.
                </p>
              ) : null}
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
