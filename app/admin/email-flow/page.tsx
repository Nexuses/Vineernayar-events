import { getAdminFromCookie } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EmailFlowSection } from "./EmailFlowSection";

export default async function EmailFlowPage() {
  const admin = await getAdminFromCookie();
  if (!admin) redirect("/admin/login");

  return (
    <div>
      <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">Email Flow</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Review and edit automated email templates. Changes apply to future emails sent from this
        system.
      </p>
      <EmailFlowSection />
    </div>
  );
}
