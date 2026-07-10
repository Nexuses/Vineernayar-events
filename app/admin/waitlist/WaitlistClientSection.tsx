"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  getEffectiveDesignation,
  REGISTRATION_DESIGNATION_OTHER,
} from "@/lib/registration-field-limits";

type EventItem = {
  eventId: string;
  eventName: string;
  dropdownLabel: string;
};

type AdmissionStatus = "waitlisted" | "confirmed" | "rejected";

type WaitlistItem = {
  _id: string;
  uniqueCode: string;
  firstName: string;
  surname: string;
  email: string;
  organization?: string;
  currentDesignation?: string;
  designation?: string;
  whyAttend?: string;
  signedCopyInterested?: boolean;
  mobileNumber?: string;
  workedWithVineet?: boolean;
  workedWithVineetDetails?: string;
  questionForVineet?: string;
  addToWhatsapp?: boolean;
  whatsappNumber?: string;
  identityCardOrPassport?: string;
  specialComment?: string;
  apparelSize?: string;
  overnightStay?: boolean;
  passportNic?: string;
  transportNeeded?: boolean;
  transportLocation?: string;
  adminNotes?: string;
  admissionStatus?: AdmissionStatus;
  createdAt: string;
};

type VineetConnectionFilter = "all" | "yes" | "no";
type WhyAttendFilter = "all" | "answered" | "not_answered";

const selectClassName =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

function FilterSelect({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 flex-1 lg:min-w-[180px]">
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={selectClassName}
      >
        {children}
      </select>
    </div>
  );
}

function matchesVineetConnectionFilter(
  row: WaitlistItem,
  filter: VineetConnectionFilter
): boolean {
  if (filter === "all") return true;
  if (filter === "yes") return row.workedWithVineet === true;
  return row.workedWithVineet !== true;
}

function matchesWhyAttendFilter(row: WaitlistItem, filter: WhyAttendFilter): boolean {
  if (filter === "all") return true;
  const answered = Boolean(row.whyAttend?.trim());
  if (filter === "answered") return answered;
  return !answered;
}

function statusLabel(status?: AdmissionStatus): string {
  if (status === "confirmed") return "Accepted";
  if (status === "rejected") return "Rejected";
  return "Pending";
}

