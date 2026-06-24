"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND_LOGO_URL, BRAND_NAME } from "@/lib/constants";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/events", label: "All Events" },
  { href: "/admin/create-event", label: "Create Event" },
  { href: "/admin/eligible", label: "Eligible Client" },
  { href: "/admin/registrations", label: "Registered Client" },
  { href: "/admin/email-flow", label: "Email Flow" },
  { href: "/admin/scan", label: "QR Scanning" },
];

export function AdminSidebar({
  open = false,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <aside
        className={`admin-sidebar-light fixed inset-y-0 left-0 z-30 flex h-full w-64 flex-col border-r border-zinc-200 bg-white transition-transform duration-200 ease-out md:relative md:translate-x-0 md:shrink-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="admin-header-bar flex items-center justify-center border-b border-zinc-200 px-4">
          <Link
            href="/admin"
            onClick={onClose}
            className="block w-full focus:outline-none focus:ring-2 focus:ring-zinc-400 rounded-md"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BRAND_LOGO_URL}
              alt={`${BRAND_NAME} Logo`}
              className="h-14 w-full object-contain object-center sm:h-16"
            />
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1.5">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              aria-current={active ? "page" : undefined}
              className={`group flex items-center rounded-xl border border-transparent px-3 py-2.5 text-[15px] font-semibold transition-colors ${
                active
                  ? "border-zinc-900/80 bg-zinc-100 text-zinc-900 shadow-sm ring-1 ring-zinc-900/40"
                  : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              <span>{item.label}</span>
            </Link>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
}
