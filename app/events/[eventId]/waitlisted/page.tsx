import { notFound, redirect } from "next/navigation";
import { getPublishedEventByParam } from "@/lib/models/Event";
import { getCanonicalEventPathIfNeeded } from "@/lib/event-path";
import { WaitlistThankYouCard } from "../WaitlistThankYouCard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WaitlistedPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId: param } = await params;
  const event = await getPublishedEventByParam(param);
  if (!event) notFound();

  const canonicalPath = getCanonicalEventPathIfNeeded(param, event, "/waitlisted");
  if (canonicalPath) redirect(canonicalPath);

  return <WaitlistThankYouCard />;
}
