"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatEventDate, getEventTimeDisplay } from "@/lib/date-utils";
import { DEFAULT_EVENT_BANNER_URL } from "@/lib/constants";
import { getRegistrationWindowStatus, getRegistrationWindowLabel, getRegistrationWindowBadgeClass } from "@/lib/registration-window";
import { BannerImageWithHighlight } from "@/app/components/BannerImageWithHighlight";

type EventItem = {
  _id: string;
  eventId: string;
  eventName: string;
  eventBanner: string;
  eventStartDate: string;
  eventEndDate: string;
  eventTime?: string;
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

function effectiveRegistrationStatus(ev: EventItem): ReturnType<typeof getRegistrationWindowStatus> {
  return getRegistrationWindowStatus(ev);
}

const PAGE_SIZE = 9;

function matchesEventSearch(ev: EventItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    ev.eventName,
    ev.eventId,
    ev.venue,
    ev.speaker,
    ev.phone,
    formatEventDate(ev.eventStartDate),
    getEventTimeDisplay(ev),
    getRegistrationWindowLabel(effectiveRegistrationStatus(ev)),
    ev.published === false ? "unpublished" : "published",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export default function AllEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  async function fetchEvents() {
    setListLoading(true);
    try {
      const [eventsRes, meRes] = await Promise.all([
        fetch("/api/admin/events"),
        fetch("/api/admin/me"),
      ]);
      if (!eventsRes.ok) {
        setError("Failed to load events");
        return;
      }
      const data = await eventsRes.json();
      setEvents(data);
      if (meRes.ok) {
        const me = await meRes.json();
        setCanEdit(me.role === "superadmin");
      }
    } catch {
      setError("Failed to load events");
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = useMemo(
    () => events.filter((ev) => matchesEventSearch(ev, searchQuery)),
    [events, searchQuery]
  );

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));

  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredEvents.slice(start, start + PAGE_SIZE);
  }, [filteredEvents, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pageStart = filteredEvents.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(currentPage * PAGE_SIZE, filteredEvents.length);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">All Events</h1>
          {!listLoading && events.length > 0 ? (
            <p className="mt-1 text-sm text-zinc-500">
              {events.length} event{events.length === 1 ? "" : "s"}
              {searchQuery.trim() ? (
                <span>
                  {" "}
                  · {filteredEvents.length} match{filteredEvents.length === 1 ? "" : "es"}
                </span>
              ) : null}
            </p>
          ) : null}
        </div>
        {!listLoading && events.length > 0 ? (
          <div className="w-full max-w-sm">
            <label className="sr-only" htmlFor="events-search">
              Search events
            </label>
            <input
              id="events-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, ID, venue, speaker…"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        ) : null}
      </div>
      {error ? (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      ) : null}

      {listLoading ? (
        <p className="mt-4 text-sm text-zinc-500">Loading events…</p>
      ) : events.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">No events yet.</p>
      ) : filteredEvents.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">No events match your search.</p>
      ) : (
        <>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedEvents.map((ev) => {
            const status = effectiveRegistrationStatus(ev);
            const isPublished = ev.published ?? true;
            return (
              <article
                key={ev._id}
                className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="aspect-[3/2] w-full shrink-0 overflow-hidden bg-zinc-100">
                  <BannerImageWithHighlight
                    src={ev.eventBanner?.trim() || DEFAULT_EVENT_BANNER_URL}
                    alt={ev.eventName}
                    label=""
                    className="h-full"
                  />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-zinc-900 line-clamp-2">
                      {ev.eventName}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${getRegistrationWindowBadgeClass(status)}`}
                      >
                        {getRegistrationWindowLabel(status)}
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
                      <dt className="sr-only">Date</dt>
                      <dd className="text-zinc-600">{formatEventDate(ev.eventStartDate)}</dd>
                    </div>
                    <div>
                      <dt className="sr-only">Time</dt>
                      <dd className="text-zinc-600">{getEventTimeDisplay(ev)}</dd>
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
                  {canEdit ? (
                    <Link
                      href={`/admin/events/${ev._id}/edit`}
                      className="mt-4 inline-flex w-full justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                    >
                      Edit
                    </Link>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>

        {filteredEvents.length > PAGE_SIZE ? (
          <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-zinc-200 pt-6 sm:flex-row">
            <p className="text-sm text-zinc-600">
              Showing {pageStart}–{pageEnd} of {filteredEvents.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage <= 1}
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-2 text-sm text-zinc-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
        </>
      )}
    </div>
  );
}

