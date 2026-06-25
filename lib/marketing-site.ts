export const MARKETING_SITE_URL =
  process.env.NEXT_PUBLIC_MARKETING_SITE_URL?.replace(/\/$/, "") ||
  "https://hfmsbook.com";

export function getMarketingOrigin(): string {
  return new URL(MARKETING_SITE_URL).origin;
}

export function isOnMarketingSite(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.origin === getMarketingOrigin();
}

export function scrollToMarketingSection(
  sectionId: string,
  behavior: ScrollBehavior = "smooth"
): boolean {
  const el = document.getElementById(sectionId);
  if (!el) return false;
  el.scrollIntoView({ behavior, block: "start" });
  window.history.pushState(null, "", `#${sectionId}`);
  return true;
}

/** Navigate to a section on the marketing homepage (same tab). */
export function goToMarketingSection(sectionId: string): void {
  if (isOnMarketingSite()) {
    if (!scrollToMarketingSection(sectionId)) {
      window.location.assign(`/#${sectionId}`);
    }
    return;
  }

  window.location.assign(`${MARKETING_SITE_URL}/#${sectionId}`);
}
