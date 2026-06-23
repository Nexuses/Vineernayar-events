import { notFound } from "next/navigation";
import Link from "next/link";
import { getRegistrationByCode } from "@/lib/models/Registration";
import { getPublishedEventByEventId } from "@/lib/models/Event";
import { formatEventDate, formatRegisteredDate, getEventTimeDisplay } from "@/lib/date-utils";
import { BRAND_LOGO_URL, BRAND_NAME } from "@/lib/constants";
import { CalendarIcon, ClockIcon, MapPinIcon } from "@/app/events/EventIcons";
import { PassActions } from "./PassActions";

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

  const event = await getPublishedEventByEventId(eventId);
  const showPassQr = event?.showPassQr !== false;

  const qrUrl = `/api/qr?code=${encodeURIComponent(reg.uniqueCode)}`;
  const firstName = capitalizeFirst(reg.firstName);
  const surname = capitalizeFirst(reg.surname);

  return (
    <div className="min-h-screen bg-zinc-50 py-6 sm:py-10">
      <div className="pass-page-wrap mx-auto max-w-xl px-4">
        <Link
          href="/"
          className="no-print mb-4 inline-block text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          ← Back to events
        </Link>

        <p className="no-print mb-4 text-sm text-zinc-600">
          Your pass has been sent to your email.
        </p>

        <div
          id="event-pass"
          className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg print:rounded-xl print:border-zinc-300 print:shadow-none"
        >
          <div className="flex items-center justify-between bg-brand-500 px-4 py-2.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-900">
              Event Pass
            </span>
            <span className="font-mono text-[11px] font-bold text-zinc-800">{reg.uniqueCode}</span>
          </div>

          <div className="p-4">
            <div className={showPassQr ? "grid grid-cols-[1fr_auto] items-start gap-3" : ""}>
              <div className="min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={BRAND_LOGO_URL}
                  alt={BRAND_NAME}
                  className="h-14 w-auto max-w-[220px] object-contain sm:h-16"
                />
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Welcome
                </p>
                <h1 className="mt-0.5 text-xl font-bold leading-tight text-zinc-900">
                  {firstName} {surname}
                </h1>
                <p className="mt-1.5 text-sm text-zinc-700">{reg.mobileNumber}</p>
                <p className="truncate text-sm text-zinc-600">{reg.email}</p>
              </div>

              {showPassQr ? (
                <div className="shrink-0 rounded-lg border-2 border-brand-500 bg-white p-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrUrl}
                    alt={`QR code ${reg.uniqueCode}`}
                    width={112}
                    height={112}
                    className="block h-28 w-28"
                  />
                </div>
              ) : null}
            </div>

            <div className="mt-3 rounded-xl border border-brand-200 bg-brand-50/70 p-3">
              <h2 className="text-base font-bold leading-snug text-zinc-900">{reg.eventName}</h2>
              <dl className="mt-2.5 space-y-2 text-sm text-zinc-800">
                <div className="flex items-start gap-2.5">
                  <CalendarIcon className="mt-0.5 h-4 w-4 text-zinc-500" />
                  <dd className="min-w-0 flex-1 leading-snug">{formatEventDate(reg.eventStartDate)}</dd>
                </div>
                <div className="flex items-start gap-2.5">
                  <ClockIcon className="mt-0.5 h-4 w-4 text-zinc-500" />
                  <dd className="min-w-0 flex-1 leading-snug">{getEventTimeDisplay(reg)}</dd>
                </div>
                <div className="flex items-start gap-2.5">
                  <MapPinIcon className="mt-0.5 h-4 w-4 text-zinc-500" />
                  <dd className="min-w-0 flex-1 leading-snug">{reg.venue || "—"}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-2 text-[11px] text-zinc-500">
            Registered {formatRegisteredDate(reg.createdAt)}
          </div>
        </div>

        <PassActions passCode={reg.uniqueCode} />
      </div>
    </div>
  );
}
