import { getAdminSession, listEventsForAdmin } from "@/lib/admin-access";
import { groupEventsByCity } from "@/lib/admin-city-dashboard";
import { navItemsForAdmin } from "@/lib/admin-nav";
import { AdminShell } from "./components/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  const cities = session ? groupEventsByCity(await listEventsForAdmin(session)) : [];

  return (
    <div
      className={
        session
          ? "admin-light h-screen overflow-hidden bg-zinc-50"
          : "admin-light min-h-screen bg-zinc-50"
      }
    >
      {session ? (
        <AdminShell
          email={session.email}
          name={session.name}
          navItems={navItemsForAdmin(session, cities)}
        >
          {children}
        </AdminShell>
      ) : null}
      {!session ? <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</main> : null}
    </div>
  );
}
