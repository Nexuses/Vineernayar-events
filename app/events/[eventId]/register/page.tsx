import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getEventBannerUrl,
  getPublicRegistrationWindowStatus,
} from "@/lib/models/Event";
import { getPublishedEventByEventId } from "@/lib/models/Event";
import type { EventDoc } from "@/lib/models/Event";
import { getCountdownState } from "@/lib/countdown";
import { formatEventDate, getEventTimeDisplay, getEventCountdownRange } from "@/lib/date-utils";
import { RegisterForm } from "./RegisterForm";
import { RegistrationClosedPage, RegistrationOpensSoonPage } from "../RegistrationClosedMessage";
import { EventCountdown } from "./EventCountdown";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function toPlainEvent(event: EventDoc, registrationStatus: "open" | "closed") {
  return {
    eventId: event.eventId,
    eventName: event.eventName,
    eventBanner: getEventBannerUrl(event),
    eventStartDate: event.eventStartDate instanceof Date ? event.eventStartDate.toISOString() : String(event.eventStartDate),
    eventEndDate: event.eventEndDate instanceof Date ? event.eventEndDate.toISOString() : String(event.eventEndDate),
    venue: event.venue,
    speaker: event.speaker,
    phone: event.phone,
    registrationStatus,
    collectApparelSize: !!event.collectApparelSize,
    collectOvernightStay: !!event.collectOvernightStay,
    collectPassportNic: !!event.collectPassportNic,
    collectTransport: !!event.collectTransport,
    requireWhatsAppNumber: !!event.requireWhatsAppNumber,
    requireApparelSize: !!event.requireApparelSize,
    requireOvernightStay: !!event.requireOvernightStay,
    requirePassportNic: !!event.requirePassportNic,
    requireTransport: !!event.requireTransport,
    transportLocations: event.transportLocations ?? [],
  };
}

const iconClass = "h-9 w-9 shrink-0 text-brand-500";

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const { eventId } = await params;
  const { email } = await searchParams;
  const event = await getPublishedEventByEventId(eventId);
  if (!event) notFound();
  const registrationWindow = await getPublicRegistrationWindowStatus(event);
  const registrationStatus = registrationWindow === "open" ? "open" : "closed";
  const countdownRange = getEventCountdownRange(event);

  const serializedEvent = toPlainEvent(event, registrationStatus);

  return (
    <div className="min-h-full bg-white">

      <div className="mx-auto max-w-6xl px-4 pt-2 sm:pt-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 transition hover:text-zinc-900 sm:text-sm"
        >
          <span aria-hidden>←</span>
          All events
        </Link>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 pb-8 pt-2 sm:gap-8 sm:pb-12 sm:pt-3 lg:grid-cols-[60%_40%] lg:items-start">
        {/* Registration form — first on mobile, left column on desktop */}
        <div className="order-1 min-h-0 lg:order-none">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-6">
            {registrationWindow === "open_soon" ? (
              <RegistrationOpensSoonPage />
            ) : registrationStatus === "closed" ? (
              <RegistrationClosedPage />
            ) : (
              <>
                <h2 className="text-xl font-bold text-zinc-900 sm:text-2xl">
                  Register for {event.eventName}
                </h2>
                <p className="mt-2 text-base text-zinc-600 sm:text-lg">
                  Fill in your details to complete registration.
                </p>
                <RegisterForm eventId={eventId} event={serializedEvent} prefilledEmail={email || ""} />
              </>
            )}
          </div>
        </div>

        {/* Event banner + details — after form on mobile, right column on desktop */}
        <div className="order-2 lg:order-none lg:sticky lg:top-6 lg:self-start">
          <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="aspect-[3/2] w-full flex-shrink-0 overflow-hidden bg-zinc-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getEventBannerUrl(event)}
                alt={event.eventName}
                className="h-full w-full object-cover object-top"
              />
            </div>
            <div className="flex min-h-0 flex-1 flex-col justify-between border-t border-zinc-200 p-4 sm:p-6">
              <h1 className="text-xl font-bold leading-tight text-zinc-900 sm:text-2xl">
                {event.eventName}
              </h1>
              {countdownRange ? (
                <EventCountdown
                  startIso={countdownRange.start.toISOString()}
                  endIso={countdownRange.end.toISOString()}
                  initialState={getCountdownState(
                    countdownRange.start.getTime(),
                    countdownRange.end.getTime()
                  )}
                />
              ) : null}
              <dl className="mt-6 flex flex-1 flex-col divide-y divide-zinc-200">
                <div className="flex min-h-[3.5rem] items-center gap-4 py-3">
                  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <dd className="min-w-0 flex-1 text-base font-bold text-zinc-900 sm:text-lg">
                    <span className="sr-only">Date: </span>
                    {formatEventDate(event.eventStartDate)}
                  </dd>
                </div>
                <div className="flex min-h-[3.5rem] items-center gap-4 py-3">
                  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <dd className="min-w-0 flex-1 text-base font-bold text-zinc-900 sm:text-lg">
                    <span className="sr-only">Time: </span>
                    {getEventTimeDisplay(event)}
                  </dd>
                </div>
                {event.venue ? (
                  <div className="flex min-h-[3.5rem] items-center gap-4 py-3">
                    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <dd className="min-w-0 flex-1 text-base font-bold text-zinc-900 sm:text-lg">
                      <span className="sr-only">Venue: </span>
                      {event.venue}
                    </dd>
                  </div>
                ) : null}
                <div className="flex min-h-[3.5rem] items-center gap-4 py-3">
                  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <dd className="min-w-0 flex-1 text-base font-bold text-zinc-900 sm:text-lg">
                    <span className="sr-only">Phone: </span>
                    {event.phone || "—"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
