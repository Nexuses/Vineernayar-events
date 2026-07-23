"use client";

import {
  HumansFirstFooter,
  HUMANS_FIRST_FOOTER_CONFIG,
} from "@/app/components/HumansFirstFooter";
import { MARKETING_SITE_URL } from "@/lib/marketing-site";

const footerConfig = {
  ...HUMANS_FIRST_FOOTER_CONFIG,
  quickLinks: HUMANS_FIRST_FOOTER_CONFIG.quickLinks.map((link) => ({
    ...link,
    href: link.href.startsWith("http") ? link.href : `${MARKETING_SITE_URL}${link.href}`,
  })),
};

// The LinkedIn Insight Tag is mounted once in the root layout (end of <body>),
// which already covers every page including the event pages. It is deliberately
// not repeated here — a second mount duplicates the <noscript> fallback pixel.
export function Footer() {
  return <HumansFirstFooter config={footerConfig} contactHref={MARKETING_SITE_URL} />;
}

export default Footer;
