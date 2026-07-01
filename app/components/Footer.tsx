import {
  HumansFirstFooter,
  HUMANS_FIRST_FOOTER_CONFIG,
} from "@/app/components/HumansFirstFooter";
import { MARKETING_SITE_URL } from "@/lib/marketing-site";

const CONTACT_EMAIL = "contact@hfmsbook.com";

const footerConfig = {
  ...HUMANS_FIRST_FOOTER_CONFIG,
  quickLinks: HUMANS_FIRST_FOOTER_CONFIG.quickLinks.map((link) => ({
    ...link,
    href: link.href.startsWith("http") ? link.href : `${MARKETING_SITE_URL}${link.href}`,
  })),
};

export function Footer() {
  return (
    <HumansFirstFooter
      config={footerConfig}
      contactHref={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Contact us")}`}
    />
  );
}

export default Footer;
