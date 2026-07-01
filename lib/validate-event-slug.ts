import { isEventSlugTaken } from "@/lib/models/Event";
import { parseEventSlugInput } from "@/lib/event-slug";

export async function validateEventSlugForSave(
  raw: unknown,
  options?: { excludeEventId?: string; required?: boolean }
): Promise<{ slug?: string; error?: string }> {
  const text = typeof raw === "string" ? raw.trim() : "";

  if (!text) {
    if (options?.required) {
      return { error: "URL slug is required (e.g. delhi)." };
    }
    return {};
  }

  const slug = parseEventSlugInput(text);
  if (!slug) {
    return {
      error: "Use 2–64 lowercase letters, numbers, and hyphens only (e.g. delhi).",
    };
  }

  if (await isEventSlugTaken(slug, options?.excludeEventId)) {
    return { error: "This URL slug is already in use." };
  }

  return { slug };
}
