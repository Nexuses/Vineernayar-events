"use client";

/**
 * Portable Humans First navbar — copy this single file into another React project.
 *
 * Usage:
 *   import { HumansFirstNavbar } from './HumansFirstNavbar'
 *   <HumansFirstNavbar currentPath={window.location.pathname} />
 *
 * Also copy this asset to your public folder:
 *   /assets/figma/logo-no-underline.png
 */

import { useEffect, useRef, useState, type CSSProperties } from "react";

export const HUMANS_FIRST_NAVBAR_CONFIG = {
  logoSrc: "/assets/figma/logo-no-underline.png",
  logoAlt: "Humans First Series",
  homeHref: "/",
  ctaLabel: "Join the movement",
  ctaHref: "/#cities-cards",
  leftLinks: [{ href: "/book", label: "More Books", isRoute: true }],
  rightLinks: [{ href: "/#wall", label: "The Wall", sectionId: "wall" }],
  exploreItems: [
    { href: "/#mosaic", label: "Vineet Nayar in Action", sectionId: "mosaic" },
    { href: "/#cities-events", label: "The world tour", sectionId: "cities-events" },
  ],
} as const;

type NavLink = {
  href: string;
  label: string;
  sectionId?: string;
  isRoute?: boolean;
};

export type HumansFirstNavbarConfig = {
  logoSrc: string;
  logoAlt: string;
  homeHref: string;
  ctaLabel: string;
  ctaHref: string;
  leftLinks: readonly NavLink[];
  rightLinks: readonly NavLink[];
  exploreItems: readonly NavLink[];
};

export type HumansFirstNavbarProps = {
  currentPath?: string;
  config?: HumansFirstNavbarConfig;
  className?: string;
  style?: CSSProperties;
  onNavigate?: () => void;
  /** When set, CTA opens this handler instead of navigating to ctaHref. */
  onCtaClick?: () => void;
};

function NavCta({
  config,
  currentPath,
  className,
  onNavigate,
  onCtaClick,
  onAfterClick,
}: {
  config: HumansFirstNavbarConfig;
  currentPath: string;
  className: string;
  onNavigate?: () => void;
  onCtaClick?: () => void;
  onAfterClick?: () => void;
}) {
  const label = config.ctaLabel;

  if (onCtaClick) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => {
          onCtaClick();
          onAfterClick?.();
        }}
      >
        {label}
      </button>
    );
  }

  return (
    <a
      className={className}
      href={resolveHref({ href: config.ctaHref, label }, currentPath)}
      onClick={() => {
        onNavigate?.();
        onAfterClick?.();
      }}
    >
      {label}
    </a>
  );
}

function resolveHref(link: NavLink, currentPath: string) {
  if (link.href.startsWith("http://") || link.href.startsWith("https://")) {
    return link.href;
  }
  if (link.isRoute) return link.href;
  if (link.href.startsWith("#")) return currentPath === "/" ? link.href : `/${link.href}`;
  if (link.href.startsWith("/#")) {
    const hash = link.href.slice(1);
    return currentPath === "/" ? hash : link.href;
  }
  return link.href;
}

function isActive(link: NavLink, currentPath: string) {
  if (link.isRoute) return currentPath === link.href;
  return false;
}

