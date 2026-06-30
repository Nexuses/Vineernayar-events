import { getAdminSession } from "@/lib/admin-access";
import { navItemsForAdmin } from "@/lib/admin-nav";
import { AdminShell } from "./components/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

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
          navItems={navItemsForAdmin(session)}
        >
          {children}
        </AdminShell>
      ) : null}
      {!session ? <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</main> : null}
    </div>
  );
}
