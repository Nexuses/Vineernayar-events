import type { AdminDoc } from "./models/Admin";
import { isSubManager, isSuperAdmin, canManualRegister } from "./models/Admin";
import type { AdminCityDashboard } from "./admin-city-dashboard";

export type NavItem = {
  href: string;
  label: string;
  superadminOnly?: boolean;
  subManagerHidden?: boolean;
  requiresManualRegister?: boolean;
  children?: NavItem[];
};

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "User Management", superadminOnly: true },
  { href: "/admin/events", label: "All Events" },
  { href: "/admin/create-event", label: "Create Event", superadminOnly: true },
  { href: "/admin/waitlist", label: "Waitlist Client" },
  { href: "/admin/rejected", label: "Rejected Client" },
  { href: "/admin/manual-register", label: "Manual Register", requiresManualRegister: true },
  { href: "/admin/registrations", label: "Registered Client" },
  { href: "/admin/reconfirm", label: "Reconfirm", subManagerHidden: true },
  { href: "/admin/secondary-confirm", label: "Reconfirm 2", subManagerHidden: true },
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
  { href: "/admin/email-stats", label: "Email Stats" },
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
  const permitted = scoped.filter(
    (item) => !item.requiresManualRegister || canManualRegister(admin)
  );

  return permitted.map((item) => {
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
