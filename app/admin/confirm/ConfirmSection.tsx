"use client";

import { useEffect, useRef, useState } from "react";
import { attendanceRsvpBadgeClass, attendanceRsvpLabel } from "@/lib/attendance-rsvp";

type EventItem = { eventId: string; eventName: string; dropdownLabel: string };

type Attendee = {
  _id: string;
  firstName: string;
  surname: string;
  email: string;
  mobileNumber?: string;
  confirmationEmailSentAt?: string | null;
  attendanceRsvpStatus?: "pending" | "reconfirmed" | "declined";
  attendanceRsvpAt?: string | null;
};

type UploadIssue = { row: number; name: string; error: string };

type UploadResult = {
  total: number;
  registered: number;
  alreadyRegistered: number;
  emailed: number;
  emailFailed: number;
  failed: number;
  issues: UploadIssue[];
  truncatedIssues: number;
};

const CSV_HEADERS = ["First Name", "Surname", "Email", "Mobile Number"];
const CSV_SAMPLE = [
  ["Asha", "Menon", "asha.menon@example.com", "+919876543210"],
  ["Rahul", "Verma", "rahul.verma@example.com", "+919812345678"],
  ["Priya", "Nair", "priya.nair@example.com", ""],
];

function escapeCsvCell(value: string): string {
  const s = String(value ?? "").trim();
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadSampleCsv() {
  const csv = [CSV_HEADERS, ...CSV_SAMPLE].map((r) => r.map(escapeCsvCell).join(",")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "confirmation-list-sample.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function formatWhen(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function ConfirmSection({
  events,
  readOnly,
}: {
  events: EventItem[];
  readOnly: boolean;
}) {
  const [selectedEventId, setSelectedEventId] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [attendees, setAttendees] = useState<Attendee[] | null>(null);
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!selectedEventId) {
      setAttendees(null);
      return;
    }
    let active = true;
    fetch(`/api/admin/registrations?eventId=${encodeURIComponent(selectedEventId)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (active) setAttendees(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setAttendees([]);
      });
    return () => {
      active = false;
    };
  }, [selectedEventId]);

  async function refreshAttendees() {
    if (!selectedEventId) return;
    try {
      const res = await fetch(`/api/admin/registrations?eventId=${encodeURIComponent(selectedEventId)}`);
      if (res.ok) setAttendees(await res.json());
    } catch {
      /* keep the previous list on refresh failure */
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (readOnly || !selectedEventId || !csvFile) return;

    const eventName = events.find((ev) => ev.eventId === selectedEventId)?.eventName || "this event";
    if (
      !confirm(
        `Upload this list for "${eventName}"?\n\nEveryone in the file will be sent a confirmation email, including anyone who already received one.`
      )
    ) {
      return;
    }

    setError("");
    setResult(null);
    setUploading(true);
    try {
      const csv = await csvFile.text();
      const res = await fetch("/api/admin/confirm/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: selectedEventId, csv }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Unable to process the upload");
        return;
      }
      setResult(data);
      setCsvFile(null);
      if (fileRef.current) fileRef.current.value = "";
      await refreshAttendees();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  const emailed = attendees?.filter((a) => a.confirmationEmailSentAt) ?? [];
  const confirmedCount = emailed.filter((a) => a.attendanceRsvpStatus === "reconfirmed").length;
  const q = search.trim().toLowerCase();
  const visible = q
    ? emailed.filter((a) =>
        `${a.firstName} ${a.surname} ${a.email}`.toLowerCase().includes(q)
      )
    : emailed;

  return (
    <div className="mt-6 space-y-6">
      <div>
        <label htmlFor="confirm-event" className="mb-2 block text-sm font-medium text-zinc-700">
          Select event
        </label>
        <select
          id="confirm-event"
          value={selectedEventId}
          onChange={(e) => {
            setSelectedEventId(e.target.value);
            setResult(null);
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

      {readOnly ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Sub managers have view-only access. Uploading is disabled.
        </p>
      ) : null}

      {selectedEventId && !readOnly ? (
        <form onSubmit={handleUpload} className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-zinc-900">Upload attendee list</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Anyone in the file who is not registered for this event is registered automatically.
            Everyone in the file is then sent the confirmation email.
          </p>

          <button
            type="button"
            onClick={downloadSampleCsv}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Download sample CSV
          </button>

          <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs text-zinc-600">
            <p className="font-medium text-zinc-700">Required columns</p>
            <p className="mt-1">{CSV_HEADERS.join(" · ")}</p>
            <p className="mt-1.5">
              <span className="font-medium">Email</span> is required.{" "}
              <span className="font-medium">First Name</span> is required only for contacts who are
              not registered yet. A missing or non-international{" "}
              <span className="font-medium">Mobile Number</span> is accepted &mdash; the contact is
              still registered and emailed.
            </p>
          </div>

          {error ? (
            <p className="mt-4 rounded-md bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}

          {result ? (
            <div className="mt-4 space-y-3">
              <div
                className={`rounded-md border px-4 py-3 text-sm ${
                  result.failed > 0
                    ? "border-amber-200 bg-amber-50 text-amber-900"
                    : "border-emerald-200 bg-emerald-50 text-emerald-900"
                }`}
              >
                <p className="font-medium">
                  Processed {result.total} row{result.total === 1 ? "" : "s"}.
                </p>
                <p className="mt-1">
                  {result.registered} newly registered · {result.alreadyRegistered} already
                  registered · {result.emailed} email{result.emailed === 1 ? "" : "s"} sent
                  {result.emailFailed ? ` · ${result.emailFailed} failed to send` : ""}
                </p>
              </div>

              {result.issues.length > 0 ? (
                <div className="overflow-x-auto rounded-md border border-zinc-200">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Row</th>
                        <th className="px-3 py-2 font-semibold">Name</th>
                        <th className="px-3 py-2 font-semibold">Issue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {result.issues.map((issue) => (
                        <tr key={`${issue.row}-${issue.error}`}>
                          <td className="px-3 py-2 text-zinc-500">{issue.row}</td>
                          <td className="px-3 py-2 text-zinc-900">{issue.name}</td>
                          <td className="px-3 py-2 text-zinc-700">{issue.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {result.truncatedIssues > 0 ? (
                    <p className="border-t border-zinc-200 px-3 py-2 text-xs text-zinc-500">
                      …and {result.truncatedIssues} more.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4">
            <label htmlFor="confirm-csv" className="mb-1.5 block text-sm font-medium text-zinc-700">
              CSV file
            </label>
            <input
              id="confirm-csv"
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                setCsvFile(e.target.files?.[0] ?? null);
                setError("");
                setResult(null);
              }}
              disabled={uploading}
              className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200"
            />
          </div>

          <button
            type="submit"
            disabled={uploading || !csvFile}
            className="mt-5 rounded-md bg-brand-500 px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? "Uploading & sending…" : "Upload and send confirmation emails"}
          </button>
        </form>
      ) : null}

      {selectedEventId ? (
        <div className="rounded-lg border border-zinc-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-800">Confirmation tracking</h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                {emailed.length} sent · {confirmedCount} confirmed ·{" "}
                {emailed.length - confirmedCount} awaiting response
              </p>
            </div>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email"
              className="w-full max-w-xs rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {attendees === null ? (
            <p className="px-4 py-6 text-sm text-zinc-500">Loading…</p>
          ) : visible.length === 0 ? (
            <p className="px-4 py-6 text-sm text-zinc-500">
              {emailed.length === 0
                ? "No confirmation emails have been sent for this event yet."
                : "No attendees match your search."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Name</th>
                    <th className="px-4 py-2.5 font-semibold">Email</th>
                    <th className="px-4 py-2.5 font-semibold">Confirmation email sent</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5 font-semibold">Confirmed on</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {visible.map((a) => {
                    const status = a.attendanceRsvpStatus ?? "pending";
                    return (
                      <tr key={a._id}>
                        <td className="px-4 py-2.5 font-medium text-zinc-900">
                          {`${a.firstName} ${a.surname}`.trim()}
                        </td>
                        <td className="px-4 py-2.5 text-zinc-700">{a.email}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-zinc-600">
                          {formatWhen(a.confirmationEmailSentAt)}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${attendanceRsvpBadgeClass(
                              status
                            )}`}
                          >
                            {status === "reconfirmed" ? "Confirmed" : attendanceRsvpLabel(status)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-zinc-600">
                          {formatWhen(a.attendanceRsvpAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
