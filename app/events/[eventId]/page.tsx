import { notFound, redirect } from "next/navigation";
import { getPublishedEventByParam, getPublicRegistrationWindowStatus } from "@/lib/models/Event";
import { getCanonicalEventPathIfNeeded, getEventPublicSlug } from "@/lib/event-path";
import { RegistrationHubView } from "./RegistrationHubView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ email?: string; success?: string; waitlisted?: string }>;
}) {
  const { eventId: param } = await params;
  const { email, success, waitlisted } = await searchParams;
  const event = await getPublishedEventByParam(param);
  if (!event) notFound();

  const canonicalPath = getCanonicalEventPathIfNeeded(param, event);
  if (canonicalPath) {
    const slug = getEventPublicSlug(event);
    const qs = new URLSearchParams();
    if (email) qs.set("email", email);
    if (success) qs.set("success", success);
    if (waitlisted) qs.set("waitlisted", waitlisted);
    const query = qs.toString();
    redirect(query ? `${canonicalPath}?${query}` : canonicalPath);
  }

  const registrationWindow = await getPublicRegistrationWindowStatus(event);
  const registrationStatus = registrationWindow === "open" ? "open" : "closed";

  return (
    <RegistrationHubView
      event={event}
      registrationWindow={registrationWindow}
      registrationStatus={registrationStatus}
      prefilledEmail={email || ""}
      showWaitlistCard={waitlisted === "1" || success === "1"}
    />
  );
}