function statusBadgeClass(status?: AdmissionStatus): string {
  if (status === "confirmed") return "bg-emerald-100 text-emerald-800";
  if (status === "rejected") return "bg-red-100 text-red-800";
  return "bg-amber-100 text-amber-800";
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function escapeCsvCell(value: string): string {
  const s = String(value ?? "").trim();
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildWaitlistCsv(rows: WaitlistItem[]): string {
  const headers = [
    "First Name",
    "Surname",
    "Email",
    "Mobile Number",
    "Your Current Organisation",
    "Your Current Designation",
    "Why would you like to attend this event?",
    "Have you worked, studied, or partnered with Vineet Nayar?",
    "Tell us more about where or how you connected?",
    "Would you like to have your copy of Humans First, Machines Second signed by Vineet Nayar?",
    "Status",
  ];

  const lines = rows.map((r) =>
    [
      r.firstName,
      r.surname,
      r.email,
      r.mobileNumber || "",
      r.organization || "",
      getEffectiveDesignation(r),
      r.whyAttend || "",
      r.workedWithVineet == null ? "" : r.workedWithVineet ? "Yes" : "No",
      r.workedWithVineetDetails || "",
      r.signedCopyInterested == null ? "" : r.signedCopyInterested ? "Yes" : "No",
      statusLabel(r.admissionStatus),
    ].map(escapeCsvCell).join(",")
  );

  return [headers.map(escapeCsvCell).join(","), ...lines].join("\r\n");
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type DetailField = {
  label: string;
  value: string;
  mono?: boolean;
};

function buildWaitlistDetailFields(row: WaitlistItem, adminNotes?: string): DetailField[] {
  const fields: DetailField[] = [];
  const push = (label: string, value?: string | null, mono?: boolean) => {
    const text = value?.trim();
    if (text) fields.push({ label, value: text, mono });
  };
  const pushYesNo = (label: string, value?: boolean) => {
    if (value == null) return;
    fields.push({ label, value: value ? "Yes" : "No" });
  };

  push("First Name", row.firstName);
  push("Surname", row.surname);
  push("Email", row.email);
  push("Mobile Number", row.mobileNumber);
  push(
    "WhatsApp Number",
    row.whatsappNumber?.trim() || (row.addToWhatsapp ? row.mobileNumber : undefined)
  );
  push("Your Current Organisation", row.organization);
  const profile = row.currentDesignation?.trim();
  if (profile) {
    push("Your Current Designation", profile);
    if (profile === REGISTRATION_DESIGNATION_OTHER) {
      push("Please specify your designation", row.designation);
    }
  } else {
    push("Your Current Designation", row.designation);
  }
  pushYesNo("Have you worked, studied, or partnered with Vineet Nayar?", row.workedWithVineet);
  push("Tell us more about where or how you connected?", row.workedWithVineetDetails);
  push("Why would you like to attend this event?", row.whyAttend);
  pushYesNo(
    "Would you like to have your copy of Humans First, Machines Second signed by Vineet Nayar?",
    row.signedCopyInterested
  );
  push("Apparel - sizes", row.apparelSize);
  pushYesNo("Overnight Stay", row.overnightStay);
  push("Passport/NIC", row.passportNic);
  if (row.transportNeeded != null) {
    push("Transport", row.transportNeeded ? "Yes" : "No");
  }
  push("Location", row.transportNeeded ? row.transportLocation : undefined);
  push("Registration code", row.uniqueCode, true);
  fields.push({ label: "Waitlist status", value: statusLabel(row.admissionStatus) });
  fields.push({ label: "Registered on", value: formatDate(row.createdAt) });
  push("Admin notes", adminNotes);

  return fields;
}

function WaitlistDetailGrid({
  row,
  adminNotes,
}: {
  row: WaitlistItem;
  adminNotes?: string;
}) {
  const fields = buildWaitlistDetailFields(row, adminNotes);
  const splitAt = Math.ceil(fields.length / 2);
  const leftFields = fields.slice(0, splitAt);
  const rightFields = fields.slice(splitAt);

  function renderColumn(items: DetailField[]) {
    return (
      <dl className="space-y-2 text-sm">
        {items.map((field, index) => (
          <div key={`${field.label}-${index}`}>
            <dt className="text-zinc-500 leading-snug">{field.label}</dt>
            <dd className={`text-zinc-900 ${field.mono ? "font-mono" : ""}`}>{field.value}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
      {renderColumn(leftFields)}
      {renderColumn(rightFields)}
    </div>
  );
}

function ChevronDown({ className, open }: { className?: string; open: boolean }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
      style={{ transform: open ? "rotate(180deg)" : undefined }}
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

function matchesSearch(
  row: WaitlistItem,
  query: string,
  notes: Record<string, string>
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    row.firstName,
    row.surname,
    `${row.firstName} ${row.surname}`,
    row.email,
    row.mobileNumber,
    row.whatsappNumber,
    row.uniqueCode,
    row.organization,
    row.currentDesignation,
    row.designation,
    row.whyAttend,
    notes[row._id] ?? row.adminNotes,
    row.specialComment,
    row.questionForVineet,
    row.workedWithVineetDetails,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function WaitlistClientSection({
  events,
  readOnly = false,
  mode = "waitlist",
}: {
  events: EventItem[];
  readOnly?: boolean;
  mode?: "waitlist" | "rejected";
}) {
  const [selectedEventId, setSelectedEventId] = useState("");
  const [rows, setRows] = useState<WaitlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingNotesId, setSavingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [vineetConnectionFilter, setVineetConnectionFilter] =
    useState<VineetConnectionFilter>("all");
  const [whyAttendFilter, setWhyAttendFilter] = useState<WhyAttendFilter>("all");

  function fetchWaitlist() {
    if (!selectedEventId) return;
    setLoading(true);
    fetch(`/api/admin/waitlist?eventId=${encodeURIComponent(selectedEventId)}`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setRows(list);
        setNotesDraft(
          Object.fromEntries(list.map((r: WaitlistItem) => [r._id, r.adminNotes ?? ""]))
        );
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!selectedEventId) {
      setRows([]);
      setExpandedId(null);
      setSearchQuery("");
      setVineetConnectionFilter("all");
      setWhyAttendFilter("all");
      return;
    }
    setSearchQuery("");
    setVineetConnectionFilter("all");
    setWhyAttendFilter("all");
    fetchWaitlist();
  }, [selectedEventId]);

  const visibleRows = useMemo(() => {
    if (mode === "rejected") {
      return rows.filter((row) => row.admissionStatus === "rejected");
    }
    return rows.filter(
      (row) =>
        row.admissionStatus !== "confirmed" &&
        (row.admissionStatus === "waitlisted" || !row.admissionStatus)
    );
  }, [rows, mode]);

  const filteredRows = useMemo(
    () =>
      visibleRows.filter(
        (row) =>
          matchesSearch(row, searchQuery, notesDraft) &&
          matchesVineetConnectionFilter(row, vineetConnectionFilter) &&
          matchesWhyAttendFilter(row, whyAttendFilter)
      ),
    [visibleRows, searchQuery, notesDraft, vineetConnectionFilter, whyAttendFilter]
  );

  const statusCounts = useMemo(
    () => ({
      all: visibleRows.length,
      vineetYes: visibleRows.filter((r) => r.workedWithVineet === true).length,
      vineetNo: visibleRows.filter((r) => r.workedWithVineet !== true).length,
      whyAttendAnswered: visibleRows.filter((r) => Boolean(r.whyAttend?.trim())).length,
      whyAttendNotAnswered: visibleRows.filter((r) => !r.whyAttend?.trim()).length,
    }),
    [visibleRows]
  );

  async function handleSaveNotes(id: string) {
    if (readOnly) return;
    const adminNotes = notesDraft[id] ?? "";
    const existing = rows.find((r) => r._id === id)?.adminNotes ?? "";
    if (adminNotes === existing) return;

    setSavingNotesId(id);
    try {
      const res = await fetch(`/api/admin/waitlist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes }),
      });
      if (res.ok) {
        const data = (await res.json()) as { adminNotes?: string };
        const saved = data.adminNotes ?? adminNotes;
        setRows((prev) =>
          prev.map((r) => (r._id === id ? { ...r, adminNotes: saved } : r))
        );
        setNotesDraft((prev) => ({ ...prev, [id]: saved }));
      }
    } finally {
      setSavingNotesId(null);
    }
  }

  async function handleAction(id: string, action: "accept" | "reject", e: React.MouseEvent) {
    if (readOnly) return;
    e.stopPropagation();
    const row = rows.find((r) => r._id === id);
    const isReaccept = action === "accept" && row?.admissionStatus === "rejected";
    const label = action === "accept" ? (isReaccept ? "re-accept" : "accept") : "reject";
    if (!window.confirm(`Are you sure you want to ${label} this registration?`)) return;

    setActionId(id);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/waitlist/${id}/${action}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || `Unable to ${label} registration`);
        return;
      }
      setMessage(
        action === "accept"
          ? isReaccept
            ? "Re-accepted. Confirmation email with event pass has been sent."
            : "Accepted. Confirmation email with event pass has been sent."
          : "Rejected."
      );
      setRows((prev) =>
        prev.map((row) =>
          row._id === id
            ? {
                ...row,
                admissionStatus: action === "accept" ? "confirmed" : "rejected",
              }
            : row
        )
      );
    } catch {
      setMessage(`Unable to ${label} registration`);
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    if (readOnly) return;
    e.stopPropagation();
    if (!window.confirm("Delete this registration? This cannot be undone.")) return;

    setDeletingId(id);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/waitlist/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Unable to delete registration");
        return;
      }
      setRows((prev) => prev.filter((row) => row._id !== id));
      setNotesDraft((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (expandedId === id) setExpandedId(null);
      setMessage("Deleted.");
    } catch {
      setMessage("Unable to delete registration");
    } finally {
      setDeletingId(null);
    }
  }

  function handleExportCsv() {
    const csv = buildWaitlistCsv(filteredRows);
    const selected = events.find((ev) => ev.eventId === selectedEventId);
    const eventLabel = selected?.dropdownLabel || selected?.eventName || "waitlist";
    const safe = eventLabel
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase();
    const prefix = mode === "rejected" ? "rejected" : "waitlist";
    downloadCsv(csv, `${safe || prefix}-clients.csv`);
  }

  const listTitle = mode === "rejected" ? "Rejected" : "Waitlist";
  const searchInputId = mode === "rejected" ? "rejected-search" : "waitlist-search";
  const emptyListMessage =
    mode === "rejected"
      ? "No rejected registrations for this event."
      : "No waitlist registrations for this event.";

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    vineetConnectionFilter !== "all" ||
    whyAttendFilter !== "all";

  return (
    <div className="mt-6 space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700">
          Select event
        </label>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
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

      {message ? (
        <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
          {message}
        </p>
      ) : null}

      {selectedEventId && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-zinc-900">
              {listTitle} ({visibleRows.length})
              {hasActiveFilters ? (
                <span className="ml-2 text-sm font-normal text-zinc-500">
                  · {filteredRows.length} shown
                </span>
              ) : null}
            </h2>
            {selectedEventId && !loading ? (
              <div className="flex w-full flex-wrap items-center justify-end gap-2">
                {visibleRows.length > 0 ? (
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-700 hover:bg-zinc-50"
                  >
                    Export CSV
                  </button>
                ) : null}
                <div className="w-full max-w-sm">
                  <label className="sr-only" htmlFor={searchInputId}>
                    Search {listTitle.toLowerCase()}
                  </label>
                  <input
                    id={searchInputId}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, email, code, mobile, notes…"
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
            ) : null}
          </div>

          {visibleRows.length > 0 ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-gradient-to-b from-zinc-50 to-white p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                <FilterSelect
                  id="waitlist-vineet-filter"
                  label="Worked with Vineet Nayar?"
                  value={vineetConnectionFilter}
                  onChange={(value) =>
                    setVineetConnectionFilter(value as VineetConnectionFilter)
                  }
                >
                  <option value="all">All ({statusCounts.all})</option>
                  <option value="yes">Yes ({statusCounts.vineetYes})</option>
                  <option value="no">No ({statusCounts.vineetNo})</option>
                </FilterSelect>

                <FilterSelect
                  id="waitlist-why-attend-filter"
                  label="Why attend this event?"
                  value={whyAttendFilter}
                  onChange={(value) => setWhyAttendFilter(value as WhyAttendFilter)}
                >
                  <option value="all">All ({statusCounts.all})</option>
                  <option value="answered">Answered ({statusCounts.whyAttendAnswered})</option>
                  <option value="not_answered">
                    Not answered ({statusCounts.whyAttendNotAnswered})
                  </option>
                </FilterSelect>
              </div>
            </div>
          ) : null}

          {loading ? (
            <p className="mt-2 text-sm text-zinc-500">Loading…</p>
          ) : visibleRows.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">{emptyListMessage}</p>
          ) : filteredRows.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">No registrations match your filters.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 -mx-2 sm:mx-0">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50">
                    <th className="w-8 px-2 py-3" aria-label="Expand" />
                    <th className="px-3 py-3 font-medium text-zinc-700 sm:px-4">Name</th>
                    <th className="px-3 py-3 font-medium text-zinc-700 sm:px-4">Email</th>
                    <th className="px-3 py-3 font-medium text-zinc-700 sm:px-4">Status</th>
                    <th className="px-3 py-3 font-medium text-zinc-700 sm:px-4">Registered</th>
                    <th className="min-w-[180px] px-3 py-3 font-medium text-zinc-700 sm:px-4">Notes</th>
                    {!readOnly ? <th className="px-3 py-3 font-medium text-zinc-700 sm:px-4">Actions</th> : null}
                    {!readOnly ? <th className="w-10 px-2 py-3" aria-label="Delete" /> : null}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((r) => (
                    <React.Fragment key={r._id}>
                      <tr
                        onClick={() => setExpandedId((prev) => (prev === r._id ? null : r._id))}
                        className="cursor-pointer border-b border-zinc-100 transition-colors hover:bg-zinc-50"
                      >
                        <td className="px-2 py-3">
                          <ChevronDown className="h-5 w-5 text-zinc-500" open={expandedId === r._id} />
                        </td>
                        <td className="px-3 py-3 font-medium text-zinc-900 sm:px-4">
                          {r.firstName} {r.surname}
                        </td>
                        <td className="px-3 py-3 text-zinc-700 sm:px-4">{r.email}</td>
                        <td className="px-3 py-3 sm:px-4">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(r.admissionStatus)}`}
                          >
                            {statusLabel(r.admissionStatus)}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-zinc-600 sm:px-4">{formatDate(r.createdAt)}</td>
                        <td
                          className="px-3 py-3 sm:px-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {readOnly ? (
                            <span className="text-zinc-700">{(notesDraft[r._id] ?? "").trim() || "—"}</span>
                          ) : (
                            <input
                              type="text"
                              value={notesDraft[r._id] ?? ""}
                              onChange={(e) =>
                                setNotesDraft((prev) => ({ ...prev, [r._id]: e.target.value }))
                              }
                              onBlur={() => handleSaveNotes(r._id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  (e.target as HTMLInputElement).blur();
                                }
                              }}
                              disabled={savingNotesId === r._id}
                              placeholder="Add notes…"
                              className="w-full min-w-[140px] rounded border border-zinc-300 bg-white px-2 py-1 text-zinc-900 placeholder:text-zinc-400 disabled:opacity-50"
                            />
                          )}
                        </td>
                        {!readOnly ? (
                          <>
                            <td className="px-3 py-3 sm:px-4" onClick={(e) => e.stopPropagation()}>
                              {r.admissionStatus === "rejected" ? (
                                <button
                                  type="button"
                                  disabled={actionId === r._id}
                                  onClick={(e) => handleAction(r._id, "accept", e)}
                                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                >
                                  Re-accept
                                </button>
                              ) : r.admissionStatus === "waitlisted" || !r.admissionStatus ? (
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    disabled={actionId === r._id}
                                    onClick={(e) => handleAction(r._id, "accept", e)}
                                    className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    type="button"
                                    disabled={actionId === r._id}
                                    onClick={(e) => handleAction(r._id, "reject", e)}
                                    className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-zinc-500">—</span>
                              )}
                            </td>
                            <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={(e) => handleDelete(r._id, e)}
                                disabled={deletingId === r._id}
                                className="rounded p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                title="Delete registration"
                                aria-label="Delete registration"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </td>
                          </>
                        ) : null}
                      </tr>
                      {expandedId === r._id && (
                        <tr className="bg-zinc-50">
                          <td colSpan={readOnly ? 6 : 8} className="px-4 py-4">
                            <div className="rounded-lg border border-zinc-200 bg-white p-4">
                              <h3 className="mb-3 text-sm font-semibold text-zinc-700">
                                Full details
                              </h3>
                              <WaitlistDetailGrid
                                row={r}
                                adminNotes={notesDraft[r._id] ?? r.adminNotes}
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
