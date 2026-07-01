import type { EventDoc } from "@/lib/models/Event";
import { getEventBannerUrl } from "@/lib/models/Event";
import { getEventPublicSlug } from "@/lib/event-path";
import { getEventCountdownRange } from "@/lib/date-utils";
import { hasDescriptionContent } from "@/lib/sanitize-description-html";
import { RegisterForm } from "./register/RegisterForm";
import { CheckEligibleForm } from "./CheckEligibleForm";
import { RegistrationOpensSoonPage, RegistrationClosedPage } from "./RegistrationClosedMessage";
import { RegistrationAgenda } from "./register/RegistrationAgenda";
import { RegistrationEventSidebar } from "./register/RegistrationEventSidebar";
import { StickySidebarShell } from "./register/StickySidebarShell";

export function toPlainEvent(event: EventDoc, registrationStatus: "open" | "closed") {
  return {
    eventId: event.eventId,
    eventName: event.eventName,
    eventBanner: getEventBannerUrl(event),
    eventStartDate:
      event.eventStartDate instanceof Date
        ? event.eventStartDate.toISOString()
        : String(event.eventStartDate),
    eventEndDate:
      event.eventEndDate instanceof Date
        ? event.eventEndDate.toISOString()
        : String(event.eventEndDate),
    venue: event.venue,
    speaker: event.speaker,
    phone: event.phone,
    registrationStatus,
    seatLimit: event.seatLimit,
    registrationType: event.registrationType ?? "open_for_all",
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

type RegistrationHubViewProps = {
  event: EventDoc;
  registrationWindow: "open" | "closed" | "open_soon";
  registrationStatus: "open" | "closed";
  prefilledEmail?: string;
  showWaitlistCard?: boolean;
};

export function RegistrationHubView({
  event,
  registrationWindow,
  registrationStatus,
  prefilledEmail = "",
  showWaitlistCard = false,
}: RegistrationHubViewProps) {
  const publicSlug = getEventPublicSlug(event);
  const countdownRange = getEventCountdownRange(event);
  const serializedEvent = toPlainEvent(event, registrationStatus);
  const agendaItems = event.agenda ?? [];
  const hasAgendaContent =
    agendaItems.length > 0 || hasDescriptionContent(event.description);
  const inviteOnly = event.registrationType === "invitees_only";
  const showEligibilityGate = inviteOnly && !prefilledEmail.trim();

  if (showWaitlistCard) {
    return (
      <div className="min-h-full bg-slate-100">
        <div className="mx-auto max-w-3xl px-5 py-16">
          <div className="rounded-2xl border-2 border-brand-500 bg-white p-8 shadow-[0_12px_40px_rgba(248,232,40,0.22)] sm:p-10">
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
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                Kindly await confirmation of your seat at the event based on limited availability.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-100">
      <div className="mx-auto max-w-[1240px] px-5 py-8 sm:py-10">
        <div className="grid grid-cols-1 gap-9 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <main className="order-2 min-w-0 flex flex-col gap-9 lg:order-1">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] sm:p-8 lg:p-10">
              {registrationWindow === "open_soon" ? (
                <RegistrationOpensSoonPage />
              ) : registrationStatus === "closed" ? (
                <RegistrationClosedPage />
              ) : showEligibilityGate ? (
                <>
                  <div className="mb-6 border-b border-slate-200 pb-5">
                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[28px]">
                      Register to get your ticket
                    </h2>
                    <p className="mt-1.5 text-sm text-slate-500">
                      Enter your invite email to continue registration for {event.eventName}.
                    </p>
                  </div>
                  <CheckEligibleForm eventId={publicSlug} />
                </>
              ) : (
                <>
                  <div className="mb-6 border-b border-slate-200 pb-5">
                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[28px]">
                      Register to get your ticket
                    </h2>
                    <p className="mt-1.5 text-sm text-slate-500">
                      Complete the form below to request your entry pass for {event.eventName}.
                    </p>
                  </div>
                  <RegisterForm
                    eventId={publicSlug}
                    event={serializedEvent}
                    prefilledEmail={prefilledEmail}
                  />
                </>
              )}
            </section>

            <RegistrationAgenda items={agendaItems} description={event.description} />
          </main>

          <aside className="order-1 min-w-0 lg:order-2 lg:h-full">
            <StickySidebarShell>
              <RegistrationEventSidebar
                eventName={event.eventName}
                eventStartDate={
                  event.eventStartDate instanceof Date
                    ? event.eventStartDate
                    : new Date(event.eventStartDate)
                }
                eventEndDate={
                  event.eventEndDate instanceof Date
                    ? event.eventEndDate
                    : new Date(event.eventEndDate)
                }
                eventTime={event.eventTime}
                venue={event.venue}
                phone={event.phone}
                countdownStartIso={countdownRange?.start.toISOString()}
                countdownEndIso={countdownRange?.end.toISOString()}
                hasAgenda={hasAgendaContent}
              />
            </StickySidebarShell>
          </aside>
        </div>
      </div>
    </div>
  );
}
