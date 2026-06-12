import { getAdminFromCookie } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EligibleClientSection } from "./EligibleClientSection";

export default async function EligibleClientPage() {
  const admin = await getAdminFromCookie();
  if (!admin) redirect("/admin/login");

  return (
    <div>
      <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">
        Eligible Client
      </h1>
      <p className="mt-1 text-sm text-zinc-600">
        Select an event, then manage which emails can register for that event (invitees only). Only these emails will pass the Check step for that event.
      </p>
      <EligibleClientSection />
    </div>
  );
}
