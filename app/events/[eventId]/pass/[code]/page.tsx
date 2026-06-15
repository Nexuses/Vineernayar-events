import { notFound } from "next/navigation";
import Link from "next/link";
import { getRegistrationByCode } from "@/lib/models/Registration";
import { buildGoogleCalendarUrl, formatEventDateTime, resolveEventEndDate } from "@/lib/date-utils";
import { BRAND_LOGO_URL, BRAND_NAME } from "@/lib/constants";
import { PassActions } from "./PassActions";

function formatRegisteredDate(d: Date | string) {
  if (!d) return "—";
  return new Date(d).toISOString().replace("T", " ").slice(0, 19);
}

function capitalizeFirst(s: string) {
  const text = String(s || "").trim();
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export default async function PassPage({
  params,
}: {
  params: Promise<{ eventId: string; code: string }>;
}) {
  const { eventId, code } = await params;
  const reg = await getRegistrationByCode(code);
  if (!reg) notFound();

  const qrUrl = `/api/qr?code=${encodeURIComponent(reg.uniqueCode)}`;
  const firstName = capitalizeFirst(reg.firstName);
  const surname = capitalizeFirst(reg.surname);
  const eventEndDate = resolveEventEndDate(reg.eventStartDate, reg.eventEndDate);

  const calendarUrl = buildGoogleCalendarUrl({
    title: reg.eventName,
    start: reg.eventStartDate,
    end: eventEndDate,
    details: `Venue: ${reg.venue}`,
    location: reg.venue,
  });

  return (
    <div className="min-h-full bg-white py-6 sm:py-12">
      <div className="mx-auto max-w-2xl px-4">
        <Link
          href="/"
          className="no-print mb-4 inline-block text-sm font-medium text-zinc-600 hover:text-zinc-900 sm:mb-6"
        >
          ← Back to events
        </Link>

        <p className="no-print mb-3 text-sm text-zinc-600 sm:mb-4">
          Your pass has been sent to your email.
        </p>

        {/* DISPLAY CARD (screen only - hidden when printing) */}
        <div
          className="no-print overflow-hidden border border-black bg-white p-3 sm:p-4"
        >
          <div className="w-full">
            {/* Top row: Logo left, QR + code right */}
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="w-full min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={BRAND_LOGO_URL}
                  alt={BRAND_NAME}
                  className="h-11 w-auto max-w-full object-contain sm:h-[52px]"
                />
                <p className="mt-3 text-lg font-bold text-zinc-900">
                  Welcome,
                </p>
                <h1 className="mt-1 text-2xl font-bold text-zinc-900">
                  {firstName} {surname}
                </h1>
                <p className="mt-2 text-base text-zinc-900">{reg.mobileNumber}</p>
                <p className="mt-0.5 text-base text-zinc-900">{reg.email}</p>
              </div>
              <div className="flex shrink-0 flex-col items-center self-center sm:self-auto">
                <div className="rounded border-2 border-brand-500 p-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrUrl}
                    alt={`QR code ${reg.uniqueCode}`}
                    width={140}
                    height={140}
                    className="block h-28 w-28 sm:h-[140px] sm:w-[140px]"
                  />
                </div>
                <p className="mt-2 font-mono text-sm font-bold text-zinc-900">
                  {reg.uniqueCode}
                </p>
              </div>
            </div>

            {/* Event details */}
            <div className="mt-5">
              <h2 className="max-w-[calc(100%-30px)] text-lg font-bold leading-tight text-zinc-900">
                {reg.eventName}
              </h2>
              <dl className="mt-3 space-y-2 text-base text-zinc-900">
                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-6">
                  <dt className="min-w-0 shrink-0 font-medium">Start Date</dt>
                  <dd className="sm:flex-1 sm:text-center">{formatEventDateTime(reg.eventStartDate)}</dd>
                </div>
                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-6">
                  <dt className="min-w-0 shrink-0 font-medium">End Date</dt>
                  <dd className="sm:flex-1 sm:text-center">{formatEventDateTime(eventEndDate)}</dd>
                </div>
                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-6">
                  <dt className="min-w-0 shrink-0 font-medium">Venue</dt>
                  <dd className="sm:flex-1 sm:text-center">{reg.venue || "—"}</dd>
                </div>
              </dl>
            </div>

            {/* Registered date */}
            <p className="mt-6 text-sm text-zinc-900">
              Registered Date – {formatRegisteredDate(reg.createdAt)}
            </p>
          </div>
        </div>

        {/* PRINT PASS (58mm×40mm - only visible when printing) */}
        <div
          id="event-pass"
          className="hidden print:!block print:!m-0 print:!h-[40mm] print:!w-[58mm] print:!max-w-[58mm] print:!overflow-hidden print:!rounded-none print:!p-2 print:!shadow-none print:!bg-white"
        >
          <div className="print:!flex print:!h-full print:!flex-col print:!items-center print:!justify-center print:!text-center">
            {/* 3-row name layout for print:
                Row 1: First name only (bold)
                Row 2: Last name only
                Row 3: Company name only */}
            <p className="print:!text-[25px] print:!font-bold print:!text-black">
              {firstName}
            </p>
            <p className="print:!mt-0.5 print:!text-[25px] print:!font-bold print:!text-black">
              {surname}
            </p>
            <p className="print:!mt-2 print:!text-[18px] print:!font-normal print:!text-black">
              {(reg.organization || "—").toUpperCase()}
            </p>
          </div>
        </div>

        <PassActions calendarUrl={calendarUrl} />
      </div>
    </div>
  );
}
