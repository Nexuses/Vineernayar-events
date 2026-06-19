import Link from "next/link";
import { listPublishedEvents, getEventBannerUrl, getPublicRegistrationWindowStatusByEventIds, getRegistrationWindowLabel } from "@/lib/models/Event";
import { getRegistrationWindowBadgeClass } from "@/lib/registration-window";
import { formatEventDate } from "@/lib/date-utils";
import { CalendarIcon } from "@/app/events/EventIcons";
import { Footer } from "@/app/components/Footer";
import { HeaderBar } from "@/app/components/HeaderBar";
import { BannerImageWithHighlight } from "@/app/components/BannerImageWithHighlight";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  let events: Awaited<ReturnType<typeof listPublishedEvents>> = [];
  try {
    events = await listPublishedEvents();
  } catch {
    events = [];
  }

  const registrationStatuses = await getPublicRegistrationWindowStatusByEventIds(events);

  return (
    <div className="public-light flex min-h-screen flex-col bg-white">
      <HeaderBar />
      <div className="flex-1 px-4 pb-[35px] pt-6">
        <div className="mx-auto max-w-6xl">
          {events.length === 0 ? (
            <p className="text-center text-zinc-600">
              No events at the moment. Check back later.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((ev) => {
                const status = registrationStatuses.get(ev.eventId) ?? "open";
                return (
                  <Link
                    key={ev._id?.toString() ?? ev.eventId}
                    href={`/events/${ev.eventId}`}
                    target="_blank"
                    className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="aspect-[3/2] w-full shrink-0 overflow-hidden bg-zinc-100">
                      <BannerImageWithHighlight
                        src={getEventBannerUrl(ev)}
                        alt={ev.eventName}
                        venue={ev.venue}
                        eventName={ev.eventName}
                        className="h-full"
                        imgClassName="transition-transform group-hover:scale-[1.02]"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h2 className="line-clamp-2 font-semibold text-zinc-900">
                          {ev.eventName}
                        </h2>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${getRegistrationWindowBadgeClass(status)}`}
                        >
                          {getRegistrationWindowLabel(status)}
                        </span>
                      </div>
                      <p className="flex items-center gap-1.5 text-sm text-zinc-600">
                        <CalendarIcon className="h-4 w-4 shrink-0 text-zinc-400" />
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
      <Footer />
    </div>
  );
}
