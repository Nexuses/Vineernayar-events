import type { AdminDoc } from "./models/Admin";
import { isSubManager, isSuperAdmin } from "./models/Admin";
import type { AdminCityDashboard } from "./admin-city-dashboard";

export type NavItem = {
  href: string;
  label: string;
  superadminOnly?: boolean;
  subManagerHidden?: boolean;
  children?: NavItem[];
};

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "User Management", superadminOnly: true },
  { href: "/admin/events", label: "All Events" },
  { href: "/admin/create-event", label: "Create Event", superadminOnly: true },
  { href: "/admin/waitlist", label: "Waitlist Client" },
  { href: "/admin/registrations", label: "Registered Client" },
  {
    href: "/admin/messaging-flow",
    label: "Messaging Flow",
    superadminOnly: true,
    children: [
      { href: "/admin/messaging-flow/email", label: "Email Flow" },
      { href: "/admin/messaging-flow/whatsapp", label: "WhatsApp Flow" },
    ],
  },
  { href: "/admin/email-blast", label: "Email Blast", subManagerHidden: true },
  { href: "/admin/scan", label: "QR Scanning", subManagerHidden: true },
];

export function navItemsForAdmin(
  admin: AdminDoc,
  cities: AdminCityDashboard[] = []
): NavItem[] {
  const base = isSuperAdmin(admin)
    ? ADMIN_NAV_ITEMS
    : ADMIN_NAV_ITEMS.filter((item) => !item.superadminOnly);
  const scoped = isSubManager(admin) ? base.filter((item) => !item.subManagerHidden) : base;

  return scoped.map((item) => {
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