function ExploreDropdown({
  items,
  currentPath,
  onNavigate,
}: {
  items: readonly NavLink[];
  currentPath: string;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={`hf-nav-dropdown${open ? " is-open" : ""}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className="hf-nav-dropdown-trigger"
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
      >
        Explore
        <span className="hf-nav-dropdown-chevron" aria-hidden="true" />
      </button>
      <div className="hf-nav-dropdown-menu" role="menu">
        {items.map((item) => (
          <a
            key={item.sectionId ?? item.href}
            role="menuitem"
            href={resolveHref(item, currentPath)}
            onClick={() => {
              setOpen(false);
              onNavigate?.();
            }}
          >
            {item.label}
          </a>
        ))}
      </div>
    </div>
  );
}

function MobileMenu({
  open,
  onClose,
  config,
  currentPath,
  onCtaClick,
}: {
  open: boolean;
  onClose: () => void;
  config: HumansFirstNavbarConfig;
  currentPath: string;
  onCtaClick?: () => void;
}) {
  const [exploreOpen, setExploreOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) {
    return (
      <div className="hf-mobile-menu" id="hf-mobile-menu" aria-hidden="true">
        <span />
      </div>
    );
  }

  const allLinks = [...config.leftLinks, ...config.rightLinks];

  return (
    <div className="hf-mobile-menu open" id="hf-mobile-menu" aria-hidden="false">
      <nav className="hf-mobile-menu-inner" aria-label="Mobile navigation">
        {allLinks.map((link) => (
          <a key={link.href} href={resolveHref(link, currentPath)} onClick={onClose}>
            {link.label}
          </a>
        ))}

        <button
          type="button"
          className="hf-mobile-menu-explore"
          aria-expanded={exploreOpen}
          onClick={() => setExploreOpen((value) => !value)}
        >
          Explore
        </button>

        {exploreOpen ? (
          <div className="hf-mobile-menu-sub">
            {config.exploreItems.map((item) => (
              <a
                key={item.sectionId ?? item.href}
                className="hf-mobile-menu-sublink"
                href={resolveHref(item, currentPath)}
                onClick={onClose}
              >
                {item.label}
              </a>
            ))}
          </div>
        ) : null}

        <NavCta
          config={config}
          currentPath={currentPath}
          className={onCtaClick ? "hf-nav-cta hf-mobile-menu-cta" : "hf-mobile-menu-cta"}
          onCtaClick={onCtaClick}
          onAfterClick={onClose}
        />
      </nav>
    </div>
  );
}

export function HumansFirstNavbar({
  currentPath = "/",
  config = HUMANS_FIRST_NAVBAR_CONFIG,
  className,
  style,
  onNavigate,
  onCtaClick,
}: HumansFirstNavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const rootClassName = ["hf-topbar", className].filter(Boolean).join(" ");

  const toggleMenu = () => setMenuOpen((value) => !value);
  const closeMenu = () => setMenuOpen(false);

  const renderLink = (link: NavLink) => (
    <a
      key={link.href}
      href={resolveHref(link, currentPath)}
      className={isActive(link, currentPath) ? "active" : undefined}
      onClick={onNavigate}
    >
      {link.label}
    </a>
  );

  return (
    <>
      <style>{getNavbarStyles()}</style>
      <header className={rootClassName} style={style}>
        <nav className="hf-nav" aria-label="Primary navigation">
          <div className="hf-nav-group hf-nav-left">
            {config.leftLinks.map(renderLink)}
            <ExploreDropdown
              items={config.exploreItems}
              currentPath={currentPath}
              onNavigate={onNavigate}
            />
          </div>

          <a
            href={config.homeHref}
            className="hf-brand"
            aria-label="The Humans First Series home"
            onClick={onNavigate}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="hf-brand-logo" src={config.logoSrc} alt={config.logoAlt} />
          </a>

          <div className="hf-nav-group hf-nav-right">
            {config.rightLinks.map(renderLink)}
            <NavCta
              config={config}
              currentPath={currentPath}
              className="hf-nav-cta"
              onNavigate={onNavigate}
              onCtaClick={onCtaClick}
            />
          </div>

          <button
            className="hf-nav-toggle"
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={toggleMenu}
          >
            <span />
            <span />
            <span />
          </button>
        </nav>
      </header>

      <MobileMenu
        open={menuOpen}
        onClose={closeMenu}
        config={config}
        currentPath={currentPath}
        onCtaClick={onCtaClick}
      />
    </>
  );
}

export function HumansFirstNavbarSpacer() {
  return (
    <div
      className="hf-header-spacer"
      style={{ height: "var(--hf-header, 80px)", minHeight: "var(--hf-header, 80px)" }}
      aria-hidden="true"
    />
  );
}

function getNavbarStyles() {
  return `
:root {
  --hf-header: 80px;
  --hf-yellow: #f5ea30;
}

.hf-header-spacer {
  height: var(--hf-header);
  min-height: var(--hf-header);
  flex-shrink: 0;
}

.hf-topbar {
  --hf-max: 1240px;
  --hf-gutter: clamp(20px, 4vw, 56px);
  --hf-yellow: #f5ea30;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 900;
  height: var(--hf-header);
  display: flex;
  align-items: center;
  background: #fff;
  box-shadow: 0 2px 14px rgba(17, 17, 17, 0.08);
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  overflow: visible;
}

.hf-nav {
  position: relative;
  width: min(var(--hf-max), calc(100% - (var(--hf-gutter) * 2)));
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: clamp(16px, 3vw, 40px);
}

.hf-nav-group {
  display: flex;
  align-items: center;
  gap: clamp(16px, 2.2vw, 30px);
}

.hf-nav-right {
  justify-content: flex-end;
}

.hf-nav a:not(.hf-nav-cta),
.hf-nav button:not(.hf-nav-cta) {
  border: 0;
  background: transparent;
  color: #151515;
  font-size: 13px;
  font-weight: 800;
  line-height: 1;
  text-transform: uppercase;
  text-decoration: none;
  cursor: pointer;
}

.hf-nav a:not(.hf-nav-cta) {
  position: relative;
  padding: 10px 0;
}

.hf-nav a:not(.hf-nav-cta).active {
  color: #000;
}

.hf-brand {
  min-width: max-content;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
}

.hf-brand-logo {
  width: min(192px, 30vw);
  height: auto;
  max-height: calc(var(--hf-header) - 12px);
  padding: 4px 12px;
  object-fit: contain;
}

.hf-nav-cta,
.hf-nav a.hf-nav-cta,
.hf-nav button.hf-nav-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  border: 0;
  border-radius: 999px;
  padding: 0 26px;
  background: #000 !important;
  color: #fff !important;
  font-family: inherit;
  font-size: 14px;
  font-weight: 900;
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;
  cursor: pointer;
  text-decoration: none;
  transition: transform 220ms ease, box-shadow 220ms ease, background 220ms ease, color 220ms ease;
}

.hf-nav-cta:hover,
.hf-nav-cta:focus-visible,
.hf-nav a.hf-nav-cta:hover,
.hf-nav a.hf-nav-cta:focus-visible,
.hf-nav button.hf-nav-cta:hover,
.hf-nav button.hf-nav-cta:focus-visible {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
  background: #000 !important;
  color: var(--hf-yellow, #f5ea30) !important;
}

.hf-nav-dropdown {
  position: relative;
}

.hf-nav-dropdown-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 0;
  font-family: inherit;
  font-size: 13px;
  font-weight: 800;
  line-height: 1;
  text-transform: uppercase;
  color: #151515;
}

.hf-nav-dropdown-chevron {
  width: 8px;
  height: 8px;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: rotate(45deg) translateY(-2px);
  transition: transform 180ms ease;
}

.hf-nav-dropdown.is-open .hf-nav-dropdown-chevron {
  transform: rotate(-135deg) translateY(1px);
}

.hf-nav-dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 20;
  min-width: 240px;
  padding: 6px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
  opacity: 0;
  visibility: hidden;
  transform: translateY(6px);
  transition: opacity 180ms ease, transform 180ms ease, visibility 180ms ease;
}

.hf-nav-dropdown:hover .hf-nav-dropdown-menu,
.hf-nav-dropdown:focus-within .hf-nav-dropdown-menu,
.hf-nav-dropdown.is-open .hf-nav-dropdown-menu {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.hf-nav-dropdown-menu a {
  display: block;
  padding: 11px 12px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.3;
  text-transform: none;
  letter-spacing: 0;
  color: #151515;
  white-space: nowrap;
  transition: background 160ms ease, color 160ms ease;
}

.hf-nav-dropdown-menu a:hover,
.hf-nav-dropdown-menu a:focus-visible {
  background: rgba(245, 234, 48, 0.28);
  color: #000;
}

.hf-nav-toggle {
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

.hf-nav-toggle span {
  display: block;
  width: 24px;
  height: 2px;
  border-radius: 2px;
  background: #111;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.hf-nav-toggle[aria-expanded="true"] span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.hf-nav-toggle[aria-expanded="true"] span:nth-child(2) {
  opacity: 0;
}

.hf-nav-toggle[aria-expanded="true"] span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

.hf-mobile-menu {
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
  pointer-events: none;
}

.hf-mobile-menu.open {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.hf-mobile-menu-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: min(calc(100% - 36px), 360px);
  max-height: calc(100dvh - 100px);
  padding: 12px 0;
  overflow-x: hidden;
  overflow-y: auto;
  text-align: center;
}

.hf-mobile-menu-inner a:not(.hf-mobile-menu-cta),
.hf-mobile-menu-explore {
  max-width: 100%;
  padding: 6px 8px;
  border: 0;
  background: transparent;
  font-family: inherit;
  font-size: clamp(22px, 6.5vw, 32px);
  font-weight: 900;
  line-height: 1.1;
  text-transform: uppercase;
  color: #111;
  text-decoration: none;
  cursor: pointer;
}

.hf-mobile-menu-explore {
  margin-top: 2px;
}

.hf-mobile-menu-cta.hf-nav-cta,
.hf-mobile-menu-cta.hf-nav-cta:hover,
.hf-mobile-menu-cta.hf-nav-cta:focus-visible {
  background: #000 !important;
  color: #fff !important;
}

.hf-mobile-menu-cta.hf-nav-cta:hover,
.hf-mobile-menu-cta.hf-nav-cta:focus-visible {
  color: var(--hf-yellow, #f5ea30) !important;
}

.hf-mobile-menu-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 14px;
  width: fit-content;
  max-width: calc(100vw - 48px);
  min-height: 48px;
  padding: 0 clamp(18px, 5vw, 26px);
  border-radius: 999px;
  background: var(--hf-yellow);
  color: #000 !important;
  font-size: clamp(12px, 3.6vw, 14px);
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  text-decoration: none;
  white-space: nowrap;
}

.hf-mobile-menu-sub {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  width: 100%;
  margin-top: 2px;
}

.hf-mobile-menu-sublink {
  max-width: 100%;
  padding: 5px 8px !important;
  font-size: clamp(17px, 5vw, 24px) !important;
  font-weight: 700 !important;
  line-height: 1.2 !important;
  text-transform: none !important;
  color: rgba(17, 17, 17, 0.72) !important;
}

@media (max-width: 720px) {
  .hf-nav {
    grid-template-columns: 44px 1fr 44px;
    justify-items: center;
    gap: 10px;
    width: calc(100% - 28px);
  }

  .hf-nav-left,
  .hf-nav-right {
    display: none;
  }

  .hf-brand {
    grid-column: 2;
    justify-self: center;
    min-width: 0;
  }

  .hf-nav-toggle {
    display: flex;
    grid-column: 3;
    justify-self: end;
  }
}
`.trim();
}
