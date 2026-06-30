import type { AdminDoc } from "./models/Admin";
import { isSuperAdmin } from "./models/Admin";

export type NavItem = {
  href: string;
  label: string;
  superadminOnly?: boolean;
};

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "User Management", superadminOnly: true },
  { href: "/admin/events", label: "All Events" },
  { href: "/admin/create-event", label: "Create Event", superadminOnly: true },
  { href: "/admin/eligible", label: "Eligible Client" },
  { href: "/admin/waitlist", label: "Waitlist Client" },
  { href: "/admin/registrations", label: "Registered Client" },
  { href: "/admin/email-flow", label: "Email Flow", superadminOnly: true },
  { href: "/admin/email-blast", label: "Email Blast" },
  { href: "/admin/scan", label: "QR Scanning" },
];

export function navItemsForAdmin(admin: AdminDoc): NavItem[] {
  if (isSuperAdmin(admin)) return ADMIN_NAV_ITEMS;
  return ADMIN_NAV_ITEMS.filter((item) => !item.superadminOnly);
}
