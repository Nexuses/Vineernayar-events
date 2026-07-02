"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { applyEmailTemplate } from "@/lib/email-template-client";

type EventItem = {
  eventId: string;
  eventName: string;
  dropdownLabel: string;
};

type TemplateItem = {
  key: string;
  label: string;
  schedule: string;
  group: string;
  placeholders: string[];
  defaultText: string;
  customText: string | null;
  hasCustom: boolean;
  eventScoped?: boolean;
  previewText: string;
  editorText: string;
};

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-zinc-500 transition-transform"
      style={{ transform: open ? "rotate(180deg)" : undefined }}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function TextPreviewModal({
  title,
  text,
  onClose,
}: {
  title: string;
  text: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Preview: ${title}`}
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-zinc-900">Message preview</h3>
            <p className="text-sm text-zinc-500">{title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Close
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-zinc-50 p-4">
          <pre className="whitespace-pre-wrap rounded-lg border border-zinc-200 bg-white p-4 text-sm leading-relaxed text-zinc-900">
            {text}
          </pre>
        </div>
      </div>
    </div>
  );
}

function TemplateGroup({
  title,
  subtitle,
  items,
  openKey,
  setOpenKey,
  drafts,
  setDrafts,
  savingKey,
  resettingKey,
  savedKey,
  onSave,
  onReset,
  onPreview,
  onDraftPreview,
}: {
  title: string;
  subtitle?: string;
  items: TemplateItem[];
  openKey: string | null;
  setOpenKey: (key: string | null) => void;
  drafts: Record<string, string>;
  setDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  savingKey: string | null;
  resettingKey: string | null;
  savedKey: string | null;
  onSave: (key: string) => void;
  onReset: (key: string) => void;
  onPreview: (item: TemplateItem) => void;
  onDraftPreview: (item: TemplateItem) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-zinc-500">{title}</h2>
      {subtitle ? <p className="mb-3 text-sm text-zinc-600">{subtitle}</p> : null}
      <div className="space-y-3">
        {items.map((item) => {
          const isOpen = openKey === item.key;
          const draft = drafts[item.key] ?? item.editorText;
          const isDirty = draft !== item.editorText;

          return (
            <div
              key={item.key}
              className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
            >
              <button
                type="button"
                onClick={() => setOpenKey(isOpen ? null : item.key)}
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left hover:bg-zinc-50"
                aria-expanded={isOpen}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-zinc-900">{item.label}</span>
                    {item.hasCustom ? (
                      <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-zinc-800">
                        Custom
                      </span>
                    ) : (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                        Default
                      </span>
                    )}
                    {isDirty ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        Unsaved changes
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-zinc-500">{item.schedule}</p>
                </div>
                <ChevronIcon open={isOpen} />
              </button>

              {isOpen ? (
                <div className="border-t border-zinc-200 px-4 py-4">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onPreview(item)}
                      className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                    >
                      View message
                    </button>
                    <button
                      type="button"
                      onClick={() => onDraftPreview(item)}
                      className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                    >
                      Preview current editor
                    </button>
                    <button
                      type="button"
                      onClick={() => onSave(item.key)}
                      disabled={savingKey === item.key}
                      className="rounded-md bg-brand-500 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-brand-600 disabled:opacity-50"
                    >
                      {savingKey === item.key ? "Saving…" : "Save changes"}
                    </button>
                    {item.hasCustom ? (
                      <button
                        type="button"
                        onClick={() => onReset(item.key)}
                        disabled={resettingKey === item.key}
                        className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        {resettingKey === item.key ? "Resetting…" : "Reset to default"}
                      </button>
                    ) : null}
                    {savedKey === item.key ? (
                      <span className="self-center text-sm font-medium text-green-700">Saved</span>
                    ) : null}
                  </div>

                  <p className="mb-2 text-xs text-zinc-500">
                    Edit the message below. For dynamic fields, use placeholders such as{" "}
                    {item.placeholders.slice(0, 4).join(", ")}
                    {item.placeholders.length > 4 ? ", …" : ""}.
                  </p>

                  <textarea
                    value={draft}
                    onChange={(e) =>
                      setDrafts((prev) => ({ ...prev, [item.key]: e.target.value }))
                    }
                    spellCheck={false}
                    className="min-h-[320px] w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 font-mono text-xs leading-relaxed text-zinc-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />

                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-medium text-zinc-700">
                      Available placeholders
                    </summary>
                    <p className="mt-2 font-mono text-xs text-zinc-600">
                      {item.placeholders.join("  ")}
                    </p>
                  </details>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function WhatsAppFlowSection({ events }: { events: EventItem[] }) {
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedEventName, setSelectedEventName] = useState("");
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ key: string; title: string; text: string } | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [resettingKey, setResettingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [previewVars, setPreviewVars] = useState<Record<string, string>>({});

  const loadTemplates = useCallback(async () => {
    if (!selectedEventId) {
      setTemplates([]);
      setDrafts({});
      setPreviewVars({});
      setOpenKey(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/whatsapp-templates?eventId=${encodeURIComponent(selectedEventId)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load WhatsApp templates");
        return;
      }
      const list = Array.isArray(data.templates) ? (data.templates as TemplateItem[]) : [];
      setSelectedEventName(data.eventName || selectedEventName);
      setPreviewVars(
        data.previewVars && typeof data.previewVars === "object" ? data.previewVars : {}
      );
      setTemplates(list);
      const nextDrafts: Record<string, string> = {};
      for (const item of list) {
        nextDrafts[item.key] = item.editorText;
      }
      setDrafts(nextDrafts);
      setOpenKey(null);
    } catch {
      setError("Failed to load WhatsApp templates");
    } finally {
      setLoading(false);
    }
  }, [selectedEventId, selectedEventName]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const eventTemplates = useMemo(() => templates, [templates]);

  function requestBodyForTemplate(key: string, extra: Record<string, unknown>) {
    return { ...extra, eventId: selectedEventId };
  }

  async function handleSave(key: string) {
    const text = drafts[key] ?? "";
    setSavingKey(key);
    setSavedKey(null);
    try {
      const res = await fetch("/api/admin/whatsapp-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBodyForTemplate(key, { key, text })),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save template");
        return;
      }
      setTemplates((prev) =>
        prev.map((item) =>
          item.key === key
            ? {
                ...item,
                customText: data.customText,
                hasCustom: data.hasCustom ?? true,
                previewText: data.previewText,
                editorText: data.editorText,
              }
            : item
        )
      );
      setDrafts((prev) => ({ ...prev, [key]: data.editorText }));
      setSavedKey(key);
      setTimeout(() => setSavedKey((current) => (current === key ? null : current)), 2500);
    } catch {
      setError("Failed to save template");
    } finally {
      setSavingKey(null);
    }
  }

  async function handleReset(key: string) {
    const message = `Reset this WhatsApp message for ${selectedEventName}? Your event-specific text will be removed.`;
    if (!confirm(message)) return;

    setResettingKey(key);
    setSavedKey(null);
    try {
      const res = await fetch("/api/admin/whatsapp-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBodyForTemplate(key, { key, reset: true })),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to reset template");
        return;
      }
      setTemplates((prev) =>
        prev.map((t) =>
          t.key === key
            ? {
                ...t,
                customText: data.customText,
                hasCustom: data.hasCustom ?? false,
                previewText: data.previewText,
                editorText: data.editorText,
              }
            : t
        )
      );
      setDrafts((prev) => ({ ...prev, [key]: data.editorText }));
    } catch {
      setError("Failed to reset template");
    } finally {
      setResettingKey(null);
    }
  }

  function openPreview(item: TemplateItem) {
    setPreview({ key: item.key, title: item.label, text: item.previewText });
  }

  function openDraftPreview(item: TemplateItem) {
    const text = drafts[item.key] ?? item.editorText;
    if (/\{\{\w+\}\}/.test(text)) {
      setPreview({
        key: item.key,
        title: item.label,
        text: applyEmailTemplate(text, {
          ...previewVars,
        }),
      });
      return;
    }
    setPreview({ key: item.key, title: item.label, text });
  }

  const eventGroups = useMemo(() => {
    const groups = new Map<string, TemplateItem[]>();
    for (const item of eventTemplates) {
      const list = groups.get(item.group) ?? [];
      list.push(item);
      groups.set(item.group, list);
    }
    return Array.from(groups.entries());
  }, [eventTemplates]);

  if (events.length === 0) {
    return <p className="mt-6 text-sm text-zinc-500">Create an event first to manage WhatsApp templates.</p>;
  }

  return (
    <div className="mt-6 space-y-6">
      <div>
        <label htmlFor="whatsapp-flow-event" className="mb-2 block text-sm font-medium text-zinc-700">
          Select event
        </label>
        <select
          id="whatsapp-flow-event"
          value={selectedEventId}
          onChange={(e) => {
            const next = events.find((ev) => ev.eventId === e.target.value);
            setSelectedEventId(e.target.value);
            setSelectedEventName(next?.eventName ?? "");
            setError("");
          }}
          className="w-full max-w-md rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">Choose an event</option>
          {events.map((ev) => (
            <option key={ev.eventId} value={ev.eventId}>
              {ev.dropdownLabel}
            </option>
          ))}
        </select>
      </div>

      {selectedEventId ? (
        <>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">
              WhatsApp flow — {selectedEventName}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Edit automated WhatsApp messages for this event. Previews use this event&apos;s details.
            </p>
          </div>

          {error ? (
            <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}

          {loading ? (
            <p className="text-sm text-zinc-500">Loading WhatsApp templates…</p>
          ) : (
            <>
              {eventGroups.map(([group, items]) => (
                <TemplateGroup
                  key={group}
                  title={group}
                  items={items}
                  openKey={openKey}
                  setOpenKey={setOpenKey}
                  drafts={drafts}
                  setDrafts={setDrafts}
                  savingKey={savingKey}
                  resettingKey={resettingKey}
                  savedKey={savedKey}
                  onSave={handleSave}
                  onReset={handleReset}
                  onPreview={openPreview}
                  onDraftPreview={openDraftPreview}
                />
              ))}

            </>
          )}
        </>
      ) : null}

      {preview ? (
        <TextPreviewModal
          title={preview.title}
          text={preview.text}
          onClose={() => setPreview(null)}
        />
      ) : null}
    </div>
  );
}
