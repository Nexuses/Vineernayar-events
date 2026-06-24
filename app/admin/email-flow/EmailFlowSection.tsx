"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  applyEmailTemplate,
  getSampleJoinVars,
  getSampleSequenceContext,
  sequenceContextToVars,
} from "@/lib/email-template-registry";

type TemplateItem = {
  key: string;
  label: string;
  schedule: string;
  group: string;
  placeholders: string[];
  defaultHtml: string;
  customHtml: string | null;
  hasCustom: boolean;
  previewHtml: string;
  editorHtml: string;
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

function HtmlPreviewModal({
  title,
  html,
  onClose,
}: {
  title: string;
  html: string;
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
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-zinc-900">HTML preview</h3>
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
        <div className="min-h-0 flex-1 overflow-auto bg-zinc-100 p-4">
          <iframe
            title={`Email preview: ${title}`}
            srcDoc={html}
            className="h-[70vh] w-full rounded-lg border border-zinc-200 bg-white"
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}

export function EmailFlowSection() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ key: string; title: string; html: string } | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [resettingKey, setResettingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/email-templates");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load email templates");
        return;
      }
      const list = Array.isArray(data.templates) ? (data.templates as TemplateItem[]) : [];
      setTemplates(list);
      const nextDrafts: Record<string, string> = {};
      for (const item of list) {
        nextDrafts[item.key] = item.editorHtml;
      }
      setDrafts(nextDrafts);
      if (list.length > 0 && !openKey) {
        setOpenKey(list[0].key);
      }
    } catch {
      setError("Failed to load email templates");
    } finally {
      setLoading(false);
    }
  }, [openKey]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const grouped = useMemo(() => {
    const groups = new Map<string, TemplateItem[]>();
    for (const item of templates) {
      const list = groups.get(item.group) ?? [];
      list.push(item);
      groups.set(item.group, list);
    }
    return Array.from(groups.entries());
  }, [templates]);

  async function handleSave(key: string) {
    const html = drafts[key] ?? "";
    setSavingKey(key);
    setSavedKey(null);
    try {
      const res = await fetch("/api/admin/email-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, html }),
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
                customHtml: data.customHtml,
                hasCustom: true,
                previewHtml: data.previewHtml,
                editorHtml: data.editorHtml,
              }
            : item
        )
      );
      setDrafts((prev) => ({ ...prev, [key]: data.editorHtml }));
      setSavedKey(key);
      setTimeout(() => setSavedKey((current) => (current === key ? null : current)), 2500);
    } catch {
      setError("Failed to save template");
    } finally {
      setSavingKey(null);
    }
  }

  async function handleReset(key: string) {
    if (!confirm("Reset this template to the built-in default? Your custom HTML will be removed.")) {
      return;
    }
    setResettingKey(key);
    setSavedKey(null);
    try {
      const res = await fetch("/api/admin/email-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, reset: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to reset template");
        return;
      }
      setTemplates((prev) =>
        prev.map((item) =>
          item.key === key
            ? {
                ...item,
                customHtml: null,
                hasCustom: false,
                previewHtml: data.previewHtml,
                editorHtml: data.editorHtml,
              }
            : item
        )
      );
      setDrafts((prev) => ({ ...prev, [key]: data.editorHtml }));
    } catch {
      setError("Failed to reset template");
    } finally {
      setResettingKey(null);
    }
  }

  function openPreview(item: TemplateItem) {
    setPreview({
      key: item.key,
      title: item.label,
      html: item.previewHtml,
    });
  }

  function previewEditorHtml(item: TemplateItem, html: string): string {
    if (item.key === "join_thank_you" || item.key === "join_notify") {
      return applyEmailTemplate(html, getSampleJoinVars());
    }
    if (/\{\{\w+\}\}/.test(html)) {
      return applyEmailTemplate(html, sequenceContextToVars(getSampleSequenceContext()));
    }
    return html;
  }

  function openDraftPreview(item: TemplateItem) {
    const html = drafts[item.key] ?? item.editorHtml;
    setPreview({
      key: item.key,
      title: item.label,
      html: previewEditorHtml(item, html),
    });
  }

  if (loading) {
    return <p className="mt-6 text-sm text-zinc-500">Loading email templates…</p>;
  }

  return (
    <div className="mt-6 space-y-6">
      {error ? (
        <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {grouped.map(([group, items]) => (
        <section key={group}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            {group}
          </h2>
          <div className="space-y-3">
            {items.map((item) => {
              const isOpen = openKey === item.key;
              const draft = drafts[item.key] ?? item.editorHtml;
              const isDirty = draft !== item.editorHtml;

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
                          onClick={() => openPreview(item)}
                          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                        >
                          View HTML
                        </button>
                        <button
                          type="button"
                          onClick={() => openDraftPreview(item)}
                          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                        >
                          Preview current editor
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSave(item.key)}
                          disabled={savingKey === item.key}
                          className="rounded-md bg-brand-500 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-brand-600 disabled:opacity-50"
                        >
                          {savingKey === item.key ? "Saving…" : "Save changes"}
                        </button>
                        {item.hasCustom ? (
                          <button
                            type="button"
                            onClick={() => handleReset(item.key)}
                            disabled={resettingKey === item.key}
                            className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            {resettingKey === item.key ? "Resetting…" : "Reset to default"}
                          </button>
                        ) : null}
                        {savedKey === item.key ? (
                          <span className="self-center text-sm font-medium text-green-700">
                            Saved
                          </span>
                        ) : null}
                      </div>

                      <p className="mb-2 text-xs text-zinc-500">
                        Edit the HTML below. For dynamic fields, use placeholders such as{" "}
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
      ))}

      {preview ? (
        <HtmlPreviewModal
          title={preview.title}
          html={preview.html}
          onClose={() => setPreview(null)}
        />
      ) : null}
    </div>
  );
}
