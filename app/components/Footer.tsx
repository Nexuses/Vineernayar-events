"use client";

import {
  HumansFirstFooter,
  HUMANS_FIRST_FOOTER_CONFIG,
} from "@/app/components/HumansFirstFooter";
import { LinkedInInsightTag } from "@/app/components/LinkedInInsightTag";
import { MARKETING_SITE_URL } from "@/lib/marketing-site";

const footerConfig = {
  ...HUMANS_FIRST_FOOTER_CONFIG,
  quickLinks: HUMANS_FIRST_FOOTER_CONFIG.quickLinks.map((link) => ({
    ...link,
    href: link.href.startsWith("http") ? link.href : `${MARKETING_SITE_URL}${link.href}`,
  })),
};

// The LinkedIn Insight Tag is mounted here, inside the <footer> element, and
// nowhere else. Keep it to a single mount — a second one elsewhere duplicates
// the <noscript> fallback pixel and double-counts no-JavaScript visitors.
export function Footer() {
  return (
    <HumansFirstFooter config={footerConfig} contactHref={MARKETING_SITE_URL}>
      <LinkedInInsightTag />
    </HumansFirstFooter>
  );
}

export default Footer;
