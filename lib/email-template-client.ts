import { BRAND_LOGO_URL } from "@/lib/constants";
import { MARKETING_SITE_URL } from "@/lib/marketing-site";

export function applyEmailTemplate(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

export function getSampleJoinVars(): Record<string, string> {
  return {
    name: "Alex",
    email: "alex@example.com",
    city: "Mumbai",
    logoUrl: process.env.EMAIL_LOGO_URL || BRAND_LOGO_URL,
    navLogoUrl: process.env.EMAIL_LOGO_URL || BRAND_LOGO_URL,
    homeUrl: MARKETING_SITE_URL,
    bookUrl: `${MARKETING_SITE_URL}/book`,
    citiesUrl: `${MARKETING_SITE_URL}/#cities-cards`,
    watchUrl: `${MARKETING_SITE_URL}/#mosaic`,
    wallUrl: `${MARKETING_SITE_URL}/#wall`,
    submittedAt: "15 June 2026, 10:30 am",
  };
}
