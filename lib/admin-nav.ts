import type { AdminDoc } from "./models/Admin";
import { isSuperAdmin } from "./models/Admin";
import type { AdminCityDashboard } from "./admin-city-dashboard";

export type NavItem = {
  href: string;
  label: string;
  superadminOnly?: boolean;
  children?: NavItem[];
};

export const ADMIN_NAV_ITEMS: Omit<NavItem, "children">[] = [
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

export function navItemsForAdmin(
  admin: AdminDoc,
  cities: AdminCityDashboard[] = []
): NavItem[] {
  const base = isSuperAdmin(admin)
    ? ADMIN_NAV_ITEMS
    : ADMIN_NAV_ITEMS.filter((item) => !item.superadminOnly);

  return base.map((item) => {
    if (item.href !== "/admin" || cities.length === 0) return item;

    return {
      ...item,
      children: [
        { href: "/admin", label: "All cities" },
        ...cities.map((city) => ({
          href: `/admin/cities/${city.slug}`,
          label: city.label,
        })),
      ],
    };
  });
}
