"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BRAND_LOGO_URL, BRAND_NAME } from "@/lib/constants";
import type { NavItem } from "@/lib/admin-nav";

function linkClass(active: boolean, nested = false) {
  return `group flex items-center rounded-xl border border-transparent text-left font-semibold transition-colors ${
    nested ? "px-2.5 py-2 text-sm" : "px-3 py-2.5 text-[15px]"
  } ${
    active
      ? "border-zinc-900/80 bg-zinc-100 text-zinc-900 shadow-sm ring-1 ring-zinc-900/40"
      : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
  }`;
}

export function AdminSidebar({
  navItems,
  open = false,
  onClose,
}: {
  navItems: NavItem[];
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isDashboardSection =
    pathname === "/admin" || pathname.startsWith("/admin/cities/");

  const [dashboardExpanded, setDashboardExpanded] = useState(isDashboardSection);

  useEffect(() => {
    setDashboardExpanded(isDashboardSection);
  }, [isDashboardSection]);

  const closeNestedNav = () => setDashboardExpanded(false);

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
            onClick={() => {
              setDashboardExpanded(true);
              onClose?.();
            }}
            className="block w-full rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-400"
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
              const hasChildren = (item.children?.length ?? 0) > 0;
              const parentActive =
                item.href === "/admin" ? isDashboardSection : isActive(item.href);

              if (!hasChildren) {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      closeNestedNav();
                      onClose?.();
                    }}
                    aria-current={active ? "page" : undefined}
                    className={linkClass(active)}
                  >
                    <span>{item.label}</span>
                  </Link>
                );
              }

              return (
                <div key={item.href} className="space-y-1">
                  <Link
                    href={item.href}
                    onClick={(e) => {
                      if (dashboardExpanded) {
                        e.preventDefault();
                        setDashboardExpanded(false);
                      } else {
                        setDashboardExpanded(true);
                      }
                      onClose?.();
                    }}
                    aria-current={pathname === "/admin" ? "page" : undefined}
                    aria-expanded={dashboardExpanded}
                    className={`${linkClass(parentActive)} w-full justify-between`}
                  >
                    <span>{item.label}</span>
                    <svg
                      className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 ${
                        dashboardExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </Link>
                  {dashboardExpanded ? (
                    <div className="ml-3 space-y-0.5 border-l border-zinc-200 pl-2">
                      {item.children!.map((child) => {
                        const childActive = isActive(child.href);
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => {
                              setDashboardExpanded(true);
                              onClose?.();
                            }}
                            aria-current={childActive ? "page" : undefined}
                            className={linkClass(childActive, true)}
                          >
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
}
