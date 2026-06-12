import { getAdminFromCookie } from "@/lib/auth";
import { AdminShell } from "./components/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminFromCookie();

  return (
    <div
      className={
        admin
          ? "admin-light h-screen overflow-hidden bg-zinc-50"
          : "admin-light min-h-screen bg-zinc-50"
      }
    >
      {admin ? (
        <AdminShell email={admin.email}>{children}</AdminShell>
      ) : null}
      {!admin ? <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</main> : null}
    </div>
  );
}
