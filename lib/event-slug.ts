export function normalizeEventSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function slugFromEventName(name: string): string {
  return normalizeEventSlug(name);
}

export function isValidEventSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 2 && slug.length <= 64;
}

export function parseEventSlugInput(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const slug = normalizeEventSlug(input);
  if (!slug || !isValidEventSlug(slug)) return null;
  return slug;
}
