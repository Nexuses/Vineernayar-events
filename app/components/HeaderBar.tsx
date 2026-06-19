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

      <style jsx global>{`
        :root {
          --font: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          --yellow: #f5ea30;
          --max: 1240px;
          --gutter: clamp(20px, 4vw, 56px);
          --header: 76px;
          --nav-glow-x: 50%;
          --nav-glow-y: 50%;
        }

        body.modal-open {
          overflow: hidden;
        }

        .header-spacer {
          height: var(--header);
          flex-shrink: 0;
        }

        .topbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 900;
          height: var(--header);
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.86);
          border-bottom: 1px solid rgba(17, 17, 17, 0.08);
          backdrop-filter: blur(18px) saturate(140%);
          transition: height 240ms ease, background 240ms ease;
        }

        .topbar.compact {
          height: 62px;
          background: rgba(255, 255, 255, 0.94);
        }

        .nav {
          position: relative;
          isolation: isolate;
          width: min(var(--max), calc(100% - (var(--gutter) * 2)));
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
          align-items: center;
          gap: clamp(16px, 3vw, 40px);
        }

        .nav-group {
          display: flex;
          align-items: center;
          gap: clamp(16px, 2.2vw, 30px);
        }

        .nav-right {
          justify-content: flex-end;
        }

        .nav a,
        .nav button {
          border: 0;
          background: transparent;
          color: #151515;
          font-family: var(--font);
          font-size: 13px;
          font-weight: 800;
          line-height: 1;
          text-transform: uppercase;
          text-decoration: none;
          cursor: pointer;
        }

        .nav a {
          position: relative;
          padding: 10px 0;
        }

        .nav a.active {
          color: #000;
        }

        .brand {
          min-width: max-content;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 0;
        }

        .brand-logo {
          width: min(180px, 28vw);
          height: auto;
          padding: 20px;
        }

        .nav-cta,
        .mobile-menu-inner .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 46px;
          border: 0;
          border-radius: 999px;
          padding: 0 22px;
          font-size: 14px;
          font-weight: 900;
          line-height: 1;
          text-transform: uppercase;
          transition: transform 220ms ease, box-shadow 220ms ease, background 220ms ease,
            color 220ms ease;
        }

        .nav button.nav-cta {
          background: #000;
          color: #fff;
          text-decoration: none;
          padding: 0 26px;
          min-height: 46px;
          line-height: 1;
          letter-spacing: 0.06em;
          white-space: nowrap;
          font-family: var(--font);
        }

        .nav button.nav-cta:hover,
        .nav button.nav-cta:focus-visible {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
          background: #000;
          color: var(--yellow);
        }

        .nav-orb {
          position: absolute;
          z-index: -1;
          left: var(--nav-glow-x);
          top: var(--nav-glow-y);
          width: 72px;
          height: 30px;
          border-radius: 999px;
          background: rgba(245, 234, 48, 0.34);
          filter: blur(16px);
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        .nav-toggle {
          display: none;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          width: 44px;
          height: 44px;
          border: 0;
          background: transparent;
          cursor: pointer;
        }

        .nav-toggle span {
          display: block;
          width: 24px;
          height: 2px;
          border-radius: 2px;
          background: #111;
          transition: transform 0.3s ease, opacity 0.3s ease;
        }

        .nav-toggle[aria-expanded="true"] span:nth-child(1) {
          transform: translateY(7px) rotate(45deg);
        }

        .nav-toggle[aria-expanded="true"] span:nth-child(2) {
          opacity: 0;
        }

        .nav-toggle[aria-expanded="true"] span:nth-child(3) {
          transform: translateY(-7px) rotate(-45deg);
        }

        .mobile-menu {
          position: fixed;
          inset: 0;
          z-index: 899;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(10px);
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease, visibility 0.3s ease;
        }

        .mobile-menu.open {
          opacity: 1;
          visibility: visible;
        }

        .mobile-menu-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          width: min(90%, 420px);
          text-align: center;
        }

        .mobile-menu-inner a,
        .mobile-menu-inner button.btn {
          padding: 8px 0;
          font-size: clamp(28px, 8.5vw, 40px);
          font-weight: 900;
          line-height: 1.1;
          text-transform: uppercase;
          color: #111;
          text-decoration: none;
        }

        .mobile-menu-inner .btn {
          margin-top: 20px;
          width: min(100%, 300px);
          background: var(--yellow);
          color: #000;
        }

        .mobile-menu-inner .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
        }

        @media (max-width: 1050px) {
          :root {
            --header: 68px;
          }

          .nav {
            grid-template-columns: auto 1fr auto;
          }

          .nav-left {
            display: none;
          }

          .brand {
            justify-self: start;
          }
        }

        @media (max-width: 720px) {
          :root {
            --gutter: 20px;
            --header: 64px;
          }

          .nav {
            grid-template-columns: 44px 1fr 44px;
            justify-items: center;
            gap: 10px;
            width: calc(100% - 28px);
          }

          .nav-left,
          .nav-right {
            display: none;
          }

          .brand {
            grid-column: 2;
            justify-self: center;
            min-width: 0;
          }

          .brand-logo {
            width: min(164px, 58vw);
            padding: 20px;
          }

          .nav-toggle {
            display: flex;
            grid-column: 3;
            justify-self: end;
          }
        }
      `}</style>
    </>
  );
}

export default HeaderBar;
