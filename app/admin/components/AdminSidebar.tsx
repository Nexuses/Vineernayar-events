"use client";

import Link from "next/link";
import { useState } from "react";
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

function isSectionActive(pathname: string, item: NavItem): boolean {
  if (item.href === "/admin") {
    return pathname === "/admin" || pathname.startsWith("/admin/cities/");
  }
  if (pathname === item.href || pathname.startsWith(`${item.href}/`)) return true;
  return (item.children ?? []).some(
    (child) => pathname === child.href || pathname.startsWith(`${child.href}/`)
  );
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

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const closeAllNested = () => setExpandedSections({});

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
              closeAllNested();
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
              const parentActive = isSectionActive(pathname, item);
              const isExpanded = expandedSections[item.href] ?? false;

              if (!hasChildren) {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      closeAllNested();
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
                      if (isExpanded && parentActive) {
                        e.preventDefault();
                        setExpandedSections((prev) => ({ ...prev, [item.href]: false }));
                      } else {
                        setExpandedSections((prev) => ({ ...prev, [item.href]: true }));
                      }
                      onClose?.();
                    }}
                    aria-current={parentActive && pathname === item.href ? "page" : undefined}
                    aria-expanded={isExpanded}
                    className={`${linkClass(parentActive)} w-full justify-between`}
                  >
                    <span>{item.label}</span>
                    <svg
                      className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
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
                  {isExpanded ? (
                    <div className="ml-3 space-y-0.5 border-l border-zinc-200 pl-2">
                      {item.children!.map((child) => {
                        const childActive = isActive(child.href);
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => {
                              setExpandedSections((prev) => ({ ...prev, [item.href]: true }));
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
