import { notFound, redirect } from "next/navigation";
import { getPublishedEventByParam } from "@/lib/models/Event";
import { getCanonicalEventPathIfNeeded, getEventPublicSlug } from "@/lib/event-path";
import type { AttendanceRsvpIntent } from "@/lib/attendance-rsvp";
import { ConfirmAttendanceForm } from "./ConfirmAttendanceForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseIntent(value?: string): AttendanceRsvpIntent | null {
  if (value === "attending" || value === "declined") return value;
  return null;
}

export default async function ConfirmAttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ code?: string; intent?: string }>;
}) {
  const { eventId: param } = await params;
  const { code = "", intent: intentRaw } = await searchParams;
  const intent = parseIntent(intentRaw);

  const event = await getPublishedEventByParam(param);
  if (!event) notFound();

  const canonicalPath = getCanonicalEventPathIfNeeded(param, event, "/confirm-attendance");
  if (canonicalPath) {
    const qs = new URLSearchParams();
    if (code) qs.set("code", code);
    if (intentRaw) qs.set("intent", intentRaw);
    const query = qs.toString();
    redirect(query ? `${canonicalPath}?${query}` : canonicalPath);
  }

  if (!code.trim() || !intent) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-xl font-semibold text-zinc-900">Attendance confirmation</h1>
        <p className="mt-3 text-sm text-zinc-600">
          This link is invalid or incomplete. Please use the buttons in your reminder email.
        </p>
      </div>
    );
  }

  const slug = getEventPublicSlug(event);

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:py-14">
      <ConfirmAttendanceForm eventId={slug} code={code.trim()} intent={intent} />
    </div>
  );
}
