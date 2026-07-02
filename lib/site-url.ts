/** Public app base URL for emails, passes, and RSVP links. */
export function getPublicSiteUrl(): string {
  const raw = process.env.SITE_URL?.trim().replace(/\/$/, "") || "http://localhost:3000";
  try {
    const url = new URL(raw.includes("://") ? raw : `http://${raw}`);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      url.protocol = "http:";
    }
    return url.origin;
  } catch {
    return "http://localhost:3000";
  }
}

export function toAbsolutePublicUrl(pathOrUrl: string): string {
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
        url.protocol = "http:";
      }
      return url.toString();
    } catch {
      return trimmed;
    }
  }
  const base = getPublicSiteUrl();
  return `${base}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}
