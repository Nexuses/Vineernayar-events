"use client";

import { usePathname } from "next/navigation";
import {
  HumansFirstNavbar,
  HumansFirstNavbarSpacer,
  HUMANS_FIRST_NAVBAR_CONFIG,
  type HumansFirstNavbarConfig,
} from "@/app/components/HumansFirstNavbar";
import { MARKETING_SITE_URL } from "@/lib/marketing-site";

function marketingHref(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/#")) return `${MARKETING_SITE_URL}${path.slice(1)}`;
  if (path.startsWith("#")) return `${MARKETING_SITE_URL}/${path}`;
  return `${MARKETING_SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function buildEventsNavbarConfig(): HumansFirstNavbarConfig {
  const mapLinks = <T extends { href: string }>(links: readonly T[]) =>
    links.map((link) => ({ ...link, href: marketingHref(link.href) }));

  return {
    ...HUMANS_FIRST_NAVBAR_CONFIG,
    homeHref: MARKETING_SITE_URL,
    ctaHref: MARKETING_SITE_URL,
    leftLinks: mapLinks(HUMANS_FIRST_NAVBAR_CONFIG.leftLinks),
    rightLinks: mapLinks(HUMANS_FIRST_NAVBAR_CONFIG.rightLinks),
    exploreItems: mapLinks(HUMANS_FIRST_NAVBAR_CONFIG.exploreItems),
  };
}

const EVENTS_NAVBAR_CONFIG = buildEventsNavbarConfig();

export function HeaderBar() {
  const pathname = usePathname() ?? "/";

  return (
    <>
      <HumansFirstNavbar currentPath={pathname} config={EVENTS_NAVBAR_CONFIG} />
      <HumansFirstNavbarSpacer />
    </>
  );
}

export default HeaderBar;
