import Link from "next/link";
import { formatEventDate, getEventTimeDisplay } from "@/lib/date-utils";
import { buildGoogleMapsDirectionsUrl } from "@/lib/google-maps";
import { getCountdownState } from "@/lib/countdown";
import { REGISTRATION_SIDEBAR_COVER_URL } from "@/lib/constants";
import { EventCountdown } from "./EventCountdown";
import { CalendarIcon, ClockIcon, MapPinIcon } from "@/app/events/EventIcons";

type RegistrationEventSidebarProps = {
  eventName: string;
  eventStartDate: Date;
  eventEndDate: Date;
  eventTime?: string;
  venue: string;
  phone?: string;
  countdownStartIso?: string;
  countdownEndIso?: string;
  hasAgenda?: boolean;
};

export function RegistrationEventSidebar({
  eventName,
  eventStartDate,
  eventEndDate,
  eventTime,
  venue,
  phone,
  countdownStartIso,
  countdownEndIso,
  hasAgenda = false,
}: RegistrationEventSidebarProps) {
  const countdownInitial =
    countdownStartIso && countdownEndIso
      ? getCountdownState(
          new Date(countdownStartIso).getTime(),
          new Date(countdownEndIso).getTime()
        )
      : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)]">
      <div className="h-[160px] w-full shrink-0 overflow-hidden bg-zinc-100 sm:h-[168px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={REGISTRATION_SIDEBAR_COVER_URL}
          alt="Humans First, Machines Second"
          className="h-full w-full object-cover object-center"
        />
      </div>

      <div className="space-y-0 bg-[#f5f5f5] p-4 sm:p-6">
        {countdownStartIso && countdownEndIso && countdownInitial ? (
          <div className="-mt-5">
            <EventCountdown
              startIso={countdownStartIso}
              endIso={countdownEndIso}
              initialState={countdownInitial}
            />
          </div>
        ) : null}

        <div className="mt-3 divide-y divide-zinc-300">
          <div className="flex items-center gap-3 py-3.5">
            <div className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full bg-[#f3e31d]">
              <CalendarIcon className="h-6 w-6 text-zinc-900" />
            </div>
            <p className="text-base font-bold tracking-tight text-zinc-900 sm:text-[18px]">
              {formatEventDate(eventStartDate)}
            </p>
          </div>

          <div className="flex items-center gap-3 py-3.5">
            <div className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full bg-[#f3e31d]">
              <ClockIcon className="h-6 w-6 text-zinc-900" />
            </div>
            <p className="text-base font-bold tracking-tight text-zinc-900 sm:text-[18px]">
              {getEventTimeDisplay({ eventStartDate, eventEndDate, eventTime })}
            </p>
          </div>

          {venue ? (
            <div className="flex items-start gap-3 py-3.5">
              <div className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full bg-[#f3e31d]">
                <MapPinIcon className="h-6 w-6 text-zinc-900" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="break-words text-base font-bold leading-snug tracking-tight text-zinc-900 sm:text-[18px]">
                  {venue}
                </p>
                <a
                  href={buildGoogleMapsDirectionsUrl(venue)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#f3e31d] px-3.5 py-1.5 text-xs font-bold text-zinc-900 no-underline transition hover:brightness-95"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(0,0,0,0.08)]">
                    <svg
                      className="h-3.5 w-3.5 text-zinc-900"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.25}
                      aria-hidden
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 17 17 7" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h8v8" />
                    </svg>
                  </span>
                  Open in Google Maps
                </a>
              </div>
            </div>
          ) : null}

          {phone ? (
            <div className="flex items-center gap-3 py-3.5">
              <div className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full bg-[#f3e31d]">
                <svg className="h-6 w-6 text-zinc-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.34 1.78.65 2.62a2 2 0 0 1-.45 2.11L8.1 9.91a16 16 0 0 0 6 6l1.46-1.21a2 2 0 0 1 2.11-.45c.84.31 1.72.53 2.62.65A2 2 0 0 1 22 16.92z"
                  />
                </svg>
              </div>
              <p className="min-w-0 flex-1 truncate text-base font-bold tracking-tight text-zinc-900 sm:text-[18px]">
                {phone}
              </p>
              <a
                href={`tel:${phone}`}
                className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full bg-[#f3e31d] px-3.5 py-1.5 text-xs font-bold text-zinc-900 no-underline transition hover:brightness-95"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(0,0,0,0.08)]">
                  <svg
                    className="h-3.5 w-3.5 text-zinc-900"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.25}
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 17 17 7" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h8v8" />
                  </svg>
                </span>
                Click to Call
              </a>
            </div>
          ) : null}
        </div>

        {hasAgenda ? (
          <Link
            href="#agenda-section"
            className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-3 text-sm font-bold text-white no-underline transition hover:bg-slate-800 lg:hidden"
          >
            Explore full agenda & schedule
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
