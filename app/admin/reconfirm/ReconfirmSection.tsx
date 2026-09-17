"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { attendanceRsvpBadgeClass } from "@/lib/attendance-rsvp";
import {
  FIRST_ROUND,
  RESPONSE_BUTTON_LABELS,
  getRound,
  getRoundLabel,
  getRoundLatestResponse,
  getRoundSendTimes,
  confirmationStatusLabel,
  formatTimeList,
  type ConfirmationActivity,
  type ConfirmationRound,
  type ConfirmationRoundStatus,
} from "@/lib/confirmation-rounds";
import {
  ConfirmationHistoryChips,
  ConfirmationHistoryTimeline,
} from "@/app/admin/ConfirmationHistory";

type EventItem = { eventId: string; eventName: string; dropdownLabel: string };

type Attendee = {
  _id: string;
  firstName: string;
  surname: string;
  email: string;
  mobileNumber?: string;
  createdAt?: string | null;
  confirmationEmailSentAt?: string | null;
  attendanceRsvpStatus?: "pending" | "reconfirmed" | "declined";
  attendanceRsvpAt?: string | null;
  confirmationRounds?: ConfirmationRound[] | null;
  confirmationActivity?: ConfirmationActivity[] | null;
  eventId?: string | null;
  eventName?: string | null;
  venue?: string | null;
};

type UploadIssue = { row: number; name: string; error: string };

type NewContact = {
  row: number;
  name: string;
  email: string;
  /** Other events this email is already registered for, if any. */
  otherEvents?: string[];
};

type RoundSummary = {
  round: number;
  roundLabel: string;
  sentAt: string[];
  status: ConfirmationRoundStatus;
  respondedAt: string | null;
};

type AlreadySentContact = {
  row: number;
  name: string;
  email: string;
  rounds: RoundSummary[];
  otherEvents: string[];
};

type PreviewResult = {
  total: number;
  willRegister: number;
  alreadyRegistered: number;
  failed: number;
  newContacts: NewContact[];
  truncatedNewContacts: number;
  sendable: number;
  alreadySent: number;
  roundLabel: string;
  alreadySentContacts: AlreadySentContact[];
  truncatedAlreadySent: number;
};

