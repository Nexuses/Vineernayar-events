import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getEventBannerUrl,
  getEffectiveRegistrationStatus,
} from "@/lib/models/Event";
import { getPublishedEventByEventId } from "@/lib/models/Event";
import type { EventDoc } from "@/lib/models/Event";
import { formatEventDateTime, resolveEventEndDate } from "@/lib/date-utils";
import { RegisterForm } from "./RegisterForm";
import { RegistrationClosedPage } from "../RegistrationClosedMessage";
import { EventPublicHeader } from "../EventPublicHeader";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function toPlainEvent(event: EventDoc) {
  const registrationStatus = getEffectiveRegistrationStatus(event);
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
  const registrationStatus = getEffectiveRegistrationStatus(event);
  const eventEndDate = resolveEventEndDate(event.eventStartDate, event.eventEndDate);

  const serializedEvent = toPlainEvent(event);

  return (
    <div className="min-h-full bg-white">
      <EventPublicHeader />
      <div className="mx-auto max-w-6xl px-4 py-4 sm:py-6">
        <Link
          href={`/events/${eventId}`}
          className="mb-4 inline-block text-sm font-medium text-zinc-600 hover:text-zinc-900 sm:mb-6"
        >
          ← Back to event
        </Link>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 pb-8 sm:gap-8 sm:pb-12 lg:grid-cols-[60%_40%] lg:items-stretch">
        {/* Left: Registration form (60%) or closed message */}
        <div className="order-2 min-h-0 lg:order-1">
          <div className="h-full rounded-xl border border-zinc-200 bg-white p-4 sm:p-6">
            {registrationStatus === "closed" ? (
              <RegistrationClosedPage />
            ) : (
              <>
                <h2 className="text-lg font-bold text-zinc-900 sm:text-xl">
                  Register for {event.eventName}
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Fill in your details to complete registration.
                </p>
                <RegisterForm eventId={eventId} event={serializedEvent} prefilledEmail={email || ""} />
              </>
            )}
          </div>
        </div>

        {/* Right: Event details (40%) - stretches to match form height */}
        <div className="order-1 min-h-0 lg:order-2">
          <div className="sticky top-4 flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm sm:top-6">
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
              <dl className="mt-6 flex flex-1 flex-col divide-y divide-zinc-200">
                <div className="flex flex-1 min-h-[4rem] items-center gap-4">
                  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <dt className="text-base font-medium uppercase tracking-wider text-zinc-500">Start date</dt>
                    <dd className="mt-1.5 text-lg font-medium text-zinc-900">{formatEventDateTime(event.eventStartDate)}</dd>
                  </div>
                </div>
                <div className="flex flex-1 min-h-[4rem] items-center gap-4">
                  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <dt className="text-base font-medium uppercase tracking-wider text-zinc-500">End date</dt>
                    <dd className="mt-1.5 text-lg font-medium text-zinc-900">{formatEventDateTime(eventEndDate)}</dd>
                  </div>
                </div>
                {event.venue ? (
                  <div className="flex flex-1 min-h-[4rem] items-center gap-4">
                    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <dt className="text-base font-medium uppercase tracking-wider text-zinc-500">Venue</dt>
                      <dd className="mt-1.5 text-lg font-medium text-zinc-900">{event.venue}</dd>
                    </div>
                  </div>
                ) : null}
                <div className="flex flex-1 min-h-[4rem] items-center gap-4">
                  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <dt className="text-base font-medium uppercase tracking-wider text-zinc-500">Phone</dt>
                    <dd className="mt-1.5 text-lg font-medium text-zinc-900">{event.phone || "—"}</dd>
                  </div>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
