"use client";

/**
 * Humans First — complete Header (single file)
 */

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  MARKETING_SITE_URL,
  goToMarketingSection,
  isOnMarketingSite,
} from "@/lib/marketing-site";
import { JoinMovementModal } from "@/app/components/JoinMovementModal";

const HEADER_CONFIG = {
  logo: "/assets/figma/logo-no-underline.png",
  navLinks: [
    { href: "/book", label: "The book", isRoute: true, side: "left" as const },
    { href: "#cities-cards", label: "Cities", sectionId: "cities-cards", side: "left" as const },
    { href: "#mosaic", label: "Watch", sectionId: "mosaic", side: "right" as const },
    { href: "#wall", label: "The Wall", sectionId: "wall", side: "right" as const },
  ],
} as const;

type NavLink = (typeof HEADER_CONFIG.navLinks)[number];

function resolveNavHref(link: NavLink, pathname: string) {
  if ("isRoute" in link && link.isRoute) {
    return `${MARKETING_SITE_URL}${link.href}`;
  }
  if (link.href.startsWith("#")) {
    if (isOnMarketingSite() && pathname === "/") {
      return link.href;
    }
    return `${MARKETING_SITE_URL}/${link.href}`;
  }
  return link.href;
}

function isNavLinkActive(link: NavLink, pathname: string) {
  if ("isRoute" in link && link.isRoute) {
    return pathname === link.href || pathname === `${MARKETING_SITE_URL}${link.href}`;
  }
  return false;
}

function handleSectionClick(
  e: React.MouseEvent<HTMLAnchorElement>,
  sectionId: string | undefined
) {
  if (!sectionId) return;
  if (isOnMarketingSite()) {
    e.preventDefault();
    goToMarketingSection(sectionId);
  }
}

type HeaderProps = {
  onToggleMenu: () => void;
  menuOpen: boolean;
  onJoinClick: () => void;
};

export function Header({ onToggleMenu, menuOpen, onJoinClick }: HeaderProps) {
  const pathname = usePathname();
  const leftLinks = HEADER_CONFIG.navLinks.filter((l) => l.side === "left");
  const rightLinks = HEADER_CONFIG.navLinks.filter((l) => l.side === "right");

  const renderNavLink = (link: NavLink) => {
    const active = isNavLinkActive(link, pathname);
    const sectionId = "sectionId" in link ? link.sectionId : undefined;

    if ("isRoute" in link && link.isRoute) {
      return (
        <a key={link.href} href={resolveNavHref(link, pathname)} className={active ? "active" : undefined}>
          {link.label}
        </a>
      );
    }

    return (
      <a
        key={link.href}
        href={resolveNavHref(link, pathname)}
        data-section-link={sectionId}
        className={active ? "active" : undefined}
        onClick={(e) => handleSectionClick(e, sectionId)}
      >
        {link.label}
      </a>
    );
  };

  return (
    <header className="topbar">
      <nav className="nav" aria-label="Primary navigation" data-nav>
        <span className="nav-orb" aria-hidden="true" />
        <div className="nav-group nav-left">{leftLinks.map(renderNavLink)}</div>

        <a href={MARKETING_SITE_URL} className="brand" aria-label="The Humans First Series home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="brand-logo" src={HEADER_CONFIG.logo} alt="Humans First Series" />
        </a>

        <div className="nav-group nav-right">
          {rightLinks.map(renderNavLink)}
          <button
            type="button"
            className="nav-cta magnetic"
            onClick={onJoinClick}
          >
            Join the movement
          </button>
        </div>

        <button
          className="nav-toggle"
          type="button"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          data-nav-toggle
          onClick={onToggleMenu}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>
    </header>
  );
}

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  onJoinClick: () => void;
};

export function MobileMenu({ open, onClose, onJoinClick }: MobileMenuProps) {
  const pathname = usePathname();

  const renderMobileLink = (link: NavLink) => {
    const sectionId = "sectionId" in link ? link.sectionId : undefined;

    return (
      <a
        key={link.href}
        href={resolveNavHref(link, pathname)}
        data-mobile-link
        data-section-link={sectionId}
        onClick={(e) => {
          handleSectionClick(e, sectionId);
          onClose();
        }}
      >
        {link.label}
      </a>
    );
  };

  return (
    <div className={`mobile-menu${open ? " open" : ""}`} id="mobileMenu" aria-hidden={!open}>
      <nav className="mobile-menu-inner" aria-label="Mobile navigation">
        {HEADER_CONFIG.navLinks.map(renderMobileLink)}
        <button
          type="button"
          className="btn"
          data-mobile-link
          onClick={() => {
            onJoinClick();
            onClose();
          }}
        >
          Join the movement
        </button>
      </nav>
    </div>
  );
}

export function HeaderBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const toggleMenu = useCallback(() => setMenuOpen((open) => !open), []);
  const openJoin = useCallback(() => setJoinOpen(true), []);

  useEffect(() => {
    document.body.classList.toggle("modal-open", menuOpen || joinOpen);
    return () => document.body.classList.remove("modal-open");
  }, [menuOpen, joinOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeMenu]);

  return (
    <>
      <JoinMovementModal open={joinOpen} onClose={() => setJoinOpen(false)} />
      <Header onToggleMenu={toggleMenu} menuOpen={menuOpen} onJoinClick={openJoin} />
      <MobileMenu open={menuOpen} onClose={closeMenu} onJoinClick={openJoin} />
      <div className="header-spacer" aria-hidden="true" />
    </>
  );
}

export default HeaderBar;
