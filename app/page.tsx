import Link from "next/link";
import { listPublishedEvents, getEventBannerUrl, getEffectiveRegistrationStatus } from "@/lib/models/Event";
import { formatEventDate } from "@/lib/date-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  let events: Awaited<ReturnType<typeof listPublishedEvents>> = [];
  try {
    events = await listPublishedEvents();
  } catch {
    events = [];
  }

  return (
    <div className="public-light min-h-screen bg-white px-4 pt-[35px] pb-[35px]">
      <div className="mx-auto max-w-6xl">
        {events.length === 0 ? (
          <p className="text-center text-zinc-600">
            No events at the moment. Check back later.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((ev) => {
              const status = getEffectiveRegistrationStatus(ev);
              return (
                <Link
                  key={ev._id?.toString() ?? ev.eventId}
                  href={`/events/${ev.eventId}`}
                  target="_blank"
                  className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="aspect-[3/2] w-full shrink-0 overflow-hidden bg-zinc-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getEventBannerUrl(ev)}
                      alt={ev.eventName}
                      className="h-full w-full object-cover object-top transition-transform group-hover:scale-[1.02]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h2 className="line-clamp-2 font-semibold text-zinc-900">
                        {ev.eventName}
                      </h2>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          status === "open"
                            ? "bg-brand-100 text-brand-800"
                            : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {status === "open" ? "Open" : "Closed"}
                      </span>
                    </div>
                    <p className="flex items-center gap-1.5 text-sm text-zinc-600">
                      <span aria-hidden className="text-zinc-400">📅</span>
                      {formatEventDate(ev.eventStartDate)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
