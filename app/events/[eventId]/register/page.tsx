import { notFound, redirect } from "next/navigation";
import { getPublishedEventByParam } from "@/lib/models/Event";
import { getCanonicalEventPathIfNeeded, getEventPublicPath, getEventWaitlistedPath } from "@/lib/event-path";

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

  if (waitlisted === "1" || success === "1") {
    redirect(getEventWaitlistedPath(event));
  }

  const qs = new URLSearchParams();
  if (email) qs.set("email", email);
  const query = qs.toString();
  const target = query ? `${getEventPublicPath(event)}?${query}` : getEventPublicPath(event);

  const canonicalPath = getCanonicalEventPathIfNeeded(param, event);
  if (canonicalPath) {
    redirect(query ? `${canonicalPath}?${query}` : canonicalPath);
  }

  redirect(target);
}
