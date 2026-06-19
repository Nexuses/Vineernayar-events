"use client";

/**
 * Humans First — complete Footer (single file)
 */

import { useState } from "react";
import { MARKETING_SITE_URL } from "@/lib/marketing-site";
import { JoinMovementModal } from "@/app/components/JoinMovementModal";

const FOOTER_CONFIG = {
  logo: "/assets/figma/logo.png",
  graphic:
    "https://storage.googleapis.com/storage.magicpath.ai/user/291020608010072064/figma-assets/99902f8e-baba-436e-aadf-2038baf65aba.svg",
  highlightImage: "/assets/figma/Vector.png",
  copyright: "© 2026 Humans First. All rights reserved.",
  description:
    "The Humans First Series is a live event platform built around the book Humans First, Machines Second by Vineet Nayar, published by Penguin Business.",
  exploreLinks: [{ href: "/book", label: "The book" }],
  socialLinks: [
    { href: "https://www.linkedin.com/in/vineetnayar?originalSubdomain=in", label: "LinkedIn" },
    { href: "https://www.instagram.com/vn.nayar/?hl=en", label: "Instagram" },
    { href: "https://www.youtube.com/", label: "YouTube" },
  ],
} as const;

type FooterProps = {
  onContactClick?: () => void;
};

export function Footer({ onContactClick }: FooterProps) {
  const [joinOpen, setJoinOpen] = useState(false);

  function openContact() {
    if (onContactClick) {
      onContactClick();
      return;
    }
    setJoinOpen(true);
  }

  return (
    <>
      <JoinMovementModal open={joinOpen} onClose={() => setJoinOpen(false)} />
      <footer className="footer">
        <div className="wrap footer-grid">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="footer-logo" src={FOOTER_CONFIG.logo} alt="Humans First" />
            <p className="lede footer-note">{FOOTER_CONFIG.description}</p>
          </div>

          <div className="footer-links">
            <div>
              <h4>Quick Links</h4>
              {FOOTER_CONFIG.exploreLinks.map((link) => (
                <a key={link.href} href={`${MARKETING_SITE_URL}${link.href}`}>
                  {link.label}
                </a>
              ))}
              <button className="footer-link-btn" type="button" onClick={openContact}>
                Contact Us
              </button>
            </div>

            <div>
              <h4>Follow us</h4>
              {FOOTER_CONFIG.socialLinks.map((link) => (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="footer-graphic"
          src={FOOTER_CONFIG.graphic}
          alt="Humans First footer graphic"
        />
        <p className="footer-copyright">{FOOTER_CONFIG.copyright}</p>
      </footer>

      <style jsx global>{`
        .footer {
          padding: clamp(76px, 9vw, 116px) 0 42px;
          background: #fff;
          border-top: 1px solid #e4e4e7;
          font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
        }

        .footer .wrap {
          width: min(1240px, calc(100% - (clamp(20px, 4vw, 56px) * 2)));
          max-width: 100%;
          margin: 0 auto;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(380px, 0.8fr);
          gap: clamp(44px, 7vw, 88px);
          align-items: start;
        }

        .footer-logo {
          width: 35%;
          max-width: none;
          height: auto;
          display: block;
        }

        .footer .lede.footer-note {
          max-width: 430px;
          margin: 24px 0 0;
          color: #5d5d5d;
          font-size: clamp(16px, 1.125vw, 18px);
          font-weight: 400;
          line-height: 1.48;
        }

        .footer-links {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(28px, 5vw, 70px);
        }

        .footer-links > div {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.15em;
        }

        .footer-links h4 {
          margin: 0 0 14px;
          color: #6d6d6d;
          font-weight: 900;
          font-size: clamp(14.4px, 1.6vw, 20.8px);
          text-transform: uppercase;
        }

        .footer-links a,
        .footer-links .footer-link-btn {
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
          cursor: pointer;
          transition: color 180ms ease;
        }

        .footer-links a::before,
        .footer-links .footer-link-btn::before {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: calc(100% + 1.4em);
          height: 2em;
          background-image: url("${FOOTER_CONFIG.highlightImage}");
          background-repeat: no-repeat;
          background-position: center;
          background-size: 100% 100%;
          opacity: 0;
          transition: opacity 220ms ease;
          z-index: -1;
          pointer-events: none;
        }

        .footer-links a:hover,
        .footer-links a:focus-visible,
        .footer-links .footer-link-btn:hover,
        .footer-links .footer-link-btn:focus-visible {
          color: #000;
        }

        .footer-links a:hover::before,
        .footer-links a:focus-visible::before,
        .footer-links .footer-link-btn:hover::before,
        .footer-links .footer-link-btn:focus-visible::before {
          opacity: 1;
        }

        .footer-copyright {
          margin: 26px auto 0;
          color: rgba(17, 17, 17, 0.6);
          font-size: 14px;
          text-align: center;
        }

        .footer-graphic {
          width: min(100%, 1106px);
          margin: clamp(48px, 7vw, 76px) auto 0;
          display: block;
          max-width: 100%;
          height: auto;
        }

        @media (max-width: 1050px) {
          .footer-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 720px) {
          .footer-links {
            grid-template-columns: 1fr 1fr;
            gap: clamp(20px, 5vw, 40px);
          }

          .footer-logo {
            width: min(220px, 60vw);
          }
        }
      `}</style>
    </>
  );
}

export default Footer;
