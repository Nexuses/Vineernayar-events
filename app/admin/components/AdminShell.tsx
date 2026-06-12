"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminSidebar } from "./AdminSidebar";
import { LogoutButton } from "./LogoutButton";

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-full overflow-hidden">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {/* Mobile overlay when sidebar is open */}
      {sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          aria-label="Close menu"
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col overflow-auto">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-zinc-200 bg-white px-3 sm:h-20 sm:justify-end sm:px-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 md:hidden"
            aria-label="Open menu"
          >
            <MenuIcon className="h-6 w-6" />
          </button>
          <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
            <span className="truncate text-sm text-zinc-600" title={email}>
              {email}
            </span>
            <LogoutButton />
          </div>
        </header>
        <main className="min-h-0 shrink-0 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
