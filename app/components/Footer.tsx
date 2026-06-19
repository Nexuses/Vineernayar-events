/**
 * Humans First — complete Footer (single file)
 */

const FOOTER_CONFIG = {
  logo: "/assets/figma/logo.png",
  graphic:
    "https://storage.googleapis.com/storage.magicpath.ai/user/291020608010072064/figma-assets/99902f8e-baba-436e-aadf-2038baf65aba.svg",
  copyright: "© 2026 Humans First. All rights reserved.",
  description:
    "The Humans First Series is a live event platform built around the book Humans First, Machines Second by Vineet Nayar, published by Penguin Business.",
  contactEmail: "hello@humansfirst.com",
  contactLinks: [
    { label: "Media inquiries", subject: "Media inquiries" },
    { label: "Speaking requests", subject: "Speaking requests" },
    { label: "Contact us", subject: "Contact us" },
  ],
  socialLinks: [
    { href: "https://www.linkedin.com/in/vineetnayar?originalSubdomain=in", label: "LinkedIn" },
    { href: "https://www.instagram.com/vn.nayar/?hl=en", label: "Instagram" },
    { href: "https://www.youtube.com/", label: "YouTube" },
  ],
} as const;

function contactMailto(subject: string): string {
  return `mailto:${FOOTER_CONFIG.contactEmail}?subject=${encodeURIComponent(subject)}`;
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-grid">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="footer-logo" src={FOOTER_CONFIG.logo} alt="Humans First" />
          <p className="lede footer-note">{FOOTER_CONFIG.description}</p>
        </div>

        <div className="footer-links">
          <div>
            <h4>Get in touch</h4>
            {FOOTER_CONFIG.contactLinks.map((link) => (
              <a key={link.label} href={contactMailto(link.subject)}>
                {link.label}
              </a>
            ))}
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
  );
}

export default Footer;
