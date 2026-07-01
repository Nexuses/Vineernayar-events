export type EventAgendaItem = {
  time: string;
  title: string;
  description: string;
};

function parseAgendaItem(raw: unknown): EventAgendaItem | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const time = String(item.time ?? "").trim();
  const title = String(item.title ?? "").trim();
  const description = String(item.description ?? "").trim();
  if (!time || !title) return null;
  return { time, title, description };
}

/** Trim and drop incomplete entries for storing on the event. */
export function normalizeEventAgenda(items: EventAgendaItem[]): EventAgendaItem[] {
  return items
    .map((item) => ({
      time: item.time.trim(),
      title: item.title.trim(),
      description: item.description.trim(),
    }))
    .filter((item) => item.time && item.title);
}

export function eventAgendaFromJsonBody(body: Record<string, unknown>): EventAgendaItem[] {
  if (Array.isArray(body.agenda)) {
    return normalizeEventAgenda(
      body.agenda.map(parseAgendaItem).filter((item): item is EventAgendaItem => item !== null)
    );
  }
  if (typeof body.agenda === "string" && body.agenda.trim()) {
    try {
      const parsed = JSON.parse(body.agenda) as unknown;
      if (!Array.isArray(parsed)) return [];
      return normalizeEventAgenda(
        parsed.map(parseAgendaItem).filter((item): item is EventAgendaItem => item !== null)
      );
    } catch {
      return [];
    }
  }
  return [];
}

export function eventAgendaFromFormData(formData: FormData): EventAgendaItem[] {
  const raw = formData.get("agenda");
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return normalizeEventAgenda(
      parsed.map(parseAgendaItem).filter((item): item is EventAgendaItem => item !== null)
    );
  } catch {
    return [];
  }
}
