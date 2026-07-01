/**
 * Portable Humans First footer — copy this single file into another React/Next project.
 *
 * Usage:
 *   import { HumansFirstFooter } from './HumansFirstFooter'
 *   <HumansFirstFooter onContactClick={() => openContactModal()} />
 *
 * Also copy these assets to your public folder:
 *   /assets/figma/logo.png
 *   /assets/figma/Vector.png
 *
 * Fonts used: Inter + Caveat (for Contact Us highlight)
 */

import type { CSSProperties } from "react";

export const HUMANS_FIRST_FOOTER_CONFIG = {
  logoSrc: "/assets/figma/logo.png",
  logoAlt: "Humans First",
  note: "The Humans First Series is a live event platform built around the book Humans First, Machines Second by Vineet Nayar, published by Penguin Business.",
  graphicSrc:
    "https://storage.googleapis.com/storage.magicpath.ai/user/291020608010072064/figma-assets/99902f8e-baba-436e-aadf-2038baf65aba.svg",
  graphicAlt: "Humans First footer graphic",
  copyright: "© 2026 Humans First. All rights reserved.",
  highlightImage: "/assets/figma/Vector.png",
  quickLinks: [
    { href: "/#cities-cards", label: "Join Us" },
    { href: "/book", label: "More Books" },
    { href: "/#mosaic", label: "Vineet Nayar in Action" },
    { href: "/#cities-events", label: "The world tour" },
    { href: "/#wall", label: "The Wall" },
    {
      href: "https://vineetnayar.com/about-us/",
      label: "Learn more about Vineet Nayar",
      labelPrefix: "Learn more about",
      labelHighlight: "Vineet Nayar",
      external: true,
    },
  ],
  socialLinks: [
    { href: "https://www.linkedin.com/in/vineetnayar?originalSubdomain=in", label: "LinkedIn" },
    { href: "https://www.instagram.com/vn.nayar/?hl=en", label: "Instagram" },
    { href: "https://www.youtube.com/@VineetNayar7/", label: "YouTube" },
    { href: "https://x.com/vineetnayar", label: "X" },
    { href: "https://www.facebook.com/VineetNayar.EmployeesFirst", label: "Facebook" },
  ],
} as const;

type QuickLink = {
  href: string;
  label: string;
  labelPrefix?: string;
  labelHighlight?: string;
  external?: boolean;
};

export type HumansFirstFooterConfig = {
  logoSrc: string;
  logoAlt: string;
  note: string;
  graphicSrc: string;
  graphicAlt: string;
  copyright: string;
  highlightImage: string;
  quickLinks: readonly QuickLink[];
  socialLinks: readonly { href: string; label: string }[];
};

export type HumansFirstFooterProps = {
  onContactClick?: () => void;
  contactHref?: string;
  config?: HumansFirstFooterConfig;
  className?: string;
  style?: CSSProperties;
};

