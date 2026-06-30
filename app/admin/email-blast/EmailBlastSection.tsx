"use client";

import { useEffect, useMemo, useState } from "react";
import {
  applyBlastTemplate,
  EMAIL_BLAST_DEFAULT_HTML,
  EMAIL_BLAST_PLACEHOLDERS,
  getSampleBlastVars,
} from "@/lib/email-blast-template";
import type { BlastAudience } from "@/lib/models/Registration";

type EventItem = { eventId: string; eventName: string };

type RecipientPreview = {
  firstName: string;
  surname: string;
  email: string;
};

const AUDIENCE_OPTIONS: { value: BlastAudience; label: string }[] = [
  { value: "confirmed", label: "Confirmed registrants" },
  { value: "waitlisted", label: "Waitlisted" },
  { value: "all", label: "All registrants (excl. rejected)" },
];

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

export function EmailBlastSection({
  events,
  adminEmail,
}: {
  events: EventItem[];
  adminEmail: string;
}) {
  const [selectedEventId, setSelectedEventId] = useState("");
  const [audience, setAudience] = useState<BlastAudience>("confirmed");
  const [recipientCount, setRecipientCount] = useState(0);
  const [recipientPreview, setRecipientPreview] = useState<RecipientPreview[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState(EMAIL_BLAST_DEFAULT_HTML);
  const [testEmail, setTestEmail] = useState(adminEmail);
  const [editorMode, setEditorMode] = useState<"split" | "html" | "preview">("split");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingBlast, setSendingBlast] = useState(false);

  const previewHtml = useMemo(
    () => applyBlastTemplate(html, getSampleBlastVars()),
    [html]
  );
  const previewSubject = useMemo(
    () => applyBlastTemplate(subject || "Email subject preview", getSampleBlastVars()),
    [subject]
  );

  useEffect(() => {
    setTestEmail(adminEmail);
  }, [adminEmail]);

  useEffect(() => {
    if (!selectedEventId) {
      setRecipientCount(0);
      setRecipientPreview([]);
      return;
    }

    setLoadingRecipients(true);
    fetch(
      `/api/admin/email-blast/recipients?eventId=${encodeURIComponent(selectedEventId)}&audience=${encodeURIComponent(audience)}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setRecipientCount(0);
          setRecipientPreview([]);
          return;
        }
        setRecipientCount(data.count ?? 0);
        setRecipientPreview(Array.isArray(data.preview) ? data.preview : []);
        setError("");
      })
      .catch(() => {
        setRecipientCount(0);
        setRecipientPreview([]);
      })
      .finally(() => setLoadingRecipients(false));
  }, [selectedEventId, audience]);

  async function handleSendTest() {
    if (!selectedEventId) {
      setError("Select an event first");
      return;
    }
    setSendingTest(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/admin/email-blast/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEventId,
          audience,
          subject,
          html,
          testEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to send test email");
        return;
      }
      setMessage(`Test email sent to ${data.sentTo}.`);
    } catch {
      setError("Unable to send test email");
    } finally {
      setSendingTest(false);
    }
  }

  async function handleSendBlast() {
    if (!selectedEventId) {
      setError("Select an event first");
      return;
    }
    if (recipientCount === 0) {
      setError("No recipients for this selection");
      return;
    }
    const eventName = events.find((e) => e.eventId === selectedEventId)?.eventName || "this event";
    const audienceLabel = AUDIENCE_OPTIONS.find((o) => o.value === audience)?.label || audience;
    if (
      !window.confirm(
        `Send this campaign to ${recipientCount} recipient(s) for "${eventName}" (${audienceLabel})?`
      )
    ) {
      return;
    }

    setSendingBlast(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/admin/email-blast/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEventId,
          audience,
          subject,
          html,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to send campaign");
        return;
      }
      if (data.failed > 0) {
        setMessage(
          `Campaign sent to ${data.sent} of ${data.total} recipients. ${data.failed} failed.`
        );
        setError(
          data.failures?.length
            ? `Failed: ${data.failures.map((f: { email: string }) => f.email).join(", ")}`
            : "Some emails failed to send."
        );
      } else {
        setMessage(`Campaign sent successfully to ${data.sent} recipient(s).`);
      }
    } catch {
      setError("Unable to send campaign");
    } finally {
      setSendingBlast(false);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700">Select event</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">Choose an event</option>
            {events.map((ev) => (
              <option key={ev.eventId} value={ev.eventId}>
                {ev.eventName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700">Recipients</label>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value as BlastAudience)}
            disabled={!selectedEventId}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 disabled:opacity-50"
          >
            {AUDIENCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedEventId ? (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
          {loadingRecipients ? (
            "Loading recipients…"
          ) : (
            <>
              <span className="font-semibold text-zinc-900">{recipientCount}</span> recipient
              {recipientCount === 1 ? "" : "s"} selected
              {recipientPreview.length > 0 ? (
                <span className="mt-1 block text-zinc-500">
                  e.g. {recipientPreview.map((r) => `${r.firstName} ${r.surname}`).join(", ")}
                  {recipientCount > recipientPreview.length ? "…" : ""}
                </span>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {message ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Important update for {{eventName}}"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
        />
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <label className="text-sm font-medium text-zinc-700">HTML email</label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Preview HTML
            </button>
            <div className="flex rounded-md border border-zinc-200 bg-white p-0.5 lg:hidden">
              {(["html", "preview"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setEditorMode(mode)}
                  className={`rounded px-2.5 py-1 text-xs font-medium capitalize ${
                    editorMode === mode ? "bg-zinc-900 text-white" : "text-zinc-700"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mb-2 text-xs text-zinc-500">
          Placeholders:{" "}
          {EMAIL_BLAST_PLACEHOLDERS.map((p) => `{{${p}}}`).join(", ")}
        </p>

        <div className="overflow-hidden rounded-lg border border-zinc-300">
          <div className="hidden border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 lg:grid lg:grid-cols-2 lg:gap-4">
            <span>HTML editor</span>
            <span>Live preview (sample data)</span>
          </div>
          <div className="grid lg:grid-cols-2">
            {(editorMode === "split" || editorMode === "html") && (
              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                rows={18}
                className="min-h-[320px] w-full resize-y border-0 bg-white p-3 font-mono text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500 lg:min-h-[420px] lg:border-r lg:border-zinc-200"
                spellCheck={false}
              />
            )}
            {(editorMode === "split" || editorMode === "preview") && (
              <div className="min-h-[320px] border-t border-zinc-200 bg-zinc-100 p-3 lg:min-h-[420px] lg:border-t-0">
                <p className="mb-2 text-xs font-medium text-zinc-500">Subject: {previewSubject}</p>
                <iframe
                  title="Email blast preview"
                  srcDoc={previewHtml}
                  className="h-[280px] w-full rounded-md border border-zinc-200 bg-white lg:h-[380px]"
                  sandbox="allow-same-origin"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full max-w-md">
          <label className="mb-1 block text-sm font-medium text-zinc-700">Test email</label>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSendTest}
            disabled={sendingTest || sendingBlast || !selectedEventId}
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
          >
            {sendingTest ? "Sending…" : "Send test"}
          </button>
          <button
            type="button"
            onClick={handleSendBlast}
            disabled={sendingBlast || sendingTest || !selectedEventId || recipientCount === 0}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {sendingBlast ? "Sending blast…" : `Send blast (${recipientCount})`}
          </button>
        </div>
      </div>

      {showPreviewModal ? (
        <HtmlPreviewModal
          title={previewSubject}
          html={previewHtml}
          onClose={() => setShowPreviewModal(false)}
        />
      ) : null}
    </div>
  );
}
