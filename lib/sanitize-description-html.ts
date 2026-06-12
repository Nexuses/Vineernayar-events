import { DESC_GAP_LG, DESC_GAP_SM } from "@/lib/description-line-gaps";

const ALLOWED_TAGS = new Set([
  "b",
  "strong",
  "br",
  "p",
  "div",
  "em",
  "i",
  "span",
  "hr",
  "ul",
  "ol",
  "li",
]);

function extractClass(attrs: string): string | null {
  const match = attrs.match(/\bclass\s*=\s*["']([^"']*)["']/i);
  if (!match) return null;
  const classes = match[1].trim().split(/\s+/);
  return classes[0] ?? null;
}

function sanitizeFontSizeStyle(style: string): string | null {
  const match = style.match(/font-size:\s*(\d+(?:\.\d+)?)(px|em|rem)\b/i);
  if (!match) return null;
  const size = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  if (!Number.isFinite(size) || size <= 0) return null;
  if (unit === "px" && size > 72) return null;
  if ((unit === "em" || unit === "rem") && size > 4) return null;
  return `font-size: ${size}${unit}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Strip unsafe tags/attributes; keep basic formatting from the admin editor. */
export function sanitizeDescriptionHtml(html: string): string {
  let out = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  out = out.replace(
    /<\/?([a-z][a-z0-9]*)\b([^>]*)>/gi,
    (match, tagName: string, attrs: string) => {
      const tag = tagName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) return "";
      if (tag === "br") {
        if (extractClass(attrs) === DESC_GAP_SM) {
          return `<br class="${DESC_GAP_SM}">`;
        }
        return "<br>";
      }
      if (tag === "hr") return "<hr>";
      if (match.startsWith("</")) return `</${tag}>`;

      if (tag === "div") {
        if (extractClass(attrs) === DESC_GAP_LG) {
          return `<div class="${DESC_GAP_LG}">`;
        }
        return "<div>";
      }

      if (tag === "span") {
        const styleMatch = attrs.match(/\bstyle\s*=\s*["']([^"']*)["']/i);
        if (styleMatch) {
          const safeStyle = sanitizeFontSizeStyle(styleMatch[1]);
          if (safeStyle) return `<span style="${safeStyle}">`;
        }
        return "<span>";
      }

      return `<${tag}>`;
    }
  );

  return out.replace(/javascript:/gi, "");
}

/** True when description has visible text (ignores empty HTML from the editor). */
export function hasDescriptionContent(raw?: string | null): boolean {
  if (!raw) return false;
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (/<hr\b/i.test(trimmed)) return true;

  const text = trimmed
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  return text.length > 0;
}

/** Plain text → escaped HTML with line breaks; rich HTML → sanitized. */
export function descriptionToSafeHtml(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/<[a-z][^>]*>/i.test(trimmed)) {
    return sanitizeDescriptionHtml(trimmed);
  }
  return escapeHtml(trimmed).replace(/\n/g, "<br>");
}