function QuickLinkItem({ link }: { link: QuickLink }) {
  const className =
    "labelHighlight" in link && link.labelHighlight
      ? "hf-footer-link hf-footer-link-has-highlight"
      : "hf-footer-link";

  return (
    <a
      className={className}
      href={link.href}
      {...("external" in link && link.external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
    >
      {"labelHighlight" in link && link.labelHighlight ? (
        <>
          {link.labelPrefix} <span className="hf-footer-link-name">{link.labelHighlight}</span>
        </>
      ) : (
        link.label
      )}
    </a>
  );
}

export function HumansFirstFooter({
  onContactClick,
  contactHref = "/contact",
  config = HUMANS_FIRST_FOOTER_CONFIG,
  className,
  style,
}: HumansFirstFooterProps) {
  const rootClassName = ["hf-footer", className].filter(Boolean).join(" ");

  return (
    <>
      <style>{getFooterStyles(config.highlightImage)}</style>
      <footer className={rootClassName} style={style}>
        <div className="hf-footer-wrap hf-footer-grid">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="hf-footer-logo" src={config.logoSrc} alt={config.logoAlt} />
            <p className="hf-footer-note">{config.note}</p>
          </div>

          <div className="hf-footer-links">
            <div>
              <h4>Quick Links</h4>
              {config.quickLinks.map((link) => (
                <QuickLinkItem key={link.href} link={link} />
              ))}
            </div>

            <div>
              <h4>Stay Connected</h4>
              {config.socialLinks.map((link) => (
                <a
                  key={link.label}
                  className="hf-footer-link"
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.label}
                </a>
              ))}

              {onContactClick ? (
                <button
                  className="hf-footer-link hf-footer-contact-btn"
                  type="button"
                  onClick={onContactClick}
                >
                  <span className="hf-footer-hand-highlight">Contact Us</span>
                </button>
              ) : (
                <a className="hf-footer-link hf-footer-contact-btn" href={contactHref}>
                  <span className="hf-footer-hand-highlight">Contact Us</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hf-footer-graphic" src={config.graphicSrc} alt={config.graphicAlt} />
        <p className="hf-footer-copyright">{config.copyright}</p>
      </footer>
    </>
  );
}

function getFooterStyles(highlightImage: string) {
  return `
.hf-footer {
  padding: clamp(76px, 9vw, 116px) 0 42px;
  background: #fff;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.hf-footer-wrap {
  width: min(1240px, calc(100% - clamp(40px, 8vw, 112px)));
  margin: 0 auto;
}

.hf-footer-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(380px, 0.8fr);
  gap: clamp(44px, 7vw, 88px);
  align-items: start;
}

.hf-footer-logo {
  width: 35%;
  max-width: none;
  height: auto;
  display: block;
}

.hf-footer-note {
  max-width: 430px;
  margin: 24px 0 0;
  color: rgba(17, 17, 17, 0.78);
  font-size: clamp(16px, 1.125vw, 18px);
  line-height: 1.48;
}

.hf-footer-links {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(28px, 5vw, 70px);
}

.hf-footer-links > div {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15em;
}

.hf-footer-links h4 {
  margin: 0 0 14px;
  color: #6d6d6d;
  font-weight: 900;
  font-size: clamp(14.4px, 1.6vw, 20.8px);
  text-transform: uppercase;
}

.hf-footer-link,
.hf-footer-contact-btn {
  position: relative;
  z-index: 0;
  display: block;
  width: fit-content;
  border: 0;
  background: transparent;
  color: #6d6d6d;
  font-family: inherit;
  font-size: clamp(16px, 1.125vw, 18px);
  font-weight: 400;
  line-height: 1.4;
  padding: 0.18em 0.45em;
  margin: 0;
  text-decoration: none;
  text-transform: capitalize;
  cursor: pointer;
  transition: color 180ms ease;
}

.hf-footer-link::before,
.hf-footer-contact-btn::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: calc(100% + 1.4em);
  height: 2.55em;
  background-image: url("${highlightImage}");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 100% 100%;
  opacity: 0;
  transition: opacity 220ms ease;
  z-index: -1;
  pointer-events: none;
}

.hf-footer-link.hf-footer-link-has-highlight::before {
  left: -0.55em;
  top: -0.35em;
  right: -0.55em;
  bottom: -0.35em;
  width: auto;
  height: auto;
  transform: none;
}

.hf-footer-link-name {
  white-space: nowrap;
}

.hf-footer-link:hover,
.hf-footer-link:focus-visible,
.hf-footer-contact-btn:hover,
.hf-footer-contact-btn:focus-visible {
  color: #000;
}

.hf-footer-link:hover::before,
.hf-footer-link:focus-visible::before,
.hf-footer-contact-btn:hover::before,
.hf-footer-contact-btn:focus-visible::before {
  opacity: 1;
}

.hf-footer-contact-btn::before {
  display: none;
}

.hf-footer-contact-btn {
  margin-bottom: 0.35em;
}

.hf-footer-hand-highlight {
  position: relative;
  display: inline-block;
  width: max-content;
  padding: 0.12em 0.2em;
  color: #000;
  font-family: "Caveat", cursive;
  font-size: clamp(22px, 2.2vw, 28px);
  font-weight: 400;
  line-height: 1.05;
  letter-spacing: -0.04em;
}

.hf-footer-hand-highlight::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 120%;
  height: 1.15em;
  transform: translate(-50%, -50%);
  opacity: 1;
  background-image: url("${highlightImage}");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 100% 100%;
  z-index: -1;
  pointer-events: none;
}

.hf-footer-copyright {
  margin: 26px auto 0;
  color: rgba(17, 17, 17, 0.6);
  font-size: 14px;
  text-align: center;
}

.hf-footer-graphic {
  display: block;
  width: min(100%, 1106px);
  margin: clamp(48px, 7vw, 76px) auto 0;
}

@media (max-width: 900px) {
  .hf-footer-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .hf-footer-links {
    grid-template-columns: 1fr 1fr;
    gap: clamp(20px, 5vw, 40px);
  }
}
`.trim();
}
