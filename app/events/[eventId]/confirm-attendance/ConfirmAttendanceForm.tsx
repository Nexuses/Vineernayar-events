"use client";

import { useEffect, useState } from "react";
import type { AttendanceRsvpIntent } from "@/lib/attendance-rsvp";

type LoadedState = {
  eventName: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  firstName: string;
  email: string;
  attendanceRsvpStatus: "pending" | "reconfirmed" | "declined";
};

export function ConfirmAttendanceForm({
  eventId,
  code,
  intent,
  round = 1,
}: {
  eventId: string;
  code: string;
  intent: AttendanceRsvpIntent;
  round?: number;
}) {
  const [loaded, setLoaded] = useState<LoadedState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ code, intent, round: String(round) });
        const res = await fetch(`/api/events/${eventId}/confirm-attendance?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) setError(data.error || "Unable to load your registration");
          return;
        }
        if (!cancelled) {
          setLoaded({
            eventName: data.eventName,
            eventDate: data.eventDate ?? "",
            eventTime: data.eventTime ?? "",
            venue: data.venue ?? "",
            firstName: data.firstName,
            email: data.email,
            attendanceRsvpStatus: data.attendanceRsvpStatus ?? "pending",
          });
          if (data.attendanceRsvpStatus === "reconfirmed" && intent === "attending") {
            setDone(true);
          }
          if (data.attendanceRsvpStatus === "declined" && intent === "declined") {
            setDone(true);
          }
        }
      } catch {
        if (!cancelled) setError("Unable to load your registration");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [eventId, code, intent, round]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!loaded) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/events/${eventId}/confirm-attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          email: loaded.email,
          intent,
          round,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to save your response");
        return;
      }
      setDone(true);
    } catch {
      setError("Unable to save your response. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const attending = intent === "attending";
  const title = attending ? "Confirm your attendance" : "Update your attendance";
  const buttonLabel = attending ? "Yes, I'll be attending" : "No, I won't attend";
  const successTitle = attending
    ? "Thank you for confirming"
    : "Your response has been recorded";
  const successMessage = attending
    ? "We have reserved your seat and look forward to seeing you at the event."
    : "We have updated your registration. You will no longer be counted as attending this event.";

  if (loading) {
    return <p className="text-sm text-zinc-600">Loading your registration…</p>;
  }

  if (error && !loaded) {
    return <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>;
  }

  if (!loaded) {
    return null;
  }

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-6">
        <h2 className="text-lg font-semibold text-emerald-900">{successTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-emerald-800">{successMessage}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">{title}</h2>
        <p className="mt-2 text-sm text-zinc-600">
          {attending
            ? "Please confirm that you are still planning to attend."
            : "Let us know if you can no longer attend so we can release your seat."}
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-4">
        <p className="text-base font-semibold text-zinc-900">{loaded.eventName}</p>
        <dl className="mt-3 space-y-1.5 text-sm">
          {loaded.eventDate ? (
            <div className="flex gap-2">
              <dt className="w-14 shrink-0 text-zinc-500">Date</dt>
              <dd className="font-medium text-zinc-900">{loaded.eventDate}</dd>
            </div>
          ) : null}
          {loaded.eventTime ? (
            <div className="flex gap-2">
              <dt className="w-14 shrink-0 text-zinc-500">Time</dt>
              <dd className="font-medium text-zinc-900">{loaded.eventTime}</dd>
            </div>
          ) : null}
          {loaded.venue ? (
            <div className="flex gap-2">
              <dt className="w-14 shrink-0 text-zinc-500">Venue</dt>
              <dd className="font-medium text-zinc-900">{loaded.venue}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      {error ? (
        <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div>
        <label htmlFor="confirm-email" className="mb-2 block text-sm font-medium text-zinc-700">
          Email
        </label>
        <input
          id="confirm-email"
          type="email"
          value={loaded.email}
          readOnly
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-brand-500 px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {submitting ? "Saving…" : buttonLabel}
      </button>
    </form>
  );
}
