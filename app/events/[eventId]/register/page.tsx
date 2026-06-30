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
import { BannerImageWithHighlight } from "@/app/components/BannerImageWithHighlight";
import { CalendarIcon, ClockIcon, DirectionsIcon, MapPinIcon, PhoneIcon } from "@/app/events/EventIcons";
import { buildGoogleMapsDirectionsUrl } from "@/lib/google-maps";

function buildTelUrl(phone: string): string {
  const trimmed = phone.trim();
  const normalized = trimmed.replace(/[^\d+]/g, "");
  return `tel:${normalized || trimmed}`;
}

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

const iconWrapClass =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500 text-zinc-900 shadow-sm shadow-brand-200/60";
const iconInnerClass = "h-6 w-6";

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ email?: string; success?: string; waitlisted?: string }>;
}) {
  const { eventId } = await params;
  const { email, success, waitlisted } = await searchParams;
  const event = await getPublishedEventByEventId(eventId);
  if (!event) notFound();
  const registrationWindow = await getPublicRegistrationWindowStatus(event);
  const registrationStatus = registrationWindow === "open" ? "open" : "closed";
  const countdownRange = getEventCountdownRange(event);

  const serializedEvent = toPlainEvent(event, registrationStatus);
  const showWaitlistCard = waitlisted === "1" || success === "1";

  if (showWaitlistCard) {
    return (
      <div className="min-h-full bg-white">
        <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:pb-16 sm:pt-12">
          <div className="mx-auto flex min-h-[55vh] items-center justify-center">
            <div className="w-full max-w-xl rounded-2xl border-2 border-brand-500 bg-white p-6 shadow-[0_12px_40px_rgba(248,232,40,0.22)] ring-1 ring-brand-200 sm:p-8">
              <div className="mx-auto flex max-w-xl flex-col items-center text-center">
                <div className="relative mb-5 flex h-24 w-24 items-center justify-center">
                  <span className="absolute inline-flex h-20 w-20 rounded-full bg-brand-100" />
                  <span className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 shadow-lg shadow-brand-200/70">
                    <svg className="h-9 w-9 text-zinc-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-zinc-900">
                  Welcome to the Humans First Movement!
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600 sm:text-base">
                  Kindly await confirmation of your seat at the event based on limited availability.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              <BannerImageWithHighlight
                src={getEventBannerUrl(event)}
                alt={event.eventName}
                label=""
                size="medium"
                className="h-full"
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
                  <span className={iconWrapClass} aria-hidden>
                    <CalendarIcon className={iconInnerClass} />
                  </span>
                  <dd className="min-w-0 flex-1 text-base font-bold text-zinc-900 sm:text-lg">
                    <span className="sr-only">Date: </span>
                    {formatEventDate(event.eventStartDate)}
                  </dd>
                </div>
                <div className="flex min-h-[3.5rem] items-center gap-4 py-3">
                  <span className={iconWrapClass} aria-hidden>
                    <ClockIcon className={iconInnerClass} />
                  </span>
                  <dd className="min-w-0 flex-1 text-base font-bold text-zinc-900 sm:text-lg">
                    <span className="sr-only">Time: </span>
                    {getEventTimeDisplay(event)}
                  </dd>
                </div>
                {event.venue ? (
                  <div className="flex min-h-[3.5rem] items-center gap-4 py-3">
                    <span className={iconWrapClass} aria-hidden>
                      <MapPinIcon className={iconInnerClass} />
                    </span>
                    <dd className="flex min-w-0 flex-1 items-center justify-between gap-3 text-base font-bold text-zinc-900 sm:text-lg">
                      <span className="min-w-0">
                        <span className="sr-only">Venue: </span>
                        {event.venue}
                      </span>
                      <a
                        href={buildGoogleMapsDirectionsUrl(event.venue)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-xs font-semibold text-zinc-900 shadow-sm shadow-brand-200/70 transition hover:bg-brand-600 hover:shadow-md active:scale-[0.98] sm:text-sm"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900/10">
                          <DirectionsIcon className="h-3.5 w-3.5 text-zinc-900" />
                        </span>
                        Directions
                      </a>
                    </dd>
                  </div>
                ) : null}
                <div className="flex min-h-[3.5rem] items-center gap-4 py-3">
                  <span className={iconWrapClass} aria-hidden>
                    <PhoneIcon className={iconInnerClass} />
                  </span>
                  <dd className="flex min-w-0 flex-1 items-center justify-between gap-3 text-base font-bold text-zinc-900 sm:text-lg">
                    <span className="min-w-0">
                      <span className="sr-only">Phone: </span>
                      {event.phone || "—"}
                    </span>
                    {event.phone ? (
                      <a
                        href={buildTelUrl(event.phone)}
                        className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-xs font-semibold text-zinc-900 shadow-sm shadow-brand-200/70 transition hover:bg-brand-600 hover:shadow-md active:scale-[0.98] sm:text-sm"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900/10">
                          <PhoneIcon className="h-3.5 w-3.5 text-zinc-900" />
                        </span>
                        Call
                      </a>
                    ) : null}
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
