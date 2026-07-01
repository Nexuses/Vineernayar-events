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
  "h1",
  "h2",
  "h3",
  "mark",
  "blockquote",
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

function sanitizeFontWeightStyle(style: string): string | null {
  for (const declaration of style.split(";")) {
    const colon = declaration.indexOf(":");
    if (colon === -1) continue;
    const prop = declaration.slice(0, colon).trim().toLowerCase();
    if (prop !== "font-weight") continue;
    const value = declaration.slice(colon + 1).replace(/\s*!important/gi, "").trim().toLowerCase();
    if (/^(normal|bold|bolder|lighter)$/.test(value)) return `font-weight: ${value}`;
    const numeric = Number.parseInt(value, 10);
    if (Number.isFinite(numeric) && numeric >= 100 && numeric <= 900 && numeric % 100 === 0) {
      return `font-weight: ${numeric}`;
    }
  }
  return null;
}

function sanitizeColorStyle(style: string): string | null {
  for (const declaration of style.split(";")) {
    const colon = declaration.indexOf(":");
    if (colon === -1) continue;
    const prop = declaration.slice(0, colon).trim().toLowerCase();
    if (prop !== "color" && prop !== "text-color") continue;
    const value = declaration.slice(colon + 1).replace(/\s*!important/gi, "").trim().toLowerCase();
    if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(value)) {
      return `color: ${value}`;
    }
    const rgb = value.match(
      /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(0|1|0?\.\d+))?\s*\)$/
    );
    if (rgb) {
      const [, r, g, b, a] = rgb;
      if ([r, g, b].every((channel) => Number(channel) <= 255)) {
        return a !== undefined ? `color: rgba(${r}, ${g}, ${b}, ${a})` : `color: rgb(${r}, ${g}, ${b})`;
      }
    }
  }
  return null;
}

function sanitizeBackgroundStyle(style: string): string | null {
  for (const declaration of style.split(";")) {
    const colon = declaration.indexOf(":");
    if (colon === -1) continue;
    const prop = declaration.slice(0, colon).trim().toLowerCase();
    if (prop !== "background" && prop !== "background-color") continue;
    const value = declaration.slice(colon + 1).replace(/\s*!important/gi, "").trim().toLowerCase();
    if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(value)) {
      return `background-color: ${value}`;
    }
  }
  return null;
}

function sanitizeInlineStyle(style: string): string | null {
  const parts = [
    sanitizeFontSizeStyle(style),
    sanitizeFontWeightStyle(style),
    sanitizeColorStyle(style),
    sanitizeBackgroundStyle(style),
  ].filter(Boolean);
  return parts.length > 0 ? parts.join("; ") : null;
}

function extractSafeStyle(attrs: string): string | null {
  const match = attrs.match(/\bstyle\s*=\s*["']([^"']*)["']/i);
  if (!match) return null;
  return sanitizeInlineStyle(match[1]);
}

const STYLE_ALLOWED_TAGS = new Set([
  "p",
  "div",
  "span",
  "strong",
  "b",
  "em",
  "i",
  "h1",
  "h2",
  "h3",
  "mark",
]);

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
        const safeStyle = extractSafeStyle(attrs);
        if (extractClass(attrs) === DESC_GAP_LG) {
          return safeStyle
            ? `<div class="${DESC_GAP_LG}" style="${safeStyle}">`
            : `<div class="${DESC_GAP_LG}">`;
        }
        return safeStyle ? `<div style="${safeStyle}">` : "<div>";
      }

      if (STYLE_ALLOWED_TAGS.has(tag)) {
        const safeStyle = extractSafeStyle(attrs);
        return safeStyle ? `<${tag} style="${safeStyle}">` : `<${tag}>`;
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