type UploadResult = {
  total: number;
  registered: number;
  alreadyRegistered: number;
  emailed: number;
  emailFailed: number;
  skipped?: number;
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

/** The latest click for a round, tied to the email it came from. */
function ResponseCell({ response }: { response: ReturnType<typeof getRoundLatestResponse> }) {
  if (!response) return null;
  const status = response.status as ConfirmationRoundStatus | undefined;
  return (
    <div className="min-w-[13rem]">
      <div className="whitespace-nowrap text-zinc-800">{formatWhen(response.at)}</div>
      <div className="text-xs text-zinc-500">
        Clicked &ldquo;{status && status !== "pending" ? RESPONSE_BUTTON_LABELS[status] : "a response"}&rdquo;
      </div>
      {response.answeredEmailSentAt ? (
        <div className="text-xs text-zinc-500">
          on the email sent {formatWhen(response.answeredEmailSentAt)}
        </div>
      ) : response.attribution === "ambiguous" && response.candidateEmailSentAt?.length ? (
        <div className="text-xs text-zinc-500">
          on the email sent{" "}
          {formatTimeList(response.candidateEmailSentAt.map((at) => formatWhen(at)))}
          <span className="text-zinc-400"> · can&rsquo;t tell which</span>
        </div>
      ) : !response.recorded ? (
        <div className="text-xs text-amber-700">on an earlier email · send time overwritten</div>
      ) : null}
    </div>
  );
}

export function ReconfirmSection({
  events,
  readOnly,
  round = FIRST_ROUND,
}: {
  events: EventItem[];
  readOnly: boolean;
  round?: number;
}) {
  const roundLabel = getRoundLabel(round);
  const [selectedEventId, setSelectedEventId] = useState("");
  const selectedEventLabel =
    events.find((e) => e.eventId === selectedEventId)?.dropdownLabel ?? "this event";
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [pendingCsv, setPendingCsv] = useState<string>("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [attendees, setAttendees] = useState<Attendee[] | null>(null);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
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

  /** Step 1 — check the file. Nothing is registered or sent yet. */
  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (readOnly || !selectedEventId || !csvFile) return;

    setError("");
    setResult(null);
    setChecking(true);
    try {
      const csv = await csvFile.text();
      const res = await fetch("/api/admin/reconfirm/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: selectedEventId, csv, round, dryRun: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Unable to read the file");
        return;
      }
      setPendingCsv(csv);
      if (data.willRegister > 0 || data.alreadySent > 0) {
        // New contacts, and contacts who would get this round's email a second
        // time, both need an explicit go-ahead before anything is sent.
        setPreview(data);
      } else {
        await runUpload(csv);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  /** Step 2 — actually register the new contacts and send the emails. */
  async function runUpload(csv: string, skipAlreadySent = false) {
    setPreview(null);
    setError("");
    setUploading(true);
    try {
      const res = await fetch("/api/admin/reconfirm/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: selectedEventId, csv, round, skipAlreadySent }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Unable to process the upload");
        return;
      }
      setResult(data);
      setCsvFile(null);
      setPendingCsv("");
      if (fileRef.current) fileRef.current.value = "";
      await refreshAttendees();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  const emailed = attendees?.filter((a) => getRound(a, round).emailSentAt) ?? [];
  const confirmedCount = emailed.filter((a) => getRound(a, round).status === "reconfirmed").length;
  const q = search.trim().toLowerCase();
  const visible = q
    ? emailed.filter((a) =>
        `${a.firstName} ${a.surname} ${a.email}`.toLowerCase().includes(q)
      )
    : emailed;

  return (
    <div className="mt-6 space-y-6">
      <div>
        <label htmlFor="reconfirm-event" className="mb-2 block text-sm font-medium text-zinc-700">
          Select event
        </label>
        <select
          id="reconfirm-event"
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
                  {result.skipped ? ` · ${result.skipped} skipped (already sent)` : ""}
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
            <label htmlFor="reconfirm-csv" className="mb-1.5 block text-sm font-medium text-zinc-700">
              CSV file
            </label>
            <input
              id="reconfirm-csv"
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
            disabled={uploading || checking || !csvFile}
            className="mt-5 rounded-md bg-brand-500 px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {checking
              ? "Checking file…"
              : uploading
                ? "Uploading & sending…"
                : "Upload and send confirmation emails"}
          </button>
        </form>
      ) : null}

      {preview ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-contacts-title"
        >
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="border-b border-zinc-200 px-5 py-4">
              <h3 id="new-contacts-title" className="text-base font-semibold text-zinc-900">
                Check before sending
              </h3>
              <p className="mt-1 text-sm text-zinc-600">
                Sending the <span className="font-medium text-zinc-800">{preview.roundLabel}</span> email
                for <span className="font-medium text-zinc-800">{selectedEventLabel}</span>.
              </p>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
              {preview.alreadySent > 0 ? (
                <section>
                  <h4 className="text-sm font-semibold text-amber-800">
                    {preview.alreadySent === 1
                      ? `1 contact was already sent this ${preview.roundLabel} email`
                      : `${preview.alreadySent} contacts were already sent this ${preview.roundLabel} email`}
                  </h4>
                  <p className="mt-0.5 text-xs text-zinc-600">
                    Sending again gives them a second copy. Their earlier sends and answers stay in
                    their history.
                  </p>
                  <ul className="mt-2 divide-y divide-zinc-100 rounded-md border border-amber-200 bg-amber-50/40 text-sm">
                    {preview.alreadySentContacts.map((c) => (
                      <li key={`sent-${c.row}-${c.email}`} className="px-3 py-2">
                        <div className="flex justify-between gap-3">
                          <span className="font-medium text-zinc-900">{c.name}</span>
                          <span className="truncate text-zinc-500">{c.email}</span>
                        </div>
                        {c.rounds.map((r) => (
                          <p key={r.round} className="mt-0.5 text-xs text-zinc-700">
                            <span className="font-medium">{r.roundLabel}:</span>{" "}
                            {r.sentAt.length > 0
                              ? `sent ${formatWhen(r.sentAt[r.sentAt.length - 1])}${
                                  r.sentAt.length > 1 ? ` (${r.sentAt.length} sends)` : ""
                                }`
                              : "not sent"}
                            {" · "}
                            {r.status === "pending"
                              ? "no response yet"
                              : `answered ${
                                  r.status === "reconfirmed" ? "Yes" : "No"
                                }${r.respondedAt ? ` on ${formatWhen(r.respondedAt)}` : ""}`}
                          </p>
                        ))}
                        {c.otherEvents.length > 0 ? (
                          <p className="mt-0.5 text-xs text-amber-700">
                            Also registered for {c.otherEvents.join(", ")}.
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  {preview.truncatedAlreadySent > 0 ? (
                    <p className="pt-1 text-xs text-zinc-500">…and {preview.truncatedAlreadySent} more.</p>
                  ) : null}
                </section>
              ) : null}

              {preview.willRegister > 0 ? (
                <section>
                  <h4 className="text-sm font-semibold text-zinc-900">
                    {preview.willRegister === 1
                      ? "1 contact is not registered for this event"
                      : `${preview.willRegister} contacts are not registered for this event`}
                  </h4>
                  <p className="mt-0.5 text-xs text-zinc-600">
                    They will be auto-registered. Matching is per event, so someone registered for
                    another city still counts as new here.
                  </p>
                  <ul className="mt-2 divide-y divide-zinc-100 rounded-md border border-zinc-200 text-sm">
                    {preview.newContacts.map((c) => (
                      <li key={`new-${c.row}-${c.email}`} className="px-3 py-2">
                        <div className="flex justify-between gap-3">
                          <span className="font-medium text-zinc-900">{c.name}</span>
                          <span className="truncate text-zinc-500">{c.email}</span>
                        </div>
                        {c.otherEvents && c.otherEvents.length > 0 ? (
                          <p className="mt-0.5 text-xs text-amber-700">
                            Already registered for {c.otherEvents.join(", ")} — but not this event.
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  {preview.truncatedNewContacts > 0 ? (
                    <p className="pt-1 text-xs text-zinc-500">…and {preview.truncatedNewContacts} more.</p>
                  ) : null}
                </section>
              ) : null}
            </div>

            <div className="border-t border-zinc-200 bg-zinc-50 px-5 py-3">
              <p className="text-xs text-zinc-600">
                {preview.sendable} contact{preview.sendable === 1 ? "" : "s"} in the file
                {preview.failed > 0 ? ` · ${preview.failed} row(s) have errors and will be skipped` : ""}.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => runUpload(pendingCsv)}
                  className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-zinc-900 hover:opacity-90"
                >
                  {preview.alreadySent > 0 ? "Send to everyone" : "Yes, register and send"}
                </button>
                {preview.alreadySent > 0 && preview.sendable - preview.alreadySent > 0 ? (
                  <button
                    type="button"
                    onClick={() => runUpload(pendingCsv, true)}
                    className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
                  >
                    Skip the {preview.alreadySent} already sent
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setPreview(null);
                    setPendingCsv("");
                  }}
                  className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {selectedEventId ? (
        <div className="rounded-lg border border-zinc-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-800">{roundLabel} tracking</h2>
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
                ? `No ${roundLabel.toLowerCase()} emails have been sent for this event yet.`
                : "No attendees match your search."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Name</th>
                    <th className="px-4 py-2.5 font-semibold">Email</th>
                    <th className="px-4 py-2.5 font-semibold">{roundLabel} email sent</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5 font-semibold">Response</th>
                    <th className="px-4 py-2.5 font-semibold">History</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {visible.map((a) => {
                    const status = getRound(a, round).status;
                    const sends = getRoundSendTimes(a, round);
                    const response = getRoundLatestResponse(a, round);
                    const open = expandedId === a._id;
                    return (
                      <Fragment key={a._id}>
                        <tr
                          onClick={() => setExpandedId(open ? null : a._id)}
                          className="cursor-pointer align-top hover:bg-zinc-50"
                        >
                          <td className="px-4 py-2.5 font-medium text-zinc-900">
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                aria-hidden
                                className={`inline-block text-zinc-400 transition-transform ${open ? "rotate-90" : ""}`}
                              >
                                ›
                              </span>
                              {`${a.firstName} ${a.surname}`.trim()}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-zinc-700">{a.email}</td>
                          <td className="px-4 py-2.5 whitespace-nowrap text-zinc-600">
                            {sends.length === 0 ? (
                              "—"
                            ) : (
                              <>
                                <div>{formatWhen(sends[0])}</div>
                                {sends.slice(1).map((at) => (
                                  <div key={at} className="text-xs text-zinc-500">
                                    resent {formatWhen(at)}
                                  </div>
                                ))}
                              </>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${attendanceRsvpBadgeClass(
                                status
                              )}`}
                            >
                              {confirmationStatusLabel(status)}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-zinc-600">
                            {response ? (
                              <ResponseCell response={response} />
                            ) : (
                              <span className="text-zinc-400">No click yet</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <ConfirmationHistoryChips registration={a} />
                          </td>
                        </tr>
                        {open ? (
                          <tr className="bg-zinc-50">
                            <td colSpan={6} className="px-6 py-4">
                              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                Activity timeline
                              </p>
                              <ConfirmationHistoryTimeline registration={a} />
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
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
