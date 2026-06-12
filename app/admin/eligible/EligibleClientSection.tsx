"use client";

import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";

type EligibleItem = { _id: string; email: string };
type EventItem = { _id: string; eventId: string; eventName: string };

function stripQuotes(s: string): string {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'")))
    return t.slice(1, -1).trim();
  return t;
}

function parseCSV(text: string): string[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map((h) => stripQuotes(h).toLowerCase());
  const emailIdx = header.findIndex((h) => h === "email");
  if (emailIdx === -1) return [];
  const emails: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",").map((c) => stripQuotes(c.trim()));
    const val = cells[emailIdx];
    if (val && val.includes("@")) emails.push(val);
  }
  return emails;
}

function parseExcel(buffer: ArrayBuffer): string[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
  if (!data.length) return [];
  const headerRow = (data[0] as unknown[]).map((h) => String(h).trim().toLowerCase());
  const emailIdx = headerRow.findIndex((h) => h === "email");
  if (emailIdx === -1) return [];
  const emails: string[] = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i] as unknown[];
    const val = row[emailIdx] != null ? String(row[emailIdx]).trim() : "";
    if (val && val.includes("@")) emails.push(val);
  }
  return emails;
}

export function EligibleClientSection() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [emails, setEmails] = useState<EligibleItem[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [uploadError, setUploadError] = useState("");
  const [modal, setModal] = useState<{ unique: number; duplicate: number; toAdd: string[] } | null>(null);
  const [bulkAdding, setBulkAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEventsLoading(true);
    fetch("/api/admin/events")
      .then((r) => r.json())
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setEventsLoading(false));
  }, []);

  function refreshList() {
    if (!selectedEventId) {
      setEmails([]);
      return;
    }
    setListLoading(true);
    fetch(`/api/admin/eligible?eventId=${encodeURIComponent(selectedEventId)}`)
      .then((r) => r.json())
      .then((data) => setEmails(Array.isArray(data) ? data : []))
      .catch(() => setEmails([]))
      .finally(() => setListLoading(false));
  }

  useEffect(() => {
    refreshList();
  }, [selectedEventId]);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim() || !selectedEventId) return;
    setLoading(true);
    fetch("/api/admin/eligible", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: selectedEventId, email: newEmail.trim() }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.email) {
          setEmails((prev) => [{ ...data, _id: data._id?.toString() || "" }, ...prev]);
          setNewEmail("");
        }
      })
      .finally(() => setLoading(false));
  }

  function handleRemove(email: string) {
    if (!selectedEventId) return;
    fetch(
      `/api/admin/eligible?eventId=${encodeURIComponent(selectedEventId)}&email=${encodeURIComponent(email)}`,
      { method: "DELETE" }
    ).then(() => setEmails((prev) => prev.filter((e) => e.email !== email)));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    setUploadError("");
    setModal(null);
    if (!file || !selectedEventId) return;

    const existingSet = new Set(emails.map((x) => x.email.toLowerCase().trim()));
    let parsed: string[] = [];

    try {
      const name = file.name.toLowerCase();
      if (name.endsWith(".csv")) {
        const text = await file.text();
        parsed = parseCSV(text);
      } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
        const buffer = await file.arrayBuffer();
        parsed = parseExcel(buffer);
      } else {
        setUploadError("Please upload a CSV or Excel file (.csv, .xlsx, .xls).");
        return;
      }
    } catch {
      setUploadError("Could not read the file.");
      return;
    }

    const normalized = parsed.map((e) => e.toLowerCase().trim()).filter((e) => e && e.includes("@"));
    if (normalized.length === 0) {
      setUploadError("No valid emails found. File must have a column header named 'email' or 'Email'.");
      return;
    }

    const uniqueFromFile = [...new Set(normalized)];
    const toAdd = uniqueFromFile.filter((e) => !existingSet.has(e));
    const duplicate = normalized.length - toAdd.length;

    setModal({
      unique: toAdd.length,
      duplicate,
      toAdd,
    });
  }

  async function handleBulkAdd() {
    if (!modal || modal.toAdd.length === 0 || !selectedEventId) return;
    setBulkAdding(true);
    try {
      const res = await fetch("/api/admin/eligible", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: selectedEventId, emails: modal.toAdd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add");
      setModal(null);
      refreshList();
    } catch {
      setUploadError("Failed to add emails.");
    } finally {
      setBulkAdding(false);
    }
  }

  const selectedEvent = events.find((e) => e.eventId === selectedEventId);

  return (
    <div className="mt-6 space-y-6">
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          Select event
        </label>
        {eventsLoading ? (
          <p className="text-sm text-zinc-500">Loading events…</p>
        ) : (
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full max-w-md rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">Choose an event</option>
            {events.map((ev) => (
              <option key={ev.eventId} value={ev.eventId}>
                {ev.eventName}
              </option>
            ))}
          </select>
        )}
      </div>

      {!selectedEventId ? null : (
        <>
          <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2">
            <div className="min-w-[200px] flex-1">
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Add eligible email
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder:text-zinc-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-brand-500 px-4 py-2 font-medium text-zinc-900 hover:bg-brand-600 disabled:opacity-50"
            >
              {loading ? "Adding…" : "Add"}
            </button>
          </form>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              Upload CSV or Excel
            </label>
            <p className="mb-2 text-xs text-zinc-500">
              File must have a column header named <strong>email</strong> or <strong>Email</strong>. Duplicates (within file or already in the list) are skipped.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full max-w-md text-sm text-zinc-600 file:mr-2 file:rounded-md file:border-0 file:bg-brand-100 file:px-3 file:py-2 file:text-brand-800"
            />
            {uploadError && (
              <p className="mt-2 text-sm text-red-600">{uploadError}</p>
            )}
          </div>

          {modal !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true">
              <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-zinc-900">
                  Upload summary
                </h3>
                <div className="mt-4 space-y-2 text-sm">
                  <p>
                    <span className="font-medium text-green-600">Unique (to add):</span>{" "}
                    {modal.unique}
                  </p>
                  <p>
                    <span className="font-medium text-amber-600">Duplicates (skipped):</span>{" "}
                    {modal.duplicate}
                  </p>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={handleBulkAdd}
                    disabled={bulkAdding || modal.unique === 0}
                    className="rounded-md bg-brand-500 px-4 py-2 font-medium text-zinc-900 hover:bg-brand-600 disabled:opacity-50"
                  >
                    {bulkAdding ? "Adding…" : "Add all"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    className="rounded-md border border-zinc-300 px-4 py-2 font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold text-zinc-900">
              Eligible emails for {selectedEvent?.eventName ?? selectedEventId}
            </h2>
            {listLoading ? (
              <p className="mt-2 text-sm text-zinc-500">Loading…</p>
            ) : emails.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500">No eligible emails for this event yet. Add one above or upload a file.</p>
            ) : (
              <ul className="mt-2 space-y-1 rounded-lg border border-zinc-200">
                {emails.map((item) => (
                  <li
                    key={item._id || item.email}
                    className="flex items-center justify-between rounded-md bg-white px-3 py-2"
                  >
                    <span className="text-zinc-900">{item.email}</span>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.email)}
                      className="text-sm font-medium text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
