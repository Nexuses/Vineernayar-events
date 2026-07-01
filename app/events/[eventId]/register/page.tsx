import { notFound, redirect } from "next/navigation";
import { getPublishedEventByParam } from "@/lib/models/Event";
import { getCanonicalEventPathIfNeeded, getEventPublicSlug } from "@/lib/event-path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RegisterPage({
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

  const slug = getEventPublicSlug(event);
  const qs = new URLSearchParams();
  if (email) qs.set("email", email);
  if (success) qs.set("success", success);
  if (waitlisted) qs.set("waitlisted", waitlisted);
  const query = qs.toString();
  const target = query ? `/events/${slug}?${query}` : `/events/${slug}`;

  const canonicalPath = getCanonicalEventPathIfNeeded(param, event);
  if (canonicalPath) {
    redirect(query ? `${canonicalPath}?${query}` : canonicalPath);
  }

  redirect(target);
}
