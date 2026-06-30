import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import {
  getEventBannerUrl,
  getPublicRegistrationWindowStatus,
  getPublicRegistrationWindowLabel,
} from "@/lib/models/Event";
import { getPublishedEventByEventId } from "@/lib/models/Event";
import { getCountdownState } from "@/lib/countdown";
import { formatEventDate, getEventTimeDisplay, getEventCountdownRange } from "@/lib/date-utils";
import { CheckEligibleForm } from "./CheckEligibleForm";
import { RegistrationClosedCard, RegistrationOpensSoonCard } from "./RegistrationClosedMessage";
import { EventDescription } from "./EventDescription";
import { hasDescriptionContent } from "@/lib/sanitize-description-html";
import { CalendarIcon, ClockIcon, MapPinIcon } from "@/app/events/EventIcons";
import { getRegistrationWindowBadgeClass } from "@/lib/registration-window";
import { EventCountdown } from "./register/EventCountdown";
import { BannerImageWithHighlight } from "@/app/components/BannerImageWithHighlight";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function shareUrl(baseUrl: string, path: string, title: string) {
  const url = (baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl) + path;
  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(title + " " + url)}`,
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
  };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await getPublishedEventByEventId(eventId);
  if (!event) notFound();
  const registrationWindow = await getPublicRegistrationWindowStatus(event);
  const registrationStatus = registrationWindow === "open" ? "open" : "closed";

  const path = `/events/${event.eventId}`;
  const title = event.eventName;
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const protocol = headersList.get("x-forwarded-proto") || "https";
  const baseUrl =
    process.env.SITE_URL ||
    (host ? `${protocol}://${host}` : "http://localhost:3000");
  const links = shareUrl(baseUrl, path, title);
  const descriptionText = event.description?.trim() ?? "";
  const showDescription = hasDescriptionContent(descriptionText);
  const countdownRange = getEventCountdownRange(event);

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
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-4 pt-2 sm:gap-8 sm:pb-6 sm:pt-3 lg:grid lg:grid-cols-3 lg:items-start">
        {/* Left: banner, about, share — mobile orders 1, 4, 5; desktop stacked in one column */}
        <div className="contents lg:col-span-2 lg:flex lg:flex-col lg:gap-8">
          <div className="order-1 lg:order-none">
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
              <div className="aspect-[3/2] w-full overflow-hidden bg-zinc-100">
                <BannerImageWithHighlight
                  src={getEventBannerUrl(event)}
                  alt={event.eventName}
                  label=""
                  size="medium"
                  className="h-full"
                />
              </div>
              <div className="border-t border-zinc-200 p-4 sm:p-6">
                <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">
                  {event.eventName}
                </h1>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-600 sm:mt-4 sm:gap-x-6">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarIcon className="h-4 w-4 shrink-0 text-zinc-400" />
                    {formatEventDate(event.eventStartDate)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <ClockIcon className="h-4 w-4 shrink-0 text-zinc-400" />
                    {getEventTimeDisplay(event)}
                  </span>
                  {event.venue ? (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPinIcon className="h-4 w-4 shrink-0 text-zinc-400" />
                      {event.venue}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {showDescription ? (
            <div className="order-4 lg:order-none">
              <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-6">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                  ABOUT EVENT
                </h2>
                <EventDescription text={descriptionText} />
              </div>
            </div>
          ) : null}

          <div className="order-5 lg:order-none">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500 sm:mb-4">
                Share this event
              </h2>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <a
                  href={links.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors hover:bg-brand-100 hover:text-brand-500"
                  aria-label="Share on Facebook"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a
                  href={links.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors hover:bg-brand-100 hover:text-brand-500"
                  aria-label="Share on Twitter"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a
                  href={links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors hover:bg-brand-100 hover:text-brand-500"
                  aria-label="Share on LinkedIn"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a
                  href={links.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors hover:bg-brand-100 hover:text-brand-500"
                  aria-label="Share on WhatsApp"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>
                <a
                  href={links.email}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors hover:bg-brand-100 hover:text-brand-500"
                  aria-label="Share by email"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right: register + event details — mobile orders 2, 3; desktop sticky sidebar */}
        <div className="contents lg:col-span-1 lg:sticky lg:top-6 lg:flex lg:flex-col lg:gap-6">
          <div className="order-2 lg:order-none">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-6">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900">
                Register to get your ticket
              </h2>
              {registrationWindow === "open_soon" ? (
                <RegistrationOpensSoonCard />
              ) : registrationStatus === "closed" ? (
                <RegistrationClosedCard />
              ) : (
                <CheckEligibleForm eventId={event.eventId} />
              )}
            </div>
          </div>

          <div className="order-3 lg:order-none">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 sm:p-7">
              <div className="mb-4 flex items-center justify-between gap-2 sm:mb-5">
                <h2 className="text-xl font-semibold text-zinc-900">
                  Event Details
                </h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium sm:text-sm ${getRegistrationWindowBadgeClass(registrationWindow)}`}
                >
                  {getPublicRegistrationWindowLabel(registrationWindow)}
                </span>
              </div>
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
              <dl className="mt-5 space-y-5 text-base">
                <div>
                  <dt className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500 sm:text-sm">Date</dt>
                  <dd className="text-zinc-900">{formatEventDate(event.eventStartDate)}</dd>
                </div>
                <div>
                  <dt className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500 sm:text-sm">Time</dt>
                  <dd className="text-zinc-900">{getEventTimeDisplay(event)}</dd>
                </div>
                {event.venue ? (
                  <div>
                    <dt className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500 sm:text-sm">Venue</dt>
                    <dd className="text-zinc-900">{event.venue}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500 sm:text-sm">Speakers</dt>
                  <dd className="text-zinc-900">{event.speaker || "—"}</dd>
                </div>
                <div>
                  <dt className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500 sm:text-sm">Phone</dt>
                  <dd className="text-zinc-900">{event.phone || "—"}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
