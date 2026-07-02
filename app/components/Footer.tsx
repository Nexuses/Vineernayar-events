"use client";

import { useCallback, useState } from "react";
import {
  HumansFirstFooter,
  HUMANS_FIRST_FOOTER_CONFIG,
} from "@/app/components/HumansFirstFooter";
import { ContactModal } from "@/app/components/ContactModal";
import { MARKETING_SITE_URL } from "@/lib/marketing-site";

const footerConfig = {
  ...HUMANS_FIRST_FOOTER_CONFIG,
  quickLinks: HUMANS_FIRST_FOOTER_CONFIG.quickLinks.map((link) => ({
    ...link,
    href: link.href.startsWith("http") ? link.href : `${MARKETING_SITE_URL}${link.href}`,
  })),
};

export function Footer() {
  const [contactOpen, setContactOpen] = useState(false);
  const openContact = useCallback(() => setContactOpen(true), []);
  const closeContact = useCallback(() => setContactOpen(false), []);

  return (
    <>
      <ContactModal open={contactOpen} onClose={closeContact} />
      <HumansFirstFooter config={footerConfig} onContactClick={openContact} />
    </>
  );
}

export default Footer;
