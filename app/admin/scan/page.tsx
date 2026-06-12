import { getAdminFromCookie } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ScanSection } from "./ScanSection";

export default async function QRScanPage() {
  const admin = await getAdminFromCookie();
  if (!admin) redirect("/admin/login");

  return (
    <div>
      <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">
        QR Scanning
      </h1>
      <p className="mt-1 text-sm text-zinc-600">
        Scan a pass QR code at the event to mark that client as attended.
      </p>
      <ScanSection />
    </div>
  );
}
