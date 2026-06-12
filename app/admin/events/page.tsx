"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatEventDateTime } from "@/lib/date-utils";
import { DEFAULT_EVENT_BANNER_URL } from "@/lib/constants";

type EventItem = {
  _id: string;
  eventId: string;
  eventName: string;
  eventBanner: string;
  eventStartDate: string;
  eventEndDate: string;
  registrationStartDate?: string;
  registrationEndDate?: string;
  venue: string;
  speaker: string;
  phone: string;
  registrationStatus: string;
  registrationType?: "open_for_all" | "invitees_only";
  collectApparelSize?: boolean;
  collectOvernightStay?: boolean;
  collectPassportNic?: boolean;
  collectTransport?: boolean;
  requireWhatsAppNumber?: boolean;
  requireApparelSize?: boolean;
  requireOvernightStay?: boolean;
  requirePassportNic?: boolean;
  requireTransport?: boolean;
  published?: boolean;
  createdAt: string;
};

function effectiveRegistrationStatus(ev: EventItem): "open" | "closed" {
  const now = new Date();
  const start = ev.registrationStartDate ? new Date(ev.registrationStartDate) : null;
  const end = ev.registrationEndDate ? new Date(ev.registrationEndDate) : null;
  const startValid = start && !Number.isNaN(start.getTime()) ? start : null;
  const endValid = end && !Number.isNaN(end.getTime()) ? end : null;
  if (startValid && endValid) return now >= startValid && now <= endValid ? "open" : "closed";
  if (startValid) return now >= startValid ? "open" : "closed";
  if (endValid) return now <= endValid ? "open" : "closed";
  return ev.registrationStatus === "open" ? "open" : "closed";
}

export default function AllEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchEvents() {
    setListLoading(true);
    try {
      const res = await fetch("/api/admin/events");
      if (!res.ok) {
        setError("Failed to load events");
        return;
      }
      const data = await res.json();
      setEvents(data);
    } catch {
      setError("Failed to load events");
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">All Events</h1>
      {error ? (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      ) : null}

      {listLoading ? (
        <p className="mt-4 text-sm text-zinc-500">Loading events…</p>
      ) : events.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">No events yet.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => {
            const status = effectiveRegistrationStatus(ev);
            const isPublished = ev.published ?? true;
            return (
              <article
                key={ev._id}
                className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="aspect-[3/2] w-full shrink-0 overflow-hidden bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ev.eventBanner?.trim() || DEFAULT_EVENT_BANNER_URL}
                    alt={ev.eventName}
                    className="h-full w-full object-cover object-top"
                  />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-zinc-900 line-clamp-2">
                      {ev.eventName}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          status === "open"
                            ? "bg-green-100 text-green-800"
                            : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {status === "open" ? "Open" : "Closed"}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          isPublished
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {isPublished ? "Published" : "Unpublished"}
                      </span>
                    </div>
                  </div>
                  <p className="mb-1 text-xs font-mono text-zinc-500">{ev.eventId}</p>
                  <dl className="mt-2 space-y-1.5 text-sm">
                    <div>
                      <dt className="sr-only">Start</dt>
                      <dd className="text-zinc-600">{formatEventDateTime(ev.eventStartDate)}</dd>
                    </div>
                    <div>
                      <dt className="sr-only">End</dt>
                      <dd className="text-zinc-600">{formatEventDateTime(ev.eventEndDate)}</dd>
                    </div>
                    {ev.venue ? (
                      <div>
                        <dt className="sr-only">Venue</dt>
                        <dd className="text-zinc-600">{ev.venue}</dd>
                      </div>
                    ) : null}
                    {ev.speaker ? (
                      <div>
                        <dt className="sr-only">Speaker</dt>
                        <dd className="text-zinc-600">{ev.speaker}</dd>
                      </div>
                    ) : null}
                    {ev.phone ? (
                      <div>
                        <dt className="sr-only">Phone</dt>
                        <dd className="text-zinc-600">{ev.phone}</dd>
                      </div>
                    ) : null}
                  </dl>
                  <Link
                    href={`/admin/events/${ev._id}/edit`}
                    className="mt-4 inline-flex w-full justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                  >
                    Edit
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

